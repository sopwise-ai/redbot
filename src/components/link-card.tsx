"use client";

import * as React from "react";
import { ArrowUpRight, CheckIcon } from "lucide-react";

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

/**
 * 一个信息源：按钮墙、搜索结果、足迹三处共用。
 *
 * 视觉全部交给 Item 的 `outline` + `sm` 变体：圆角、内边距、边框、hover 都来自组件本身，
 * 这里只留布局（等高、单行不换行）与 `browse` / `manage` 的行为差异。
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
  const text = meta ?? description ?? item.desc;

  const body = (
    <>
      <ItemMedia>
        {variant === "manage" ? (
          <span
            aria-hidden
            className={cn(
              "flex size-4 items-center justify-center rounded-[4px] border transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background",
            )}
          >
            {selected ? <CheckIcon className="size-3" /> : null}
          </span>
        ) : (
          <HueDot hue={hue} />
        )}
      </ItemMedia>

      <ItemContent>
        <div className="flex min-w-0 items-center gap-2">
          <ItemTitle className="min-w-0 truncate">{item.name}</ItemTitle>
          {badge}
        </div>
        {meta || showDescription ? (
          <ItemDescription className={descLines === 2 ? undefined : "line-clamp-1"}>
            {text}
          </ItemDescription>
        ) : null}
      </ItemContent>

      {variant === "manage" ? null : (
        <ItemActions className="text-muted-foreground">
          <ArrowUpRight
            aria-hidden
            className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 group-hover/link:text-primary motion-reduce:transform-none"
          />
        </ItemActions>
      )}
    </>
  );

  if (variant === "manage") {
    return (
      <Item
        asChild
        variant="outline"
        size="sm"
        className={cn(
          "group/link h-full w-full flex-nowrap bg-card text-left hover:border-ring/40 hover:bg-accent",
          selected && "bg-accent ring-1 ring-ring",
        )}
      >
        <button type="button" onClick={() => onToggle?.(item.id)} aria-pressed={selected}>
          {body}
        </button>
      </Item>
    );
  }

  return (
    <Item
      asChild
      variant="outline"
      size="sm"
      className="group/link h-full flex-nowrap bg-card hover:border-ring/40 hover:bg-accent"
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
      className="size-2 shrink-0 rounded-full bg-[oklch(0.62_0.12_var(--dot-hue))] dark:bg-[oklch(0.72_0.1_var(--dot-hue))]"
    />
  );
}
