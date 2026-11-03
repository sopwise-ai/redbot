import Link from "next/link";
import { PencilIcon } from "lucide-react";

import { ShareButton } from "@/components/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { headCount, headMeta } from "@/lib/head-meta";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { CategoryGroup } from "@/lib/schema";
import type { ShellView } from "@/components/app-shell";

/**
 * 主区域报头：图标锚点 + 标题 + 右侧动作。
 * 文案全部来自 headMeta 查表（lib/head-meta.ts），这里只负责排版。
 * 首页不用这层，走 HomeHero。
 */
export function ShellHeader({
  view,
  searching,
  activeGroup,
  total,
  searchCount,
  historyCount,
  hue,
}: {
  view: ShellView;
  searching: boolean;
  activeGroup: CategoryGroup | null;
  total: number;
  searchCount: number;
  historyCount: number;
  /** 当前主题的色相（主题页才有），用来给图标块上淡色 */
  hue?: number;
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
    <div className="flex items-start justify-between gap-4 pt-8 pb-8 sm:pt-10">
      <div className="flex min-w-0 items-start gap-4">
        <span
          aria-hidden
          style={hue === undefined ? undefined : { ["--tile-hue" as string]: hue }}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-card text-2xl leading-none shadow-xs sm:size-12",
            hue !== undefined &&
              "bg-[oklch(0.96_0.035_var(--tile-hue))] dark:bg-[oklch(0.28_0.03_var(--tile-hue))]",
          )}
        >
          {meta.emoji}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              {meta.title}
            </h1>
            {count > 0 ? (
              <Badge variant="secondary" className="tabular-nums">
                {count}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1.5 max-w-prose text-sm text-muted-foreground sm:text-base">
            {meta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {activeGroup ? (
          <>
            <ShareButton
              title={`${site.name} · ${activeGroup.name}`}
              url={`${site.url}/topics/${activeGroup.slug}/`}
            />
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="relative text-muted-foreground after:absolute after:-inset-1.5 after:content-['']"
            >
              <a
                href={`${site.repo}/edit/main/data/topics/${activeGroup.slug}.json`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`在 GitHub 编辑「${activeGroup.name}」`}
              >
                <PencilIcon aria-hidden />
              </a>
            </Button>
          </>
        ) : null}
        {view !== "topics" && !searching ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden rounded-full text-muted-foreground md:inline-flex"
          >
            <Link href="/topics/">全部主题</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
