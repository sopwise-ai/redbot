"use client";

import { ArrowUpRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

/**
 * 搜索结果：名称 + 推荐理由 + 所属主题，一个结果就是一张可点的卡。
 * 手机上按钮没有 hover，说明文字是唯一能判断「要不要点」的线索。
 */
export function SearchResults({
  items,
  hueByLabel,
  onOpen,
}: {
  items: LinkItem[];
  hueByLabel: Map<string, number>;
  onOpen?: (item: LinkItem) => void;
}) {
  return (
    <ul data-search-results className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const hue = hueByLabel.get(item.tags[0]) ?? 0;
        return (
          <li key={item.id} className="min-w-0">
            <Item
              asChild
              variant="outline"
              size="sm"
              className="group/link h-full flex-nowrap items-start gap-3 rounded-xl border-border/80 bg-card px-3 py-3 shadow-xs transition-[background-color,border-color,box-shadow] hover:border-ring/25 hover:bg-accent/60 hover:shadow-sm"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  recordVisit(item.id, item.topic?.slug);
                  onOpen?.(item);
                }}
                title={item.desc}
                aria-label={`${item.name}：${item.desc}（在新标签页打开）`}
              >
                <ItemMedia className="mt-1.5 self-start">
                  <span
                    aria-hidden
                    style={{ ["--dot-hue" as string]: hue }}
                    className="size-2 shrink-0 rounded-full bg-[oklch(0.62_0.15_var(--dot-hue))] ring-3 ring-[oklch(0.62_0.15_var(--dot-hue)/0.14)] dark:bg-[oklch(0.74_0.13_var(--dot-hue))] dark:ring-[oklch(0.74_0.13_var(--dot-hue)/0.18)]"
                  />
                </ItemMedia>

                <ItemContent className="gap-1">
                  {/* 主题紧跟在站名后面：单独一行会把卡片顶成三行，一屏少看好几条 */}
                  <div className="flex min-w-0 items-center gap-2">
                    <ItemTitle className="min-w-0 truncate">{item.name}</ItemTitle>
                    {item.topic ? (
                      <Badge
                        variant="secondary"
                        className="h-5 shrink-0 px-1.5 text-xs font-normal"
                      >
                        {item.topic.name}
                      </Badge>
                    ) : null}
                  </div>
                  <ItemDescription className="line-clamp-2 text-xs leading-5">
                    {item.desc}
                    {item.group ? (
                      <span className="text-muted-foreground"> · {item.group.name}</span>
                    ) : null}
                  </ItemDescription>
                </ItemContent>

                <ItemActions className="mt-1 self-start text-muted-foreground">
                  <ArrowUpRightIcon
                    aria-hidden
                    className="size-3.5 transition-colors group-hover/link:text-primary"
                  />
                </ItemActions>
              </a>
            </Item>
          </li>
        );
      })}
    </ul>
  );
}
