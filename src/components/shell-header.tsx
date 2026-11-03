import Link from "next/link";
import { PencilIcon } from "lucide-react";

import { ShareButton } from "@/components/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { headMeta, headCount } from "@/lib/head-meta";
import { site } from "@/lib/site";
import type { ShellView } from "@/components/app-shell";
import type { CategoryGroup } from "@/lib/schema";

/**
 * 主区域报头：图标锚点 + 标题 + 右侧统计。
 * 文案全部来自 headMeta 查表（lib/head-meta.ts），这里只负责排版。
 * 首页（isHome）只在这层叠加品牌三层：tagline / subtitle / trust。
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
  isHome = false,
}: {
  view: ShellView;
  searching: boolean;
  activeGroup: CategoryGroup | null;
  groups: CategoryGroup[];
  total: number;
  updated: string;
  searchCount: number;
  historyCount: number;
  /** 首页＝按钮墙 + 无分类 + 非搜索：品牌三层只在这里出现 */
  isHome?: boolean;
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
    <div className="pt-10 pb-6">
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-[22px] leading-none shadow-xs"
        >
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1
              className={
                isHome
                  ? "text-xl leading-7 font-semibold tracking-[-0.02em] sm:text-3xl sm:leading-[40px]"
                  : "text-2xl leading-[32px] font-semibold tracking-[-0.02em] sm:text-3xl sm:leading-[40px]"
              }
            >
              {isHome ? site.tagline : meta.title}
            </h1>
            {count > 0 && !isHome ? (
              <Badge variant="secondary" className="text-muted-foreground tabular-nums">
                {count}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground sm:text-md">
            {isHome ? site.subtitle : meta.subtitle}
          </p>
          {isHome ? (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{site.trust}</p>
          ) : null}
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
            <div className="hidden text-right md:block">
              <Link
                href="/topics/"
                className="text-xs text-muted-foreground tabular-nums transition-colors hover:text-foreground hover:underline hover:underline-offset-2 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
              >
                {groups.length} 个主题
              </Link>
              <p className="mt-1 text-2xs text-muted-foreground tabular-nums">更新于 {updated}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
