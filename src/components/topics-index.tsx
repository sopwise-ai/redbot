import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { BookmarkExport } from "@/components/bookmark-export";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { hueFor } from "@/lib/groups";
import type { TopicSummary } from "@/lib/schema";

/** 主题索引：渲染在主区域里，与按钮墙共用同一个外壳 */
export function TopicsIndex({ topics }: { topics: TopicSummary[] }) {
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((item, index) => (
          <li key={item.slug} className="min-w-0">
            <Card className="group relative h-full gap-0 overflow-hidden py-0 transition-colors duration-150 hover:border-ring/30 has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50">
              <div className="flex items-start gap-3 p-4">
                <span
                  aria-hidden
                  style={{ ["--tile-hue" as string]: hueFor(index) }}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.965_0.022_var(--tile-hue))] text-base leading-none dark:bg-[oklch(0.27_0.02_var(--tile-hue))]"
                >
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Link
                      href={`/topics/${item.slug}/`}
                      className="truncate outline-none after:absolute after:inset-0 after:content-['']"
                    >
                      {item.name}
                    </Link>
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs tabular-nums">
                      {item.count}
                    </Badge>
                  </CardTitle>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRightIcon
                  aria-hidden
                  className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                />
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <BookmarkExport total={topics.reduce((sum, topic) => sum + topic.count, 0)} />
    </>
  );
}
