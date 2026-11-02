import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { CategoryGroup } from "@/lib/schema";

/** 主题索引：渲染在主区域里，与按钮墙共用同一个外壳 */
export function TopicsIndex({ groups }: { groups: CategoryGroup[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((item) => (
        <li key={item.slug}>
          <Link
            href={`/topics/${item.slug}/`}
            className="group flex h-full items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-xs transition-[background-color,border-color,box-shadow] duration-150 ease-[cubic-bezier(.2,.8,.2,1)] hover:border-ring/25 hover:bg-accent hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none"
          >
            <span aria-hidden className="mt-0.5 w-[18px] shrink-0 text-center text-md leading-none">
              {item.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="text-md font-medium">{item.label}</span>
                <span className="text-2xs text-muted-foreground tabular-nums">
                  {item.items.length}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                {item.blurb}
              </span>
            </span>
            <ArrowUpRight
              aria-hidden
              className="mt-1 size-3.5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
