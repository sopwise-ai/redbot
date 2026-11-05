"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import type { ShellView } from "@/lib/route-state";
import type { TopicSummary } from "@/lib/schema";
import { cn } from "@/lib/utils";

/** 页面级入口：固定在最左，不参与分类条滚动。 */
const PAGES = [
  { key: "home", href: "/", label: "首页" },
  { key: "history", href: "/history/", label: "足迹" },
  { key: "topics", href: "/topics/", label: "全部主题" },
] as const;

/**
 * 桌面端第二行导航：页面入口 + 可横滑的分类 + 「全部分类」面板。
 *
 * - 分类条不带计数（17 个名字刚好能在 1200 容器里排下；带计数就必然溢出）；
 *   计数只在「全部分类」面板里出现。
 * - 当前分类切进视野用 scrollIntoView，避免在右侧滚动区外。
 * - 面板 hover 展开、点击固定；Esc / 点外部关闭，键盘可达。
 */
export function SiteNav({
  topics,
  view,
  activeSlug,
}: {
  topics: TopicSummary[];
  view: ShellView;
  activeSlug: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const activeRef = React.useRef<HTMLAnchorElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const closeTimer = React.useRef<number | null>(null);
  const [overflowing, setOverflowing] = React.useState(false);
  const [atEnd, setAtEnd] = React.useState(false);

  const isHome = view === "wall" && !activeSlug;
  const isHistory = view === "history";
  const isTopics = view === "topics";

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openPanel = React.useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = React.useCallback(() => {
    if (pinned) return;
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  }, [clearCloseTimer, pinned]);

  React.useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  // 点外部 / Esc 收起；Esc 把焦点还给触发按钮
  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (wrapRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      setPinned(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      setPinned(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // 只有真的溢出、且还没滚到最右时才画渐隐；否则最后一个分类会被盖上一层灰
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const check = () => {
      const overflow = el.scrollWidth - el.clientWidth;
      setOverflowing(overflow > 32);
      setAtEnd(overflow <= 32 || el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [topics]);

  // 切主题时把当前分类滚进视野；reduced motion 下直接跳
  React.useEffect(() => {
    if (!activeSlug) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    activeRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [activeSlug]);

  return (
    <nav
      aria-label="主题导航"
      className="mx-auto flex h-11 w-full max-w-[1200px] items-center gap-2 px-4 sm:px-6 lg:px-8"
    >
      <div className="flex shrink-0 items-center">
        {PAGES.map((page) => {
          const active =
            (page.key === "home" && isHome) ||
            (page.key === "history" && isHistory) ||
            (page.key === "topics" && isTopics);
          return (
            <Link
              key={page.key}
              href={page.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center border-b-2 px-2.5 text-sm transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {page.label}
            </Link>
          );
        })}
      </div>

      <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />

      <div className="relative min-w-0 flex-1">
        <div
          ref={scrollerRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
          }}
          className="scrollbar-none flex items-center overflow-x-auto"
        >
          {topics.map((topic) => {
            const active = topic.slug === activeSlug;
            return (
              <Link
                key={topic.slug}
                href={`/topics/${topic.slug}/`}
                ref={active ? activeRef : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 shrink-0 items-center border-b-2 px-2.5 text-sm transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {topic.name}
              </Link>
            );
          })}
        </div>
        {overflowing && !atEnd ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
        ) : null}
      </div>

      <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />

      <div
        ref={wrapRef}
        className="relative shrink-0"
        onMouseEnter={openPanel}
        onMouseLeave={scheduleClose}
      >
        <button
          ref={triggerRef}
          type="button"
          id="all-topics-trigger"
          aria-expanded={open}
          aria-controls="all-topics"
          onClick={() => {
            if (pinned) {
              setPinned(false);
              setOpen(false);
            } else {
              setPinned(true);
              setOpen(true);
            }
          }}
          className="flex h-11 items-center gap-1 border-b-2 border-transparent px-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          全部分类
          <ChevronDown
            aria-hidden
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </button>

        {open ? (
          <div
            id="all-topics"
            role="group"
            aria-labelledby="all-topics-trigger"
            className="absolute top-full right-0 z-50 mt-1 w-[540px] rounded-lg border border-border/80 bg-popover p-2 shadow-xl"
          >
            <div className="grid grid-cols-3 gap-1">
              {topics.map((topic) => {
                const active = topic.slug === activeSlug;
                return (
                  <Link
                    key={topic.slug}
                    href={`/topics/${topic.slug}/`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      setOpen(false);
                      setPinned(false);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                      active && "bg-accent/60 text-foreground",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden>{topic.emoji}</span>
                      <span className="truncate">{topic.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {topic.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
