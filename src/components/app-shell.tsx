"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRight,
  ChevronDownIcon,
  SearchIcon,
  SearchXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import { AboutView } from "@/components/about-view";
import { AppSidebar } from "@/components/app-sidebar";
import { GroupFilter } from "@/components/group-filter";
import { HomeHero } from "@/components/home-hero";
import { HomeSections } from "@/components/home-sections";
import { HistoryView } from "@/components/history-view";
import { PillWall } from "@/components/pill-wall";
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
import { buildWallGroups } from "@/lib/group-filter";
import { buildHueMap, hueFor } from "@/lib/groups";
import { recordVisit } from "@/lib/history";
import { clearRecentSearches, removeRecentSearch } from "@/lib/recent-searches";
import { parseRoute, type ShellView } from "@/lib/route-state";
import type { CategoryGroup, HomeSection, RandomPick, TopicSummary } from "@/lib/schema";
import { site } from "@/lib/site";
import { useFocusHandoff } from "@/lib/use-focus-handoff";
import { useGroupFilter } from "@/lib/use-group-filter";
import { useHistoryCount } from "@/lib/use-history";
import { useSearchKeyboard } from "@/lib/use-search-keyboard";
import { useShellSearch } from "@/lib/use-search";
import { useShortcutLabel } from "@/lib/use-shortcut-label";
import { useSidebarOpen } from "@/lib/use-sidebar-open";
import { cn } from "@/lib/utils";

