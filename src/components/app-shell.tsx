"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { ArrowUpRight, SearchIcon, XIcon } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { HistoryView } from "@/components/history-view";
import { PillWall, hueFor } from "@/components/pill-wall";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopicsIndex } from "@/components/topics-index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CategoryGroup } from "@/lib/schema";
import { createSearchIndex } from "@/lib/search";
import { useHistory } from "@/lib/use-history";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

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

  const hueByLabel = React.useMemo(
    () => new Map(groups.map((group, index) => [group.label, hueFor(index)])),
    [groups],
  );

  /**
   * 分类切换走浏览器原生 View Transitions：只对内容区做交叉淡入淡出，
   * 侧栏/顶栏保持不动。不支持或开启减弱动效时直接切换。
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
      window.scrollTo({ top: 0 });
      syncTagAttribute(next);
      setQuery("");
      const doc = document as Document & {
        startViewTransition?: (callback: () => void) => { finished: Promise<void> };
      };
      if (
        typeof doc.startViewTransition !== "function" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setActive(next);
        return;
      }
      doc.startViewTransition(() => {
        flushSync(() => setActive(next));
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

  // 地址栏：搜索时是 /search/?q=，清空后回到来源页
  React.useEffect(() => {
    if (searching) {
      const q = new URLSearchParams({ q: query.trim() }).toString();
      window.history.replaceState(null, "", `/search/?${q}`);
      return;
    }
    if (window.location.pathname.startsWith("/search")) {
      const back = trackedOrigin.current ? originPath.current : "/";
      window.history.replaceState(null, "", back);
    }
  }, [searching, query]);

  // 分类写回路径（搜索中、或当前页不是按钮墙时都不改，避免把 /topics/ 改写成 /）
  React.useEffect(() => {
    if (searching || view !== "wall") return;
    const path = active === ALL ? "/" : `/topics/${active}/`;
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
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
    : view === "topics"
      ? groups.length
      : view === "search"
        ? 0
        : view === "history"
          ? historyEntries.length
          : (activeGroup?.items.length ?? total);

  const headEmoji = searching
    ? "🔍"
    : view === "topics"
      ? "🗂️"
      : view === "history"
        ? "🐾"
        : view === "search"
          ? "🔍"
          : (activeGroup?.emoji ?? "🗂️");

  const title = searching
    ? "搜索结果"
    : view === "topics"
      ? "全部主题"
      : view === "search"
        ? "搜索"
        : view === "history"
          ? "足迹"
          : (activeGroup?.label ?? "全部信息源");
  const subtitle = searching
    ? `在全部 ${total} 个信息源里查找，不区分主题`
    : view === "topics"
      ? "按主题浏览，或直接从侧栏进入"
      : view === "search"
        ? `在全部 ${total} 个信息源里查找，不区分主题`
        : view === "history"
          ? "你点过的信息源，按最近使用排序"
          : activeGroup
            ? activeGroup.blurb
            : "点一下直达，不用再记网址";

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
              <div className="border-b border-border/70 pt-10 pb-6">
                <div className="flex items-start gap-4">
                  <div
                    aria-hidden
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-[22px] leading-none shadow-xs"
                  >
                    {headEmoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl leading-[32px] font-semibold tracking-[-0.02em] sm:text-3xl sm:leading-[40px]">
                        {title}
                      </h1>
                      {visibleCount > 0 ? (
                        <Badge variant="secondary" className="tabular-nums text-muted-foreground">
                          {visibleCount}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-md">
                      {subtitle}
                    </p>
                  </div>
                  {view !== "topics" && !searching ? (
                    <div className="hidden shrink-0 text-right md:block">
                      <Link
                        href="/topics/"
                        className="text-xs tabular-nums text-muted-foreground transition-colors hover:text-foreground hover:underline hover:underline-offset-2 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                      >
                        {groups.length} 个主题
                      </Link>
                      <p className="mt-1 text-2xs tabular-nums text-muted-foreground/60">
                        更新于 {updated}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <p className="sr-only" aria-live="polite">
                {searching ? `找到 ${results.length} 个结果` : `共 ${visibleCount} 个信息源`}
              </p>

              {searching ? (
                results.length > 0 ? (
                  <div className="animate-in fade-in-0 duration-200">
                    <PillWall
                      groups={[{ slug: "search", label: "search", items: results }]}
                      hueByLabel={hueByLabel}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-6 py-16 text-center">
                    <p className="text-md font-medium">没有匹配「{query.trim()}」的信息源</p>
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

function CategoryChips({
  groups,
  total,
  active,
  onSelect,
  className,
}: {
  groups: CategoryGroup[];
  total: number;
  active: string;
  onSelect: (slug: string) => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={active}
      onValueChange={(value) => onSelect(value || ALL)}
      aria-label="按主题过滤"
      className={cn("gap-1", className)}
    >
      <ToggleGroupItem value={ALL} className={chipClass}>
        全部
        <span className="text-2xs tabular-nums opacity-50">{total}</span>
      </ToggleGroupItem>
      {groups.map((group) => (
        <ToggleGroupItem key={group.slug} value={group.slug} className={chipClass}>
          {group.label}
          <span className="text-2xs tabular-nums opacity-50">{group.items.length}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const chipClass =
  "h-8 shrink-0 rounded-full border-transparent px-3.5 text-xs text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";
