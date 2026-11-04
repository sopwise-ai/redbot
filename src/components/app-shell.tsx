"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRight,
  HistoryIcon,
  SearchIcon,
  SearchXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import { AboutView } from "@/components/about-view";
import { AppSidebar } from "@/components/app-sidebar";
import { GroupFilter, UNGROUPED_GROUP } from "@/components/group-filter";
import { HomeHero } from "@/components/home-hero";
import { HomeSections } from "@/components/home-sections";
import { HistoryView } from "@/components/history-view";
import { PillWall, type PillGroup } from "@/components/pill-wall";
import { SearchResults } from "@/components/search-results";
import { ShellHeader } from "@/components/shell-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopicsIndex } from "@/components/topics-index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { loadCorpus } from "@/lib/corpus";
import { buildHueMap, hueFor } from "@/lib/groups";
import { recordVisit } from "@/lib/history";
import { clearRecentSearches, readRecentSearches, rememberSearch } from "@/lib/recent-searches";
import { ALL, parseRoute } from "@/lib/route-state";
import type { CategoryGroup, HomeSection, LinkItem, RandomPick, TopicSummary } from "@/lib/schema";
import { createSearchIndex, createTopicIndex } from "@/lib/search";
import { site } from "@/lib/site";
import { pushUrlQuietly, replaceUrlQuietly } from "@/lib/url";
import { useHistory } from "@/lib/use-history";

export type ShellView = "wall" | "topics" | "search" | "history" | "about";

/**
 * 静态导出没有服务端读 cookie 的机会（shadcn 的 SidebarProvider 只在 server component
 * 里读 sidebar_state）。这里用 layout effect 在**绘制前**补一次恢复：用 useEffect 会先
 * 画一帧展开态再收起，肉眼能看到闪动。
 */