/** 历史面板默认露几条，再多就折叠起来 */
const RECENT_VISIBLE = 8;

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
  const [sidebarOpen, setSidebarOpen] = useSidebarOpen();
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const shortcutLabel = useShortcutLabel();
  const historyCount = useHistoryCount();

  const {
    inputRef,
    query,
    setQuery,
    searching,
    setSearchFocused,
    recentSearches,
    setRecentSearches,
    recentExpanded,
    setRecentExpanded,
    showRecent,
    corpus,
    corpusError,
    requestCorpus,
    results,
    nearMisses,
    topicSuggestions,
    exitSearch,
    applyRoute,
    rememberQuery,
  } = useShellSearch({ topics, view });

  const { groupFilter, changeGroupFilter, syncGroupFilter } = useGroupFilter(activeTopic ?? null);
  const { skipReady, dismissSkipLink } = useFocusHandoff(inputRef);

  useSearchKeyboard({
    inputRef,
    query,
    searching,
    exitSearch,
    shortcutsOpen,
    setShortcutsOpen,
    setSearchFocused,
  });

  const activeGroup = activeTopic ?? null;
  const hasGroups = (activeGroup?.groups.length ?? 0) > 0;

  // 分组筛选不再「少渲染几组」，而是全部渲染、把不匹配的组标记成 hidden。
  // 结构与静态 HTML 保持一致，layout.tsx 的同步脚本才能在绘制前把多余的组藏好。
  const wallGroups = React.useMemo(
    () => buildWallGroups(activeGroup, searching, groupFilter),
    [activeGroup, searching, groupFilter],
  );

  // 计数只算没被隐藏的组
  const shownItems = React.useMemo(
    () =>
      wallGroups
        .filter((group) => !group.hidden)
        .reduce((sum, group) => sum + group.items.length, 0),
    [wallGroups],
  );

  const hueByLabel = React.useMemo(() => buildHueMap(topics), [topics]);

  // 浏览器前进/后退：把地址栏重新读成 state（与首帧读 URL 用同一个解析器）
  React.useEffect(() => {
    function onPopState() {
      const route = parseRoute(window.location.pathname, window.location.search);
      applyRoute(route);
      // 主题页只会因为 ?group= 变化走到这里；分类切换本身是页面导航
      if (!route.isSearch) syncGroupFilter();
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyRoute, syncGroupFilter]);

  const visibleCount = searching
    ? results.length
    : view === "history"
      ? historyCount
      : activeGroup
        ? shownItems
        : total;

  // 首页＝按钮墙 + 无分类 + 非搜索：只有这里展示品牌标语与信任行
  const isHome = !searching && view === "wall" && !activeGroup;

  let body: React.ReactNode;

  if (searching) {
    if (!corpus && !corpusError) {
      body = (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-busy aria-live="polite">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[88px] rounded-xl" />
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
        <div className="animate-in duration-200 fade-in-0 motion-reduce:animate-none">
          <SearchResults items={results} hueByLabel={hueByLabel} onOpen={rememberQuery} />
        </div>
      );
    } else {
      const issueTitle = `收录建议：${query.trim().slice(0, 60)}`;
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
              className="rounded-lg"
              onClick={() => {
                exitSearch();
                inputRef.current?.focus();
              }}
            >
              清除搜索
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href="/topics/">按主题浏览</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <a
                href={`${site.repo}/issues/new?${new URLSearchParams({
                  labels: "link-suggestion",
                  title: issueTitle,
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
          <Button asChild size="sm" className="rounded-lg">
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
          onClick={dismissSkipLink}
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
          aboutActive={view === "about"}
          isHome={view === "wall" && !activeTopic && !searching}
          randomPool={randomPool}
          historyActive={view === "history"}
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

                {/* 搜索区：面板与输入框同属一个 wrapper，blur 时只有焦点真的离开才收起 */}
                <div
                  className="relative mx-auto w-full max-w-md min-w-0"
                  onBlur={(event) => {
                    // Tab 到面板里的「展开 / 清空 / 删除」不能把面板关掉，
                    // 否则键盘用户永远够不到这些按钮（焦点会随卸载落到 body）
                    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                    setSearchFocused(false);
                  }}
                >
                  <InputGroup className="h-10 rounded-lg border-transparent bg-muted/60 shadow-none focus-within:bg-background has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/20">
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
                      // Esc 收起面板后输入框通常仍有焦点，再点一下也能把它叫回来
                      // （点已聚焦的元素不会触发 focus，只有 onClick 兜得住）
                      onClick={() => setSearchFocused(true)}
                      // 输入框是普通 textbox：aria-expanded 不支持这个 role（那是 combobox 的），
                      // 面板也不是 listbox —— 里面的「删除 / 清空」是嵌套按钮，用 group 语义更诚实。
                      aria-controls={showRecent ? "recent-searches" : undefined}
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
                        <Kbd className="hidden sm:inline-flex">{shortcutLabel}</Kbd>
                      )}
                    </InputGroupAddon>
                  </InputGroup>

                  {showRecent ? (
                    <div
                      id="recent-searches"
                      role="group"
                      aria-label="最近搜索"
                      // 防止点面板时输入框先失焦，点击事件丢失
                      onMouseDown={(event) => event.preventDefault()}
                      onKeyDown={(event) => {
                        if (event.key !== "Escape") return;
                        // 只收起面板：不 stopPropagation 的话，全局 Esc 会顺手清空搜索
                        event.preventDefault();
                        event.stopPropagation();
                        // 顺序不能反：focus 事件会把 searchFocused 置回 true，
                        // 先聚焦、再收起，最终状态才是「输入框有焦点 + 面板关闭」
                        inputRef.current?.focus();
                        setSearchFocused(false);
                      }}
                      className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border bg-popover shadow-lg"
                    >
                      <div className="flex items-center justify-between px-3 pt-2 pb-1">
                        <span className="text-xs text-muted-foreground">最近搜索</span>
                        <div className="flex items-center gap-1">
                          {recentSearches.length > RECENT_VISIBLE ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              aria-expanded={recentExpanded}
                              onClick={() => setRecentExpanded((value) => !value)}
                              className="gap-1 text-xs text-muted-foreground"
                            >
                              {recentExpanded ? "收起" : `展开 ${recentSearches.length} 条`}
                              <ChevronDownIcon
                                aria-hidden
                                className={cn(
                                  "size-3 transition-transform",
                                  recentExpanded && "rotate-180",
                                )}
                              />
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              setRecentSearches(clearRecentSearches());
                              inputRef.current?.focus();
                            }}
                            className="text-xs text-muted-foreground"
                          >
                            清空
                          </Button>
                        </div>
                      </div>
                      {/* 历史用 chip 流：一行能放三四个，比竖着排省一半高度 */}
                      <div
                        className={cn(
                          "flex flex-wrap gap-1.5 px-3 pt-1 pb-3",
                          recentExpanded && "max-h-[min(50vh,22rem)] overflow-y-auto",
                        )}
                      >
                        {(recentExpanded
                          ? recentSearches
                          : recentSearches.slice(0, RECENT_VISIBLE)
                        ).map((term) => (
                          <span
                            key={term}
                            className="inline-flex max-w-full items-center rounded-full border border-border/70 bg-background text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setQuery(term);
                                inputRef.current?.focus();
                              }}
                              title={term}
                              className="max-w-[9rem] truncate rounded-l-full py-1 pr-1 pl-2.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                            >
                              {term}
                            </button>
                            <button
                              type="button"
                              aria-label={`删除「${term}」`}
                              onClick={() => {
                                const next = removeRecentSearch(term);
                                setRecentSearches(next);
                                // 删除按钮会随最后一条记录一起卸载，焦点要有人接
                                if (next.length === 0) inputRef.current?.focus();
                              }}
                              className="mr-1 rounded-full p-1 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                            >
                              <XIcon aria-hidden className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <ThemeToggle />
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="hidden rounded-lg md:inline-flex"
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
                <div className="flex flex-col gap-12 pb-4">
                  <HomeHero total={total} updated={updated} randomPool={randomPool} />
                  <HomeSections sections={homeSections} hueByLabel={hueByLabel} />
                  <Card className="flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-medium">{topics.length} 个主题，按需切换</p>
                      <p className="text-sm text-muted-foreground">
                        主题索引里还有完整的分类说明与书签导出。
                      </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-lg">
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
                    historyCount={historyCount}
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
                <Kbd>{shortcutLabel}</Kbd>
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
              <dd className="text-muted-foreground">把焦点交给第一个结果</dd>
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
