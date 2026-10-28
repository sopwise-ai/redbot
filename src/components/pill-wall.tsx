import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LinkItem } from "@/lib/schema";

/**
 * 8 个低饱和色相 + 按轮次错开明度：
 * 色相多了反而不易分辨，8 个足够拉开，同色相靠明度区分轮次。
 */
const HUES = [25, 55, 95, 150, 195, 240, 290, 330];
const LIGHTNESS = [0.66, 0.74, 0.56];

export function hueFor(index: number) {
  return {
    h: HUES[index % HUES.length],
    l: LIGHTNESS[Math.floor(index / HUES.length) % LIGHTNESS.length],
  };
}

/**
 * 按钮墙：条目宽度由内容决定，整块居中。
 * 主题不再用分区标题表达，改由左侧色点承担——色相按分类顺序用黄金角分布，
 * 同一分类的点连成一段同色，等于没有标题的分组。
 */
export function PillWall({
  items,
  hueByLabel,
}: {
  items: LinkItem[];
  hueByLabel: Map<string, { h: number; l: number }>;
}) {
  // 不打标题，但让同一主题的按钮成段：段内 8px，段间 20px
  const groups = new Map<string, LinkItem[]>();
  for (const item of items) {
    const key = item.tags[0];
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }

  return (
    <div className="flex flex-col gap-5">
      {[...groups.entries()].map(([label, list]) => (
        <ul key={label} aria-label={label} className="flex flex-wrap gap-2">
          {list.map((item) => (
            <li key={item.id}>
              <LinkPill item={item} tone={hueByLabel.get(label) ?? { h: 0, l: 0.66 }} />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

export function LinkPill({ item, tone }: { item: LinkItem; tone: { h: number; l: number } }) {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="group h-10 gap-2 rounded-xl bg-card px-3.5 font-medium shadow-[0_1px_2px_oklch(0.2_0.01_264/0.06)] hover:border-primary/30 hover:bg-accent hover:shadow-[0_2px_8px_oklch(0.2_0.01_264/0.1)] focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        title={item.desc}
        aria-label={`${item.name}：${item.desc}（在新标签页打开）`}
      >
        <span
          aria-hidden
          style={{ ["--dot-hue" as string]: tone.h, ["--dot-l" as string]: tone.l }}
          className="size-1.5 shrink-0 rounded-full bg-[oklch(var(--dot-l)_0.07_var(--dot-hue))] dark:bg-[oklch(0.76_0.06_var(--dot-hue))]"
        />
        <span className="max-w-[18rem] truncate">{item.name}</span>
        <ArrowUpRight
          aria-hidden
          className="size-3 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </a>
    </Button>
  );
}
