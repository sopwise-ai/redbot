"use client";

import * as React from "react";
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

/** 卡片外壳：链接行与可选中的管理行共用，避免两套变体各自漂移。 */
const shell = cn(
  "group/link h-full flex-nowrap gap-3 rounded-xl border-border/80 bg-card px-3 py-3 shadow-xs",
  "transition-[background-color,border-color,box-shadow] duration-150",
  "hover:border-ring/25 hover:bg-accent/60 hover:shadow-sm",
);

/**
 * 一个信息源：按钮墙、搜索结果、足迹三处共用。
 *
 * - `browse`：整行是外链，点击时记一次足迹；
 * - `manage`：足迹管理模式，整行变成带选中态的按钮（勾选由外部维护）。
 */
export function LinkCard({
  item,
  hue,
  showDescription = false,
  descLines = 1,
  meta,
  description,
  badge,
  variant = "browse",
  selected = false,
  onToggle,
  onOpen,
}: {
  item: LinkItem;
  /** 主题色相：来自该条目在 topics.json 里的主题，同一主题一种颜色 */
  hue: number;
  /** 是否显示推荐理由（主题页与搜索结果用） */
  showDescription?: boolean;
  /** 说明文字最多几行：搜索结果两行，主题页一行 */
  descLines?: 1 | 2;
  /** 卡片内的第二行元信息（足迹的点击数 / 时间）；给了就优先于 desc */
  meta?: string;
  /** 覆盖说明文字（搜索结果的「推荐理由 · 分组名」） */
  description?: string;
  /** 标题后的附加徽章（搜索结果的所属主题） */
  badge?: React.ReactNode;
  variant?: "browse" | "manage";
  selected?: boolean;
  onToggle?: (id: string) => void;
  /** 打开链接后的回调（搜索结果用来记录最近搜索） */
  onOpen?: () => void;
}) {
  const twoLine = descLines === 2;
  const text = meta ?? description ?? item.desc;

  const body = (
    <>
      <ItemMedia className={cn(twoLine ? "mt-1.5 self-start" : "self-center")}>
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
          <HueDot hue={hue} />
        )}
      </ItemMedia>

      <ItemContent className={cn(twoLine ? "gap-1" : "gap-0.5")}>
        <div className="flex min-w-0 items-center gap-2">
          <ItemTitle className="max-w-full min-w-0 truncate">{item.name}</ItemTitle>
          {badge}
        </div>
        {meta || showDescription ? (
          <ItemDescription
            className={cn("text-xs", twoLine ? "line-clamp-2 leading-5" : "line-clamp-1")}
          >
            {text}
          </ItemDescription>
        ) : null}
      </ItemContent>

      {variant === "manage" ? null : (
        <ItemActions className={cn("text-muted-foreground", twoLine && "mt-1 self-start")}>
          <ArrowUpRight
            aria-hidden
            className="size-3.5 transition-colors group-hover/link:text-primary"
          />
        </ItemActions>
      )}
    </>
  );

  if (variant === "manage") {
    return (
      <Button
        variant="outline"
        onClick={() => onToggle?.(item.id)}
        aria-pressed={selected}
        className={cn(
          shell,
          "w-full justify-start text-left font-normal",
          (showDescription || meta) && "items-start",
          selected && "border-primary/50 bg-primary/5",
        )}
      >
        {body}
      </Button>
    );
  }

  return (
    <Item
      asChild
      variant="outline"
      size="sm"
      className={cn(shell, (showDescription || meta) && "items-start")}
    >
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
function HueDot({ hue }: { hue: number }) {
  return (
    <span
      aria-hidden
      style={{ ["--dot-hue" as string]: hue }}
      className="size-2 shrink-0 rounded-full bg-[oklch(0.62_0.15_var(--dot-hue))] ring-3 ring-[oklch(0.62_0.15_var(--dot-hue)/0.14)] dark:bg-[oklch(0.74_0.13_var(--dot-hue))] dark:ring-[oklch(0.74_0.13_var(--dot-hue)/0.18)]"
    />
  );
}
