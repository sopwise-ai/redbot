import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { headMeta, headCount } from "@/lib/head-meta";
import type { ShellView } from "@/components/app-shell";
import type { CategoryGroup } from "@/lib/schema";

/**
 * 主区域报头：图标锚点 + 标题 + 右侧统计。
 * 文案全部来自 headMeta 查表（lib/head-meta.ts），这里只负责排版。
 */
export function ShellHeader({
  view,
  searching,
  activeGroup,
  groups,
  total,
  updated,
  searchCount,
  historyCount,
}: {
  view: ShellView;
  searching: boolean;
  activeGroup: CategoryGroup | null;
  groups: CategoryGroup[];
  total: number;
  updated: string;
  searchCount: number;
  historyCount: number;
}) {
  const meta = headMeta({ view, searching, activeGroup, total });
  const count = headCount({
    view,
    searching,
    searchCount,
    historyCount,
    activeGroupCount: activeGroup?.items.length ?? null,
    total,
  });

  return (
    <div className="border-b border-border/70 pt-10 pb-6">
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-[22px] leading-none shadow-xs"
        >
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl leading-[32px] font-semibold tracking-[-0.02em] sm:text-3xl sm:leading-[40px]">
              {meta.title}
            </h1>
            {count > 0 ? (
              <Badge variant="secondary" className="text-muted-foreground tabular-nums">
                {count}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-md">
            {meta.subtitle}
          </p>
        </div>
        {view !== "topics" && !searching ? (
          <div className="hidden shrink-0 text-right md:block">
            <Link
              href="/topics/"
              className="text-xs text-muted-foreground tabular-nums transition-colors hover:text-foreground hover:underline hover:underline-offset-2 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              {groups.length} 个主题
            </Link>
            <p className="mt-1 text-2xs text-muted-foreground/60 tabular-nums">更新于 {updated}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
