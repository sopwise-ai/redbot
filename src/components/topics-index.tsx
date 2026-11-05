import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { BookmarkExport } from "@/components/bookmark-export";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { hueFor } from "@/lib/groups";
import type { TopicSummary } from "@/lib/schema";

/** 主题索引：渲染在主区域里，与按钮墙共用同一个外壳 */
export function TopicsIndex({ topics }: { topics: TopicSummary[] }) {
  return (
    <>
      <ul className="flex flex-wrap justify-center gap-3">
        {topics.map((item, index) => (
          <li
            key={item.slug}
            className="w-full min-w-0 sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-1.5rem)/3)]"
          >
            <Item
              asChild
              variant="outline"
              size="sm"
              className="group/link h-full flex-nowrap bg-card hover:border-ring/40 hover:bg-accent"
            >
              <Link href={`/topics/${item.slug}/`}>
                <ItemMedia>
                  <span
                    aria-hidden
                    style={{ ["--tile-hue" as string]: hueFor(index) }}
                    className="flex size-8 items-center justify-center rounded-md bg-[oklch(0.965_0.022_var(--tile-hue))] text-sm leading-none dark:bg-[oklch(0.28_0.02_var(--tile-hue))]"
                  >
                    {item.emoji}
                  </span>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="min-w-0 truncate">{item.name}</ItemTitle>
                  <ItemDescription className="line-clamp-1">{item.desc}</ItemDescription>
                </ItemContent>
                <ItemActions className="gap-2 text-muted-foreground">
                  <span className="text-xs tabular-nums">{item.count}</span>
                  <ChevronRightIcon
                    aria-hidden
                    className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transform-none"
                  />
                </ItemActions>
              </Link>
            </Item>
          </li>
        ))}
      </ul>
      <BookmarkExport total={topics.reduce((sum, topic) => sum + topic.count, 0)} />
    </>
  );
}
