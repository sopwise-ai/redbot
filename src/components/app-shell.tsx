"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { ArrowUpRight, SearchIcon, XIcon } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { PillWall, hueFor } from "@/components/pill-wall";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CategoryGroup } from "@/lib/schema";
import { site } from "@/lib/site";
import { createSearchIndex } from "@/lib/search";
import { cn } from "@/lib/utils";

const ALL = "all";

export function AppShell({
  groups,
  total,
  updated,
}: {
  groups: CategoryGroup[];
  total: number;
  updated: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState<string>(ALL);

  const fuse = React.useMemo(
    () => createSearchIndex(groups.flatMap((group) => group.items)),
    [groups],
  );

  const trimmed = query.trim();
  const activeGroup = groups.find((group) => group.slug === active) ?? null;

  const results = React.useMemo(() => {
    if (!trimmed) return null;
    const found = fuse.search(trimmed).map((result) => result.item);
    return activeGroup ? found.filter((item) => item.tags[0] === activeGroup.label) : found;
  }, [fuse, trimmed, activeGroup]);

  /**
   * 分类切换走浏览器原生 View Transitions：只对内容区做交叉淡入淡出，
   * 侧栏/顶栏保持不动。不支持或开启减弱动效时直接切换。
   */
  const switchCategory = React.useCallback(
    (next: string) => {
      if (next === active) return;
      // 先回到顶部：否则切完分类会停在旧滚动位置，落在新列表的中段
      window.scrollTo({ top: 0 });
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
    [active],
  );

  const hueByLabel = React.useMemo(
    () => new Map(groups.map((group, index) => [group.label, hueFor(index)])),
    [groups],
  );

  const items = activeGroup ? activeGroup.items : groups.flatMap((group) => group.items);
  const visibleGroups = activeGroup ? [activeGroup] : groups;
  const visibleCount = (results ?? visibleGroups.flatMap((group) => group.items)).length;

  // 首次进入：从 URL 还原筛选状态
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tag = params.get("tag");
    const q = params.get("q");
    if (tag && groups.some((group) => group.slug === tag)) setActive(tag);
    if (q) setQuery(q);
  }, [groups]);

  // 状态回写 URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (active === ALL) params.delete("tag");
    else params.set("tag", active);
    if (query) params.set("q", query);
    else params.delete("q");
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }, [active, query]);

  // 进入搜索态时回到顶部：结果列表比「全部」短，否则会落在结果中段
  const wasSearching = React.useRef(false);
  React.useEffect(() => {
    const searching = trimmed.length > 0;
    if (searching && !wasSearching.current) window.scrollTo({ top: 0 });
    wasSearching.current = searching;
  }, [trimmed]);

  // ⌘K 聚焦搜索，Esc 清空
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (event.key === "Escape") {
        if (document.activeElement === inputRef.current) {
          setQuery("");
          inputRef.current?.blur();
        } else {
          setQuery("");
          setActive(ALL);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const title = trimmed ? "搜索结果" : (activeGroup?.label ?? "全部信息源");
  const subtitle = trimmed
    ? activeGroup
      ? `在「${activeGroup.label}」中搜索「${trimmed}」`
      : `全站搜索「${trimmed}」`
    : (activeGroup?.blurb ?? `点一下直达 · ${groups.length} 个主题 · 由社区通过 Pull Request 维护`);

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md focus:ring-[3px] focus:ring-ring/50 focus:outline-none"
      >
        跳到内容
      </a>
      <SidebarProvider>
        <AppSidebar groups={groups} total={total} active={active} onSelect={switchCategory} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 shrink-0 border-b border-border/70 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-2 px-4 lg:px-6">
              <SidebarTrigger className="-ml-1 md:hidden" />
              <span className="text-sm font-semibold md:hidden">{site.name}</span>

              <div className="relative min-w-0 max-w-sm flex-1">
                <SearchIcon
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索信息源…"
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
                  <Kbd className="absolute top-1/2 right-2 hidden -translate-y-1/2 sm:inline-flex">
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
                  <a href={site.repo} target="_blank" rel="noreferrer">
                    GitHub
                    <ArrowUpRight aria-hidden className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </header>

          {/* 移动端：把主题筛选从抽屉里拉出来，避免唯一的核心交互被藏起来 */}
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

          <main id="content" tabIndex={-1} className="flex-1 px-4 pb-10 outline-none lg:px-6">
            <div className="mx-auto w-full max-w-[1200px]">
              <div className="pt-10 pb-7">
                <div className="flex items-center gap-2">
                  <h1 className="text-[28px] leading-tight font-semibold tracking-tight">
                    {title}
                  </h1>
                  {visibleCount > 0 ? (
                    <Badge
                      variant="secondary"
                      className="border-transparent bg-primary/10 tabular-nums text-primary"
                    >
                      {visibleCount}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
              </div>

              <p className="sr-only" aria-live="polite">
                {results ? `找到 ${results.length} 个结果` : `共 ${visibleCount} 个信息源`}
              </p>

              <div className={trimmed ? "animate-in fade-in-0 duration-200" : undefined}>
                {results && results.length === 0 ? (
                  <Empty className="mx-auto w-full max-w-xl border">
                    <EmptyHeader>
                      <EmptyTitle className="text-base">没有匹配的信息源</EmptyTitle>
                      <EmptyDescription>
                        {activeGroup
                          ? `「${activeGroup.label}」里没有和「${trimmed}」相关的结果。`
                          : `没有和「${trimmed}」相关的结果。`}
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent className="flex-row justify-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setQuery("");
                          switchCategory(ALL);
                          inputRef.current?.focus();
                        }}
                      >
                        清除搜索
                      </Button>
                      {activeGroup ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-full"
                          onClick={() => switchCategory(ALL)}
                        >
                          在全部主题中搜索
                        </Button>
                      ) : null}
                    </EmptyContent>
                  </Empty>
                ) : (
                  <PillWall items={results ?? items} hueByLabel={hueByLabel} />
                )}
              </div>
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
        <span className="text-[10px] tabular-nums opacity-50">{total}</span>
      </ToggleGroupItem>
      {groups.map((group) => (
        <ToggleGroupItem key={group.slug} value={group.slug} className={chipClass}>
          {group.label}
          <span className="text-[10px] tabular-nums opacity-50">{group.items.length}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const chipClass =
  "h-8 shrink-0 rounded-full border-transparent px-3.5 text-xs text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";