const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export function AppShell({
  topics,
  activeTopic,
  homeSections = [],
  randomPool = [],
  total,
  updated,
  view = "wall",
}: {
  /** 二十来个主题的摘要，每页都带；不含条目 */
  topics: TopicSummary[];
  /** 仅主题页：当前主题的完整条目 */
  activeTopic?: CategoryGroup;
  /** 仅首页：每个主题的前几条预览 */
  homeSections?: HomeSection[];
  /** 「随机一个」的构建期抽样池 */
  randomPool?: RandomPick[];
  total: number;
  updated: string;
  /** 主区域默认展示什么：按钮墙 / 主题索引 / 搜索 */
  view?: ShellView;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [skipReady, setSkipReady] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState("");
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [corpus, setCorpus] = React.useState<LinkItem[] | null>(null);
  const [corpusError, setCorpusError] = React.useState(false);
  const { entries: historyEntries } = useHistory();

  // 最近搜索只存在 localStorage；静态导出没有服务端状态，挂载后读一次
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentSearches(readRecentSearches());
  }, []);

  // 进入搜索前所在的路径，清空搜索时回到这里
  const originPath = React.useRef<string>("/");
  const trackedOrigin = React.useRef(false);
  // 首帧「URL → state」是否已同步完成。同步之前不许回写地址栏，
  // 否则直链 /search/?q=新闻 会被下面的回写 effect 改写成 /（P0-1 的根因）
  const urlSynced = React.useRef(false);

  // 侧边栏开合：cookie 由 SidebarProvider 负责写，这里负责读回来。
  // 不恢复的话每次刷新都会弹回展开态，用户折叠了等于白折。
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  useIsoLayoutEffect(() => {
    const saved = /(?:^|;\s*)sidebar_state=(true|false)/.exec(document.cookie)?.[1];
    if (saved === "false") setSidebarOpen(false);
  }, []);
  // 本次搜索是否已经在历史里留下过一条记录（第一次进入搜索要 push，之后只 replace）
  const searchEntryPushed = React.useRef(false);

  const searching = query.trim().length > 0;
  const activeGroup = activeTopic ?? null;

  // 主题页的分组筛选：?group= 是状态，首帧与切换主题时读回
  React.useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("group") ?? "";
    const available = activeTopic?.groups ?? [];
    const valid =
      requested === "" ||
      requested === UNGROUPED_GROUP ||
      available.some((group) => group.slug === requested);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroupFilter(valid ? requested : "");
  }, [activeTopic]);

  const changeGroupFilter = React.useCallback(
    (next: string) => {
      setGroupFilter(next);
      if (!activeTopic) return;
      const suffix = next ? `?group=${encodeURIComponent(next)}` : "";
      replaceUrlQuietly(`/topics/${activeTopic.slug}/${suffix}`, { silent: true });
    },
    [activeTopic],
  );

  const requestCorpus = React.useCallback(() => {
    if (corpus) return;
    loadCorpus()
      .then((items) => {
        setCorpus(items);
        setCorpusError(false);
      })
      .catch(() => setCorpusError(true));
  }, [corpus]);

  React.useEffect(() => {
    if (searching || view === "history") requestCorpus();
  }, [searching, view, requestCorpus]);

  const searchIndex = React.useMemo(() => (corpus ? createSearchIndex(corpus) : null), [corpus]);
  const results = React.useMemo(
    () => (searching && searchIndex ? searchIndex.search(query) : []),
    [searchIndex, query, searching],
  );
  const nearMisses = React.useMemo(
    () => (searching && results.length === 0 && searchIndex ? searchIndex.nearMisses(query) : []),
    [searchIndex, query, searching, results.length],
  );
  const topicIndex = React.useMemo(() => createTopicIndex(topics), [topics]);
  const topicSuggestions = React.useMemo(
    () =>
      searching && results.length === 0
        ? topicIndex.search(query, { limit: 3 }).map((result) => result.item)
        : [],
    [topicIndex, query, searching, results.length],
  );

  const hueByLabel = React.useMemo(() => buildHueMap(topics), [topics]);

  // 数据按路由切片后，切主题走静态页导航；Link 预取 + 静态 HTML 已经足够快
  const goTopic = React.useCallback(
    (next: string) => {
      router.push(next === ALL ? "/" : `/topics/${next}/`);
    },
    [router],
  );

  // 首帧把 URL 上的搜索词读进 state（「URL 是状态」的读侧）。
  // 静态导出没有服务端注入，只能挂载后读一次；urlSynced 同时充当「只跑一次」的守卫，
  // 避免 groups 变化（未来的热更新）时把用户正在输入的内容覆盖掉。
  // 排在「回写地址栏」的 effect 之前：先读后写，直链 /search/?q= 才不会被当成清空。
  React.useEffect(() => {
    if (urlSynced.current) return;
    const route = parseRoute(
      window.location.pathname,
      window.location.search,
      topics.map((topic) => topic.slug),
    );
    // 静态导出没有服务端注入，首帧只能从地址栏读这一次；urlSynced 保证不重复触发
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (route.query) setQuery(route.query);
    // 直链/刷新进来时这条 URL 本来就在历史里，后续输入只 replace 不再 push
    if (route.isSearch) searchEntryPushed.current = true;
    urlSynced.current = true;
  }, [topics]);

  // 记录「搜索从哪儿来」：第一次输入时抓一次当前地址
  React.useEffect(() => {
    if (!searching && !window.location.pathname.startsWith("/search")) {
      originPath.current = window.location.pathname + window.location.search;
      trackedOrigin.current = true;
    }
  }, [searching]);

  // 退出搜索：清空输入，并把地址栏还原到来源页。
  // 放在事件回调里而不是 effect 里——StrictMode 会把挂载时的 effect 连跑两遍，
  // 靠 ref 标记「首轮跳过」并不成立；「用户清空了」只有从交互入口才能确定。
  const exitSearch = React.useCallback(() => {
    searchEntryPushed.current = false;
    setQuery("");
    if (!window.location.pathname.startsWith("/search")) return;
    const back = trackedOrigin.current ? originPath.current : "/";
    // 直接打开 /search/?q= 时，页面本身就是搜索视图；只 replace URL 会留下
    // 「地址是 /、内容还是搜索空态」的错位，必须真正导航回首页。
    if (view === "search") router.push(back);
    else replaceUrlQuietly(back);
  }, [router, view]);

  // 地址栏：只在「搜索中」回写 /search/?q=；清空由 exitSearch 负责。
  // 必须用 replaceUrlQuietly（绕过 Next 的 replaceState patch）：
  // patch 会让每次改 URL 都 dispatch ACTION_RESTORE → router state 变化 →
  // <main id="content"> 抢走焦点，输入框每打一个字就失焦
  React.useEffect(() => {
    // 首帧还没读完 URL：这一轮 state 里的 query 还是空串，回写会把它冲掉
    if (!urlSynced.current || !searching) return;
    const target = `/search/?${new URLSearchParams({ q: query.trim() }).toString()}`;
    // 内容相同就不写：首帧读入 query 会再触发一次本 effect，
    // 不加这层判断会多写一次历史记录
    if (window.location.pathname + window.location.search === target) return;
    // 第一次进入搜索用 push：后退能回到来源分类，而不是把来源页替换掉。
    // 之后每打一个字只 replace，否则历史里会堆满「豆」「豆瓣」「豆瓣电」…
    if (!searchEntryPushed.current) {
      pushUrlQuietly(target);
      searchEntryPushed.current = true;
    } else {
      replaceUrlQuietly(target);
    }
  }, [searching, query]);

  // 浏览器前进/后退：把地址栏重新读成 state（与首帧读 URL 用同一个解析器）
  React.useEffect(() => {
    function onPopState() {
      const route = parseRoute(
        window.location.pathname,
        window.location.search,
        topics.map((topic) => topic.slug),
      );
      // 后退/前进到搜索页：把 q 读回来；离开搜索页则清空，即「退出搜索态」
      setQuery(route.query);
      // 搜索页这条 URL 已经在历史里了，之后打字只 replace
      if (route.isSearch) searchEntryPushed.current = true;
      // 主题页只会因为 ?group= 变化走到这里；分类切换本身是页面导航
      if (!route.isSearch) {
        const requested = new URLSearchParams(window.location.search).get("group") ?? "";
        const valid =
          requested === "" ||
          requested === UNGROUPED_GROUP ||
          (activeTopic?.groups ?? []).some((group) => group.slug === requested);
        setGroupFilter(valid ? requested : "");
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [topics, activeTopic]);

  // skip link 平时不挂载：否则导航后的焦点会落到它身上，把它点亮。
  // 触发条件：焦点还在 body（页面刚加载、用户还没交互）时按下第一次 Tab。
  // 按 Esc 也算「用不上了」：与点击跳转一样卸载，保持「平时不进 DOM」的口径。
  // 注意 Tab 的默认行为（把焦点移到下一个可聚焦元素）与本监听同帧发生：
  // setSkipReady 触发的渲染要等 React 提交，元素挂载后再抢回焦点，
  // 所以这里用两帧 rAF（一帧等 React 渲染提交，一帧等布局稳定）。
  React.useEffect(() => {
    function onFirstTab(event: KeyboardEvent) {
      if (event.key !== "Tab" || event.shiftKey) return;
      if (document.activeElement !== document.body) return;
      setSkipReady(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.getElementById("skip-link")?.focus()),
      );
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // 焦点若已移出 skip link（比如用户按 Shift+Tab 走了），留给全局 Esc 逻辑；这里只管「还停在 skip link 上」的场景
      if (document.activeElement === document.getElementById("skip-link")) {
        setSkipReady(false);
        document.body.focus();
      }
    }
    window.addEventListener("keydown", onFirstTab, true);
    window.addEventListener("keydown", onEscape, true);
    return () => {
      window.removeEventListener("keydown", onFirstTab, true);
      window.removeEventListener("keydown", onEscape, true);
    };
  }, []);

  // 路由切换后把焦点交给主区域：否则焦点会停在 skip link 上，把它「点亮」成可见元素。
  // 触发源有三类：
  // 1. 浏览器前进/后退（popstate）与 replaceUrlQuietly（派发 redbot:replacestate）；
  // 2. Next 客户端导航（router.push / <Link>）：usePathname 变化，
  //    但跨视图切换（按钮墙 ↔ 主题 ↔ 足迹）时 AppShell 会随 page.tsx 重挂，
  //    重挂后的首次 effect 也算「导航后」（页面本身是 SPA 切出来的，不是直开）；
  // 3. Next 导航焦点管理：handlePotentialScroll 把焦点移到路由段 DIV（无 id 的裸 DIV），
  //    由下面的 focusin 捕获兜底移交。
  React.useEffect(() => {
    function handFocusToContent() {
      window.setTimeout(() => {
        const active = document.activeElement;
        // 输入框持有焦点时不动它：搜索中每打一个字都会 replaceUrlQuietly，
        // 抢焦点会打断输入（见 replaceUrlQuietly 的注释）。
        if (active === inputRef.current) return;
        const el = document.getElementById("content");
        if (!el || active === el) return;
        el.focus({ preventScroll: true });
      }, 0);
    }
    window.addEventListener("redbot:replacestate", handFocusToContent);
    window.addEventListener("popstate", handFocusToContent);
    return () => {
      window.removeEventListener("redbot:replacestate", handFocusToContent);
      window.removeEventListener("popstate", handFocusToContent);
    };
  }, []);

  // usePathname 变化＝客户端导航完成。用 sessionStorage 的「上次路径」做基准：
  // - 直开/新 tab：无基准 → 不动焦点（保持浏览器默认）；
  // - 刷新：基准 === 当前路径 → 不动；
  // - SPA 导航（含跨视图重挂 AppShell）：基准 ≠ 当前路径 → 把焦点交给主区域。
  // 基准在每次渲染后更新，等价于「记住上一次看过的路径」。
  const LAST_PATH_KEY = "redbot:last-path";
  React.useEffect(() => {
    const last = window.sessionStorage.getItem(LAST_PATH_KEY);
    const isNavigation = last !== null && last !== pathname;
    window.sessionStorage.setItem(LAST_PATH_KEY, pathname);
    if (!isNavigation) return;
    const id = window.setTimeout(() => {
      if (document.activeElement === inputRef.current) return;
      document.getElementById("content")?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  // Next 客户端导航（router.push / Link）后，焦点会被 handlePotentialScroll 移到
  // 路由段 DIV 上（无 id 的普通 div）。用 focusin 捕获：焦点落到「非交互的裸 DIV」
  // 且它不在 main#content 里时，交给 main——这条只兜 Next 的内部焦点管理，
  // 不碰用户主动聚焦的交互元素（按钮/输入框/链接）。
  React.useEffect(() => {
    function onFocusIn(event: FocusEvent) {
      const target = event.target as HTMLElement;
      if (!(target instanceof HTMLElement)) return;
      // 只处理「Next 路由段 DIV」：无 id、无 role、无 tabindex、无交互语义
      if (target.tagName !== "DIV") return;
      if (target.id || target.getAttribute("role") || target.tabIndex >= 0) return;
      if (inputRef.current && document.activeElement === inputRef.current) return;
      const main = document.getElementById("content");
      if (!main || main.contains(target)) return;
      // 延后一帧，避免与 React 的 DOM 操作竞争
      window.setTimeout(() => {
        if (document.activeElement === target) {
          main.focus({ preventScroll: true });
        }
      }, 0);
    }
    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, []);

  // 滚动锁兜底（QA #2）：移动端抽屉关闭时，Radix 依赖 exit 动画的
  // animationend 卸载 react-remove-scroll（body[data-scroll-locked]）。
  // 动画被打断或渲染管线挂起时该回调可能丢失，锁就残留在 body 上。
  // 这里在每次 popstate / redbot:replacestate 后检查：页面上已经没有
  // 打开着的 dialog 却仍挂着锁 → 主动摘掉锁属性，让页面恢复滚动。
  React.useEffect(() => {
    function releaseStaleScrollLock() {
      window.setTimeout(() => {
        const body = document.body;
        if (!body.hasAttribute("data-scroll-locked")) return;
        const dialogOpen = document.querySelector('[role="dialog"][data-state="open"]');
        if (dialogOpen) return; // 有真开着的对话框，锁是正当的
        body.removeAttribute("data-scroll-locked");
        body.classList.remove(
          "with-scroll-bars-hidden",
          "right-scroll-bar-position",
          "width-before-scroll-bar",
        );
      }, 50);
    }
    window.addEventListener("popstate", releaseStaleScrollLock);
    window.addEventListener("redbot:replacestate", releaseStaleScrollLock);
    return () => {
      window.removeEventListener("popstate", releaseStaleScrollLock);
      window.removeEventListener("redbot:replacestate", releaseStaleScrollLock);
    };
  }, []);

  // 键盘：⌘K / 聚焦搜索，结果 ↑↓ 移动，? 看快捷键
  React.useEffect(() => {
    function isTyping(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
    }

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      if (shortcutsOpen) return;

      if (event.key === "/" && !isTyping(event.target) && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      if (event.key === "?" && !isTyping(event.target)) {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (event.key === "Enter" && document.activeElement === inputRef.current && searching) {
        const first = results[0];
        if (!first) return;
        event.preventDefault();
        recordVisit(first.id, first.topic?.slug);
        setRecentSearches(rememberSearch(query));
        window.open(first.url, "_blank", "noopener,noreferrer");
        return;
      }

      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        if (query.trim()) exitSearch();
        else setSearchFocused(false);
        return;
      }

      if (!searching) return;
      const links = Array.from(
        document.querySelectorAll<HTMLElement>("[data-search-results] a[href^='http']"),
      );
      if (links.length === 0) return;
      const current = document.activeElement as HTMLElement | null;
      const onInput = current === inputRef.current;
      const onResult = !!current && links.includes(current);
      // 只在「输入框或结果链接」上接管方向键，别抢侧栏/页脚的键盘操作
      if (!onInput && !onResult) return;
      const index = current ? links.indexOf(current) : -1;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (onInput) links[0].focus();
        else (links[index + 1] ?? links[links.length - 1]).focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (index <= 0) inputRef.current?.focus();
        else links[index - 1].focus();
      } else if (event.key === "Escape" && onResult) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searching, shortcutsOpen, results, query, exitSearch]);

  const hasGroups = (activeGroup?.groups.length ?? 0) > 0;

  const wallGroups: PillGroup[] = React.useMemo(() => {
    if (!activeGroup || searching) return [];
    if (activeGroup.groups.length === 0) return [activeGroup];

    const itemsOf = (slug: string) =>
      activeGroup.items.filter((item) =>
        slug === UNGROUPED_GROUP ? !item.group : item.group?.slug === slug,
      );

    if (groupFilter) {
      const match = activeGroup.groups.find((group) => group.slug === groupFilter);
      return [
        {
          slug: `${activeGroup.slug}-${groupFilter}`,
          name: match?.name ?? "未分组",
          items: itemsOf(groupFilter),
        },
      ];
    }

    const list: PillGroup[] = activeGroup.groups.map((group) => ({
      slug: `${activeGroup.slug}-${group.slug}`,
      name: group.name,
      items: itemsOf(group.slug),
    }));
    const ungrouped = itemsOf(UNGROUPED_GROUP);
    if (ungrouped.length > 0) {
      list.push({
        slug: `${activeGroup.slug}-${UNGROUPED_GROUP}`,
        name: "未分组",
        items: ungrouped,
      });
    }
    return list;
  }, [activeGroup, searching, groupFilter]);

  const visibleCount = searching
    ? results.length
    : view === "history"
      ? historyEntries.length
      : activeGroup
        ? wallGroups.reduce((sum, group) => sum + group.items.length, 0)
        : total;

  // 首页＝按钮墙 + 无分类 + 非搜索：只有这里展示品牌标语与信任行
  const isHome = !searching && view === "wall" && !activeGroup;
  // 点搜索框、还没输入、且有历史时展示最近搜索
  const showRecent = searchFocused && !searching && recentSearches.length > 0;

  let body: React.ReactNode;

  if (searching) {
    if (!corpus && !corpusError) {
      body = (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-busy aria-live="polite">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[54px] rounded-xl" />
          ))}
        </div>
      );
    } else if (corpusError) {
      body = (
        <Empty className="mx-auto w-full max-w-2xl rounded-2xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>搜索语料加载失败</EmptyTitle>
            <EmptyDescription>刷新页面再试一次。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => window.location.reload()}>
              重新加载
            </Button>
          </EmptyContent>
        </Empty>
      );
    } else if (results.length > 0) {
      body = (
        <div className="animate-in duration-200 fade-in-0">
          <SearchResults
            items={results}
            hueByLabel={hueByLabel}
            onOpen={() => setRecentSearches(rememberSearch(query))}
          />
        </div>
      );
    } else {
      body = (
        <Empty className="mx-auto w-full max-w-2xl rounded-2xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>没有找到「{query.trim()}」</EmptyTitle>
            <EmptyDescription>
              {nearMisses.length > 0 || topicSuggestions.length > 0
                ? "换个写法，或者看看下面这些相近的结果。"
                : "换个关键词试试，也可以按主题逛一遍。"}
            </EmptyDescription>
          </EmptyHeader>
          {nearMisses.length > 0 || topicSuggestions.length > 0 ? (
            <EmptyContent>
              {nearMisses.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="text-xs text-muted-foreground">你是不是想找</span>
                  {nearMisses.map((item) => (
                    <Badge key={item.id} variant="outline" asChild>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => recordVisit(item.id, item.topic?.slug)}
                      >
                        {item.name}
                      </a>
                    </Badge>
                  ))}
                </div>
              ) : null}
              {topicSuggestions.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="text-xs text-muted-foreground">或者去这些主题</span>
                  {topicSuggestions.map((topic) => (
                    <Badge key={topic.slug} variant="secondary" asChild>
                      <Link href={`/topics/${topic.slug}/`}>
                        <span aria-hidden>{topic.emoji}</span>
                        {topic.name}
                      </Link>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </EmptyContent>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                exitSearch();
                inputRef.current?.focus();
              }}
            >
              清除搜索
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/topics/">按主题浏览</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a
                href={`${site.repo}/issues/new?${new URLSearchParams({
                  labels: "link-suggestion",
                  title: `收录建议：${query.trim()}`,
                  body: `我搜索「${query.trim()}」没有找到合适的信息源。\n\n建议收录：\n- 名称：\n- 链接：\n- 主题：\n- 推荐理由：`,
                }).toString()}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                建议收录
              </a>
            </Button>
          </div>
        </Empty>
      );
    }
  } else if (view === "history") {
    body = <HistoryView corpus={corpus} topics={topics} error={corpusError} />;
  } else if (view === "topics") {
    body = <TopicsIndex topics={topics} />;
  } else if (view === "search") {
    body = (
      <Empty className="mx-auto w-full max-w-2xl rounded-2xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchIcon />
          </EmptyMedia>
          <EmptyTitle>搜索全部信息源</EmptyTitle>
          <EmptyDescription>输入关键词开始搜索，名称、别名和推荐理由都会被检索。</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/topics/">按主题浏览</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  } else if (view === "about") {
    body = <AboutView />;
  } else {
    body = (
      <PillWall
        groups={wallGroups}
        hueByLabel={hueByLabel}
        showHeading={hasGroups}
        showDescription
      />
    );
  }

  return (
    <>
      {skipReady ? (
        <a
          id="skip-link"
          href="#content"
          onClick={() => setSkipReady(false)}
          className="fixed top-3 left-1/2 z-50 -translate-x-1/2 rounded-full border bg-background px-4 py-2 text-sm shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          跳到内容
        </a>
      ) : null}
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <AppSidebar
          topics={topics}
          total={total}
          activeSlug={view === "wall" ? (activeTopic?.slug ?? "") : ""}
          topicsActive={view === "topics"}
          isHome={view === "wall" && !activeTopic && !searching}
          onSelect={goTopic}
          randomPool={randomPool}
          historyActive={view === "history"}
          onOpenHistory={() => router.push("/history/")}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center gap-2 sm:gap-3">
                <SidebarTrigger className="-ml-1 md:hidden" />
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/30 md:hidden"
                >
                  <span aria-hidden className="size-2 rounded-full bg-primary" />
                  <span className="hidden text-sm font-semibold tracking-tight sm:inline">
                    {site.name}
                  </span>
                </Link>

                <div className="relative mx-auto w-full max-w-md min-w-0">
                  <InputGroup className="h-10 rounded-full border-transparent bg-muted/60 shadow-none focus-within:bg-background has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/20">
                    <InputGroupAddon>
                      <SearchIcon aria-hidden />
                    </InputGroupAddon>
                    <InputGroupInput
                      ref={inputRef}
                      value={query}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (next.trim()) {
                          setQuery(next);
                          requestCorpus();
                        } else {
                          exitSearch();
                        }
                      }}
                      onFocus={() => {
                        setSearchFocused(true);
                        requestCorpus();
                      }}
                      onBlur={() => setSearchFocused(false)}
                      aria-expanded={showRecent}
                      aria-controls="recent-searches"
                      placeholder="搜索全部信息源…"
                      aria-label="搜索信息源"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <InputGroupAddon align="inline-end">
                      {query ? (
                        <InputGroupButton
                          size="icon-xs"
                          aria-label="清除搜索"
                          onClick={() => {
                            exitSearch();
                            inputRef.current?.focus();
                          }}
                          className="text-muted-foreground"
                        >
                          <XIcon />
                        </InputGroupButton>
                      ) : (
                        <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
                      )}
                    </InputGroupAddon>
                  </InputGroup>

                  {showRecent ? (
                    <div
                      id="recent-searches"
                      aria-label="最近搜索"
                      // 防止点面板时输入框先失焦，点击事件丢失
                      onMouseDown={(event) => event.preventDefault()}
                      className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-lg"
                    >
                      <div className="flex items-center justify-between px-2 py-1">
                        <span className="text-xs text-muted-foreground">最近搜索</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => setRecentSearches(clearRecentSearches())}
                          className="text-xs text-muted-foreground"
                        >
                          清除
                        </Button>
                      </div>
                      {recentSearches.map((term) => (
                        <Button
                          key={term}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setQuery(term);
                            inputRef.current?.focus();
                          }}
                          className="w-full justify-start gap-2 px-2 font-normal text-muted-foreground"
                        >
                          <HistoryIcon aria-hidden className="size-3.5 shrink-0" />
                          <span className="truncate">{term}</span>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <ThemeToggle />
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="hidden rounded-full md:inline-flex"
                  >
                    <a href={site.repo} target="_blank" rel="noopener noreferrer">
                      GitHub
                      <ArrowUpRight aria-hidden className="size-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main id="content" tabIndex={-1} className="flex-1 pb-16 outline-none">
            <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
              {isHome ? (
                <div className="flex flex-col gap-12 pt-6 pb-4 sm:pt-10">
                  <HomeHero
                    total={total}
                    topicCount={topics.length}
                    updated={updated}
                    randomPool={randomPool}
                  />
                  <HomeSections sections={homeSections} hueByLabel={hueByLabel} />
                  <Card className="flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-medium">{topics.length} 个主题，按需切换</p>
                      <p className="text-sm text-muted-foreground">
                        主题索引里还有完整的分类说明与书签导出。
                      </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/topics/">
                        浏览全部主题
                        <ArrowRightIcon data-icon="inline-end" />
                      </Link>
                    </Button>
                  </Card>
                </div>
              ) : (
                <>
                  <ShellHeader
                    view={view}
                    searching={searching}
                    activeGroup={activeGroup}
                    total={total}
                    searchCount={results.length}
                    historyCount={historyEntries.length}
                    hue={
                      activeGroup && topics.some((topic) => topic.slug === activeGroup.slug)
                        ? hueFor(topics.findIndex((topic) => topic.slug === activeGroup.slug))
                        : undefined
                    }
                  />

                  {activeGroup && !searching && hasGroups ? (
                    <GroupFilter
                      groups={activeGroup.groups}
                      items={activeGroup.items}
                      value={groupFilter}
                      onChange={changeGroupFilter}
                    />
                  ) : null}

                  <p className="sr-only" aria-live="polite">
                    {searching
                      ? `找到 ${results.length} 个结果`
                      : view === "wall"
                        ? `当前分类：${activeGroup?.name ?? "全部"}，共 ${visibleCount} 个信息源`
                        : `共 ${visibleCount} 个信息源`}
                  </p>

                  {body}

                  {activeGroup && !searching ? (
                    <TopicPager topics={topics} slug={activeGroup.slug} />
                  ) : null}
                </>
              )}
            </div>
          </main>

          <SiteFooter total={total} categories={topics.length} updated={updated} />
        </div>

        <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>键盘快捷键</DialogTitle>
              <DialogDescription>不用离开键盘就能完成一次查找。</DialogDescription>
            </DialogHeader>
            <Separator />
            <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-sm">
              <dt className="flex items-center gap-1">
                <Kbd>⌘K</Kbd>
                <span className="text-muted-foreground">/</span>
                <Kbd>/</Kbd>
              </dt>
              <dd className="text-muted-foreground">聚焦搜索框</dd>
              <dt className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
              </dt>
              <dd className="text-muted-foreground">在搜索结果间移动</dd>
              <dt>
                <Kbd>Enter</Kbd>
              </dt>
              <dd className="text-muted-foreground">打开当前结果</dd>
              <dt>
                <Kbd>Esc</Kbd>
              </dt>
              <dd className="text-muted-foreground">清空搜索 / 回到来源页</dd>
              <dt>
                <Kbd>?</Kbd>
              </dt>
              <dd className="text-muted-foreground">打开这张表</dd>
            </dl>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </>
  );
}

/** 主题页底部：按 data/topics.json 的顺序前后翻，替代「回侧栏再点一次」。 */
function TopicPager({ topics, slug }: { topics: TopicSummary[]; slug: string }) {
  if (topics.length < 2) return null;
  const index = topics.findIndex((topic) => topic.slug === slug);
  if (index === -1) return null;
  const prev = topics[(index - 1 + topics.length) % topics.length];
  const next = topics[(index + 1) % topics.length];

  return (
    <nav
      aria-label="切换主题"
      className="mt-10 grid gap-3 border-t border-border/70 pt-6 sm:grid-cols-2"
    >
      <Button
        asChild
        variant="outline"
        className="h-auto w-full justify-start gap-3 rounded-xl px-4 py-3"
      >
        <Link href={`/topics/${prev.slug}/`}>
          <ArrowLeftIcon data-icon="inline-start" className="text-muted-foreground" />
          <span className="flex min-w-0 flex-col items-start leading-tight">
            <span className="text-xs font-normal text-muted-foreground">上一个主题</span>
            <span className="max-w-full truncate text-sm font-medium">
              <span aria-hidden className="mr-1.5">
                {prev.emoji}
              </span>
              {prev.name}
            </span>
          </span>
        </Link>
      </Button>

      <Button
        asChild
        variant="outline"
        className="h-auto w-full justify-end gap-3 rounded-xl px-4 py-3"
      >
        <Link href={`/topics/${next.slug}/`}>
          <span className="flex min-w-0 flex-col items-end leading-tight">
            <span className="text-xs font-normal text-muted-foreground">下一个主题</span>
            <span className="max-w-full truncate text-sm font-medium">
              {next.name}
              <span aria-hidden className="ml-1.5">
                {next.emoji}
              </span>
            </span>
          </span>
          <ArrowRightIcon data-icon="inline-end" className="text-muted-foreground" />
        </Link>
      </Button>
    </nav>
  );
}
