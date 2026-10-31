"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, SearchIcon, XIcon } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { CategoryChips } from "@/components/category-chips";
import { HistoryView } from "@/components/history-view";
import { PillWall } from "@/components/pill-wall";
import { ShellHeader } from "@/components/shell-header";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopicsIndex } from "@/components/topics-index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { buildHueMap } from "@/lib/groups";
import type { CategoryGroup } from "@/lib/schema";
import { createSearchIndex } from "@/lib/search";
import { site } from "@/lib/site";
import { applyCategorySwitch, envFromWindow } from "@/lib/switch-category";
import { replaceUrlQuietly } from "@/lib/url";
import { useHistory } from "@/lib/use-history";

const ALL = "all";

export type ShellView = "wall" | "topics" | "search" | "history";

/** 让 <html data-tag> 与当前分类保持一致（样式钩子与调试用） */
function syncTagAttribute(slug: string) {
  const root = document.documentElement;
  if (slug === ALL) delete root.dataset.tag;
  else root.dataset.tag = slug;
}

export function AppShell({
  groups,
  total,
  updated,
  initialActive = ALL,
  view = "wall",
}: {
  groups: CategoryGroup[];
  total: number;
  updated: string;
  /** 由路由决定：/ 是 all，/topics/<slug>/ 是对应分类。首屏直接渲染，不经过客户端纠正 */
  initialActive?: string;
  /** 主区域默认展示什么：按钮墙 / 主题索引 / 搜索 */
  view?: ShellView;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = React.useRef(false);
  const [skipReady, setSkipReady] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [active, setActive] = React.useState<string>(initialActive);
  const [query, setQuery] = React.useState("");
  const { entries: historyEntries } = useHistory();

  // 进入搜索前所在的路径，清空搜索时回到这里
  const originPath = React.useRef<string>("/");
  const trackedOrigin = React.useRef(false);

  const searching = query.trim().length > 0;
  const activeGroup = groups.find((group) => group.slug === active) ?? null;

  const fuse = React.useMemo(
    () => createSearchIndex(groups.flatMap((group) => group.items)),
    [groups],
  );
  const results = React.useMemo(
    () => (searching ? fuse.search(query.trim()).map((result) => result.item) : []),
    [fuse, query, searching],
  );

  const hueByLabel = React.useMemo(() => buildHueMap(groups), [groups]);

  /**
   * 分类切换走浏览器原生 View Transitions：只对内容区做交叉淡入淡出，
   * 侧栏/顶栏保持不动。不支持或开启减弱动效时直接切换。
   * 执行策略（scroll 顺序、reduced-motion 短路）提纯在 switch-category.ts。
   */
  const switchCategory = React.useCallback(
    (next: string) => {
      // 非按钮墙视图（/topics/、/search/、/history/）一律走路由，
      // 不能套用「点的是当前分类」的短路判断——那些页面的 active 默认就是 all
      if (view !== "wall") {
        router.push(next === ALL ? "/" : `/topics/${next}/`);
        return;
      }
      if (next === active && !searching) return;
      setQuery("");
      applyCategorySwitch({
        next,
        env: envFromWindow(window, syncTagAttribute),
        apply: setActive,
      });
    },
    [active, searching, view, router],
  );

  // 记录「搜索从哪儿来」：第一次输入时抓一次当前地址
  React.useEffect(() => {
    if (!searching && !window.location.pathname.startsWith("/search")) {
      originPath.current = window.location.pathname + window.location.search;
      trackedOrigin.current = true;
    }
  }, [searching]);

  // 地址栏：搜索时是 /search/?q=，清空后回到来源页。
  // 必须用 replaceUrlQuietly（绕过 Next 的 replaceState patch）：
  // patch 会让每次改 URL 都 dispatch ACTION_RESTORE → router state 变化 →
  // <main id="content"> 抢走焦点，输入框每打一个字就失焦
  React.useEffect(() => {
    if (searching) {
      const q = new URLSearchParams({ q: query.trim() }).toString();
      replaceUrlQuietly(`/search/?${q}`);
      return;
    }
    if (window.location.pathname.startsWith("/search")) {
      const back = trackedOrigin.current ? originPath.current : "/";
      replaceUrlQuietly(back);
    }
  }, [searching, query]);

  // 分类写回路径（搜索中、或当前页不是按钮墙时都不改，避免把 /topics/ 改写成 /）
  React.useEffect(() => {
    if (searching || view !== "wall") return;
    const path = active === ALL ? "/" : `/topics/${active}/`;
    if (window.location.pathname !== path) replaceUrlQuietly(path);
  }, [active, searching, view]);

  // 浏览器前进/后退
  React.useEffect(() => {
    function onPopState() {
      const match = /^\/topics\/([a-z0-9-]+)\/?$/.exec(window.location.pathname);
      if (match) {
        setQuery("");
        setActive(groups.some((group) => group.slug === match[1]) ? match[1] : ALL);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [groups]);

  // skip link 平时不挂载：否则导航后的焦点会落到它身上，把它点亮
  React.useEffect(() => {
    function onFirstTab(event: KeyboardEvent) {
      if (event.key !== "Tab" || event.shiftKey) return;
      if (document.activeElement !== document.body) return;
      setSkipReady(true);
      requestAnimationFrame(() => document.getElementById("skip-link")?.focus());
    }
    window.addEventListener("keydown", onFirstTab, true);
    return () => window.removeEventListener("keydown", onFirstTab, true);
  }, []);

  // 路由切换后把焦点交给主区域：否则焦点会停在 skip link 上，把它「点亮」成可见元素
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // 延后一帧：Next 在导航后也会移动焦点，晚一步才能覆盖它
    const id = window.setTimeout(() => {
      document.getElementById("content")?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  // ⌘K 聚焦搜索框
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const visibleGroups = activeGroup && !searching ? [activeGroup] : groups;
  const visibleCount = searching
    ? results.length
    : view === "history"
      ? historyEntries.length
      : (activeGroup?.items.length ?? total);

  // 首页＝按钮墙 + 无分类 + 非搜索：只有这里展示品牌标语与信任行
  const isHome = !searching && view === "wall" && !activeGroup;

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
      <SidebarProvider>
        <AppSidebar
          groups={groups}
          total={total}
          active={view === "wall" ? active : ""}
          onSelect={switchCategory}
          historyActive={view === "history"}
          onOpenHistory={() => router.push("/history/")}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 shrink-0 border-b border-border/70 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-3 px-5 md:h-16 lg:px-8">
              <SidebarTrigger className="-ml-1 md:hidden" />
              <span className="text-sm font-semibold md:hidden">{site.name}</span>

              <div className="relative w-full max-w-sm min-w-0 flex-1">
                <SearchIcon
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索全部信息源…"
                  aria-label="搜索信息源"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-10 rounded-full border-transparent bg-muted/70 pl-10 shadow-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 sm:pr-16"
                />
                {query ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    aria-label="清除搜索"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                  >
                    <XIcon />
                  </Button>
                ) : (
                  <Kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 sm:inline-flex">
                    ⌘K
                  </Kbd>
                )}
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
          </header>

          {/* 移动端：把主题筛选从抽屉里拉出来 */}
          <div className="sticky top-14 z-20 border-b bg-background/85 backdrop-blur-md md:hidden">
            <ScrollArea className="w-full">
              <div className="px-4 py-2">
                <CategoryChips
                  groups={groups}
                  total={total}
                  active={active}
                  onSelect={switchCategory}
                  className="w-max"
                />
              </div>
            </ScrollArea>
          </div>

          <main id="content" tabIndex={-1} className="flex-1 px-5 pb-12 outline-none lg:px-8">
            <div className="mx-auto w-full max-w-[1160px]">
              <ShellHeader
                view={view}
                searching={searching}
                activeGroup={activeGroup}
                groups={groups}
                total={total}
                updated={updated}
                searchCount={results.length}
                historyCount={historyEntries.length}
                isHome={isHome}
              />

              <p className="sr-only" aria-live="polite">
                {searching
                  ? `找到 ${results.length} 个结果`
                  : view === "wall"
                    ? `当前分类：${activeGroup?.label ?? "全部"}，共 ${visibleCount} 个信息源`
                    : `共 ${visibleCount} 个信息源`}
              </p>

              {searching ? (
                results.length > 0 ? (
                  <div className="animate-in duration-200 fade-in-0">
                    <PillWall
                      groups={[{ slug: "search", label: "search", items: results }]}
                      hueByLabel={hueByLabel}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-6 py-16 text-center">
                    <p className="text-md font-medium">
                      没有匹配
                      <span className="text-muted-foreground">「{query.trim()}」</span>
                      的信息源
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      换个关键词试试，或者把这个源提交给社区。
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setQuery("");
                          inputRef.current?.focus();
                        }}
                      >
                        清除搜索
                      </Button>
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <a
                          href={`${site.repo}/issues/new?labels=link-suggestion`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          建议收录
                        </a>
                      </Button>
                    </div>
                  </div>
                )
              ) : view === "history" ? (
                <HistoryView groups={groups} />
              ) : view === "topics" ? (
                <TopicsIndex groups={groups} />
              ) : view === "search" ? (
                <p className="text-sm text-muted-foreground">
                  输入关键词开始搜索，或者{" "}
                  <Link
                    href="/topics/"
                    className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                  >
                    按主题浏览
                  </Link>
                  。
                </p>
              ) : (
                <PillWall groups={visibleGroups} hueByLabel={hueByLabel} />
              )}
            </div>
          </main>

          <SiteFooter total={total} categories={groups.length} updated={updated} />
        </div>
      </SidebarProvider>
    </>
  );
}
