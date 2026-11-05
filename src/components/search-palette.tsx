"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, ClockIcon, SearchIcon } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { loadCorpus } from "@/lib/corpus";
import { recordVisit } from "@/lib/history";
import {
  clearRecentSearches,
  readRecentSearches,
  rememberSearch,
  removeRecentSearch,
} from "@/lib/recent-searches";
import { createSearchIndex } from "@/lib/search";
import type { LinkItem } from "@/lib/schema";
import { useShortcutLabel } from "@/lib/use-shortcut-label";

/**
 * ⌘K 命令面板：跳页面 + 全站搜索条目。
 *
 * 和顶栏输入框分工：输入框是「边打边筛」（`/` 聚焦），面板是「一次跳到位」。
 * 结果直接打开外链；「查看全部」把 query 交给 /search/ 页。
 */
const OPEN_EVENT = "redbot:open-search";

/** 移动端顶栏的搜索按钮用它打开面板（面板本身没有可见触发器） */
export function openSearchPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function SearchPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [corpus, setCorpus] = React.useState<LinkItem[] | null>(null);
  const [recent, setRecent] = React.useState<string[]>([]);
  const router = useRouter();
  const shortcutLabel = useShortcutLabel();

  React.useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.isComposing || event.keyCode === 229) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    // 静态导出没有服务端状态：打开面板时才读最近搜索与语料
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(readRecentSearches());
    if (!corpus) {
      void loadCorpus()
        .then(setCorpus)
        .catch(() => setCorpus([]));
    }
  }, [open, corpus]);

  const trimmed = query.trim();
  const results = React.useMemo(() => {
    if (!corpus || !trimmed) return [];
    return createSearchIndex(corpus).search(trimmed).slice(0, 7);
  }, [corpus, trimmed]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function openLink(item: LinkItem) {
    recordVisit(item.id, item.topic?.slug);
    if (trimmed) setRecent(rememberSearch(trimmed));
    setOpen(false);
    setQuery("");
    window.open(item.url, "_blank", "noopener,noreferrer");
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="搜索信息源"
      description="搜索全部信息源，或跳转到页面"
    >
      <CommandInput
        placeholder="搜索信息源，或输入页面名…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {corpus ? `没有找到「${trimmed}」。换个关键词试试。` : "正在加载信息源…"}
        </CommandEmpty>

        {trimmed && !corpus ? (
          <CommandGroup heading="信息源">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="ml-auto h-3 w-10" />
              </div>
            ))}
          </CommandGroup>
        ) : trimmed ? (
          <CommandGroup heading="信息源">
            {results.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.name} ${item.id} ${trimmed}`}
                onSelect={() => openLink(item)}
                className="gap-2 data-[selected=true]:ring-1 data-[selected=true]:ring-ring/40"
              >
                <SearchIcon aria-hidden className="text-muted-foreground" />
                <span className="truncate">{item.name}</span>
                <span className="truncate text-xs text-muted-foreground">{item.desc}</span>
                {item.topic ? (
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {item.topic.name}
                  </span>
                ) : null}
              </CommandItem>
            ))}
            <CommandItem
              value="__all__"
              onSelect={() => go(`/search/?q=${encodeURIComponent(trimmed)}`)}
            >
              <ArrowRightIcon aria-hidden className="text-muted-foreground" />
              查看「{trimmed}」的全部结果
            </CommandItem>
          </CommandGroup>
        ) : (
          <>
            <CommandGroup heading="去往">
              <CommandItem value="首页" onSelect={() => go("/")}>
                首页
              </CommandItem>
              <CommandItem value="足迹" onSelect={() => go("/history/")}>
                足迹
              </CommandItem>
              <CommandItem value="全部主题" onSelect={() => go("/topics/")}>
                全部主题
              </CommandItem>
              <CommandItem value="关于" onSelect={() => go("/about/")}>
                关于
              </CommandItem>
            </CommandGroup>

            {recent.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="最近搜索">
                  {recent.slice(0, 5).map((term) => (
                    <CommandItem
                      key={term}
                      value={`最近 ${term}`}
                      onSelect={() => setQuery(term)}
                      className="gap-2 data-[selected=true]:ring-1 data-[selected=true]:ring-ring/40"
                    >
                      <ClockIcon aria-hidden className="text-muted-foreground" />
                      {term}
                      <button
                        type="button"
                        aria-label={`删除「${term}」`}
                        className="ml-auto rounded-sm p-1 text-muted-foreground hover:text-foreground"
                        onClick={(event) => {
                          event.stopPropagation();
                          setRecent(removeRecentSearch(term));
                        }}
                      >
                        ×
                      </button>
                    </CommandItem>
                  ))}
                  <CommandItem
                    value="清空最近搜索"
                    onSelect={() => setRecent(clearRecentSearches())}
                    className="text-muted-foreground"
                  >
                    清空最近搜索
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </>
        )}
      </CommandList>

      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <span>↑↓ 选择 · ↵ 打开 · Esc 关闭</span>
        <span className="hidden tabular-nums sm:inline">{shortcutLabel}</span>
      </div>
    </CommandDialog>
  );
}
