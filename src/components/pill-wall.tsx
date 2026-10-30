"use client";

import { ArrowUpRight, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { recordVisit } from "@/lib/history";
import type { LinkItem } from "@/lib/schema";
import { cn } from "@/lib/utils";

export interface PillGroup {
  slug: string;
  label: string;
  items: LinkItem[];
}

/**
 * 每一组都包一层带 `data-cat` 的容器：
 * 首帧（JS 还没跑）由 layout 注入的 CSS 依据 `html[data-tag]` 直接隐藏非目标组，
 * 避免「先渲染全部、再切到分类」的跳动。
 */
export function PillWall({
  groups,
  hueByLabel,
}: {
  groups: PillGroup[];
  hueByLabel: Map<string, number>;
}) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <div
          key={group.slug}
          data-cat={group.slug}
          data-search={group.slug === "search" ? "" : undefined}
          className="pill-group"
        >
          <ul
            aria-label={group.label}
            className="flex flex-wrap gap-2 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(172px,1fr))]"
          >
            {group.items.map((item) => (
              <li key={item.id}>
                <LinkPill item={item} hue={hueByLabel.get(item.tags[0]) ?? 0} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function LinkPill({
  item,
  hue,
  variant = "browse",
  selected = false,
  onToggle,
}: {
  item: LinkItem;
  hue: number;
  /** browse：链接（默认）；manage：选中态复选按钮（足迹管理模式） */
  variant?: "browse" | "manage";
  selected?: boolean;
  onToggle?: (id: string) => void;
}) {
  if (variant === "manage") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onToggle?.(item.id)}
        aria-pressed={selected}
        className={cn(
          "group h-9 w-full justify-between gap-2.5 rounded-lg border-border bg-card px-3 text-base font-normal text-foreground/90 shadow-xs transition-[background-color,border-color,box-shadow] duration-150 hover:border-ring/25 hover:bg-accent hover:text-foreground hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none",
          selected && "border-primary/60 bg-primary/5",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-[5px] border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
          )}
        >
          {selected ? <CheckIcon className="size-3" /> : null}
        </span>
        <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="group h-9 justify-between gap-2.5 rounded-lg border-border bg-card px-3 text-base font-normal text-foreground/90 shadow-xs transition-[background-color,border-color,box-shadow,color] duration-150 ease-[cubic-bezier(.2,.8,.2,1)] hover:border-ring/25 hover:bg-accent hover:text-foreground hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0 lg:w-full"
    >
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordVisit(item.id)}
        title={item.desc}
        aria-label={`${item.name}：${item.desc}（在新标签页打开）`}
      >
        <span
          aria-hidden
          style={{ ["--dot-hue" as string]: hue }}
          className="size-[5px] shrink-0 rounded-full bg-[oklch(0.64_0.13_var(--dot-hue))] dark:bg-[oklch(0.75_0.11_var(--dot-hue))]"
        />
        <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
        <ArrowUpRight
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground/35 transition-colors group-hover:text-primary"
        />
      </a>
    </Button>
  );
}
