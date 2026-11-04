"use client";

import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { GroupMeta, LinkItem } from "@/lib/schema";

export const ALL_GROUPS = "all";
export const UNGROUPED_GROUP = "ungrouped";

/** 两端渐隐宽度（px）：提示这行还能横滑 */
const EDGE = 12;

const chipClass =
  "h-8 shrink-0 gap-1.5 rounded-full border border-border/70 bg-card px-3 text-xs font-normal text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-none";

/**
 * 主题页内的分组筛选；没有 groups 的主题不渲染。
 *
 * 分组多的时候整行要横滑，所以这里补两件事：
 * 1. 选中项跟着滚进视野——手机上从别处进来时，选中项可能在视口外，看不出当前在哪个分组；
 * 2. 两端渐隐——否则只能靠右侧被切掉半个 chip 去猜这行还能滑。
 */
export function GroupFilter({
  groups,
  items,
  value,
  onChange,
}: {
  groups: GroupMeta[];
  items: LinkItem[];
  /** 空串 = 全部 */
  value: string;
  onChange: (slug: string) => void;
}) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ start: true, end: false });

  const syncEdges = React.useCallback((el: HTMLElement) => {
    const start = el.scrollLeft <= 1;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  React.useEffect(() => {
    const el = scroller.current;
    if (el) syncEdges(el);
  }, [syncEdges, groups.length]);

  // 选中项滚进视野。block: nearest 是必须的，否则会把整页一起顶上去
  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const active = el.querySelector<HTMLElement>('[data-state="on"]');
      if (!active) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      active.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: reduced ? "auto" : "smooth",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [value]);

  if (groups.length === 0) return null;

  const countOf = (slug: string) =>
    items.filter((item) => (slug === UNGROUPED_GROUP ? !item.group : item.group?.slug === slug))
      .length;
  const ungrouped = countOf(UNGROUPED_GROUP);

  const mask =
    edges.start && edges.end
      ? undefined
      : edges.start
        ? `linear-gradient(to right, black calc(100% - ${EDGE}px), transparent)`
        : edges.end
          ? `linear-gradient(to right, transparent, black ${EDGE}px)`
          : `linear-gradient(to right, transparent, black ${EDGE}px, black calc(100% - ${EDGE}px), transparent)`;

  return (
    <div
      ref={scroller}
      onScroll={(event) => syncEdges(event.currentTarget)}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      className="-mx-1 mb-6 scrollbar-none overflow-x-auto overscroll-x-contain"
    >
      <ToggleGroup
        type="single"
        value={value || ALL_GROUPS}
        onValueChange={(next) => onChange(!next || next === ALL_GROUPS ? "" : next)}
        aria-label="按分组筛选"
        className="w-max gap-1.5 px-1 py-1"
      >
        <ToggleGroupItem value={ALL_GROUPS} className={chipClass}>
          全部
          <span className="tabular-nums">{items.length}</span>
        </ToggleGroupItem>
        {groups.map((group) => (
          <ToggleGroupItem key={group.slug} value={group.slug} className={chipClass}>
            {group.name}
            <span className="tabular-nums">{countOf(group.slug)}</span>
          </ToggleGroupItem>
        ))}
        {ungrouped > 0 ? (
          <ToggleGroupItem value={UNGROUPED_GROUP} className={chipClass}>
            未分组
            <span className="tabular-nums">{ungrouped}</span>
          </ToggleGroupItem>
        ) : null}
      </ToggleGroup>
    </div>
  );
}
