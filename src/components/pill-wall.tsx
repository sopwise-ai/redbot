"use client";

import { ArrowUpRight, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { recordVisit } from "@/lib/history";
import type { LinkItem } from "@/lib/schema";
import { cn } from "@/lib/utils";

export interface PillGroup {
  slug: string;
  name: string;
  items: LinkItem[];
}

/** 每一组包一层带 `data-cat` 的容器，方便按主题/分组定位与样式钩子。 */
export function PillWall({
  groups,
  hueByLabel,
  showHeading = false,
  showDescription = false,
}: {
  groups: PillGroup[];
  hueByLabel: Map<string, number>;
  /** 主题页有分组时，每组前显示小标题 */
  showHeading?: boolean;
  /** 是否在名称下补一行推荐理由（主题页与搜索结果用） */
  showDescription?: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.slug} data-cat={group.slug} className="flex flex-col gap-3">
          {showHeading ? (
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-medium">{group.name}</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {group.items.length}
              </span>
            </div>
          ) : null}
          <ul aria-label={group.name} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <li key={item.id} className="min-w-0">
                <LinkPill
                  item={item}
                  hue={hueByLabel.get(item.tags[0]) ?? 0}
                  showDescription={showDescription}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * 一个信息源。桌面端等宽网格里的卡片，移动端整行。
 * 说明文字只在有空间时出现：首页预览靠 6 条扫读，主题页才需要「为什么点它」。
 */
export function LinkPill({
  item,
  hue,
  showDescription = false,
  variant = "browse",
  selected = false,
  onToggle,
  onOpen,
}: {
  item: LinkItem;
  hue: number;
  showDescription?: boolean;
  /** browse：链接（默认）；manage：选中态复选按钮（足迹管理模式） */
  variant?: "browse" | "manage";
  selected?: boolean;
  onToggle?: (id: string) => void;
  /** 打开链接后的回调（搜索结果用来记录最近搜索） */
  onOpen?: () => void;
}) {
  const body = (
    <>
      <ItemMedia className="self-center">
        {variant === "manage" ? (
          <span
            aria-hidden
            className={cn(
              "flex size-4 items-center justify-center rounded-[6px] border transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background",
            )}
          >
            {selected ? <CheckIcon className="size-3" /> : null}
          </span>
        ) : (
          <Dot hue={hue} />
        )}
      </ItemMedia>

      <ItemContent className="gap-0.5">
        <ItemTitle className="max-w-full truncate">{item.name}</ItemTitle>
        {showDescription ? (
          <ItemDescription className="line-clamp-1 text-xs">{item.desc}</ItemDescription>
        ) : null}
      </ItemContent>

      {variant === "manage" ? null : (
        <ItemActions className="text-muted-foreground/60">
          <ArrowUpRight
            aria-hidden
            className="size-3.5 transition-colors group-hover/link:text-primary"
          />
        </ItemActions>
      )}
    </>
  );

  const shell = cn(
    "group/link h-full flex-nowrap gap-3 rounded-xl border-border/80 bg-card px-3 py-2.5 shadow-xs transition-[background-color,border-color,box-shadow] duration-150 hover:border-ring/25 hover:bg-accent/60 hover:shadow-sm",
    showDescription && "items-start py-3",
  );

  if (variant === "manage") {
    return (
      <Button
        variant="outline"
        onClick={() => onToggle?.(item.id)}
        aria-pressed={selected}
        className={cn(
          shell,
          "justify-start text-left font-normal",
          selected && "border-primary/50 bg-primary/5",
        )}
      >
        {body}
      </Button>
    );
  }

  return (
    <Item asChild variant="outline" size="sm" className={shell}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          recordVisit(item.id, item.topic?.slug);
          onOpen?.();
        }}
        title={item.desc}
        aria-label={`${item.name}：${item.desc}（在新标签页打开）`}
      >
        {body}
      </a>
    </Item>
  );
}

/** 站点身份色点：色相来自主题顺序，同一个主题下保持一致。 */
function Dot({ hue }: { hue: number }) {
  return (
    <span
      aria-hidden
      style={{ ["--dot-hue" as string]: hue }}
      className="size-2 shrink-0 rounded-full bg-[oklch(0.62_0.15_var(--dot-hue))] ring-3 ring-[oklch(0.62_0.15_var(--dot-hue)/0.14)] dark:bg-[oklch(0.74_0.13_var(--dot-hue))] dark:ring-[oklch(0.74_0.13_var(--dot-hue)/0.18)]"
    />
  );
}
