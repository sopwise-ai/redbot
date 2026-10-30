"use client";

import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { recordVisit } from "@/lib/history";
import type { LinkItem } from "@/lib/schema";

/**
 * 8 个低饱和色相，按分类顺序分配。
 * 同一个色相既做色点，也做文字色，保证每个分类有自己的辨识度。
 */
const HUES = [25, 55, 95, 150, 195, 240, 290, 330];

export function hueFor(index: number) {
  return HUES[index % HUES.length];
}

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

export function LinkPill({ item, hue }: { item: LinkItem; hue: number }) {
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
