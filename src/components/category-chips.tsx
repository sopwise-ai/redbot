"use client";

import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ALL } from "@/lib/route-state";
import type { CategoryGroup } from "@/lib/schema";
import { cn } from "@/lib/utils";

const chipClass =
  "h-8 shrink-0 rounded-full border-transparent px-3.5 text-xs text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

/** 两端渐隐宽度（px）：给「这行还能滑」一个视觉信号 */
const EDGE = 12;

/**
 * 移动端的主题筛选条：从抽屉里拉出来钉在页头下面。
 *
 * 除了横滑，这里必须多做两件事，否则用户在手机上不知道自己选了什么：
 * 1. **选中项跟手**：从抽屉点「工具」后，chip 行还停在最左，
 *    选中项在 x=1323（视口宽 390），整行看不出高亮——等于没反馈；
 * 2. **两端渐隐**：提示这行可以横滑，原来只能靠右侧被切掉半个 chip 去猜。
 *
 * 滚动容器用项目已有的 ScrollArea，不自己写一套（AGENTS.md 约定 2）。
 */
export function CategoryChips({
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
  const root = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ start: true, end: false });

  const viewportEl = React.useCallback(
    () => root.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]') ?? null,
    [],
  );

  const syncEdges = React.useCallback((el: HTMLElement) => {
    const start = el.scrollLeft <= 1;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    // 只在边缘状态真的变了才 setState：滚动是高频事件
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  // 挂载后测一次：内容宽度可能小于视口，此时两端都不该渐隐
  React.useEffect(() => {
    const el = viewportEl();
    // 挂载后必须量一次 DOM（内容宽度只有挂载后才知道）；滚动时同一函数走事件回调，不受影响
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (el) syncEdges(el);
  }, [viewportEl, syncEdges, groups.length]);

  // 选中项滚进视野。延后一帧再滚：分类切换包在 startViewTransition 里，
  // 快照捕获期间滚动会让两张快照的内容位置不一致（AGENTS.md 的 scrollTo 同源坑）
  React.useEffect(() => {
    const id = requestAnimationFrame(() => {
      const item = viewportEl()?.querySelector<HTMLElement>('[data-state="on"]');
      if (!item) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      item.scrollIntoView({
        inline: "center",
        // 必须 nearest：默认的 start/center 会把整页一起顶上去
        block: "nearest",
        behavior: reduced ? "auto" : "smooth",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [active, viewportEl]);

  // 由边缘状态拼 mask：贴边的一侧不渐隐，否则第一个/最后一个 chip 会被削掉
  const mask =
    edges.start && edges.end
      ? undefined
      : edges.start
        ? `linear-gradient(to right, black calc(100% - ${EDGE}px), transparent)`
        : edges.end
          ? `linear-gradient(to right, transparent, black ${EDGE}px)`
          : `linear-gradient(to right, transparent, black ${EDGE}px, black calc(100% - ${EDGE}px), transparent)`;

  return (
    <ScrollArea
      ref={root}
      className="w-full"
      // scroll 不冒泡，但捕获阶段会经过 Root
      onScrollCapture={(event) => {
        const el = event.target as HTMLElement;
        if (el.dataset.slot === "scroll-area-viewport") syncEdges(el);
      }}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
    >
      <div className="px-4 py-2">
        <ToggleGroup
          type="single"
          value={active}
          onValueChange={(value) => onSelect(value || ALL)}
          aria-label="按主题过滤"
          className={cn("w-max gap-1", className)}
        >
          <ToggleGroupItem value={ALL} className={chipClass}>
            全部
            <span className="text-2xs tabular-nums">{total}</span>
          </ToggleGroupItem>
          {groups.map((group) => (
            <ToggleGroupItem key={group.slug} value={group.slug} className={chipClass}>
              {group.label}
              <span className="text-2xs tabular-nums">{group.items.length}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </ScrollArea>
  );
}
