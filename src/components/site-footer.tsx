"use client";

import { ArrowUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export function SiteFooter({
  total,
  categories,
  updated,
}: {
  total: number;
  categories: number;
  updated: string;
}) {
  function backToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary"
          >
            <span className="size-1.5 rounded-full bg-primary-foreground" />
          </span>
          <div className="grid leading-tight">
            <span className="text-sm font-medium">{site.name}</span>
            <span className="text-xs text-muted-foreground">{site.tagline}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <p className="tabular-nums">
            {total} 个信息源 · {categories} 个主题 · 更新于 {updated}
          </p>
          <span aria-hidden className="text-muted-foreground/40">
            ·
          </span>
          <a
            href={site.repo}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            {site.license}
          </a>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={backToTop}
            className="h-7 gap-1 rounded-full px-2.5 text-xs text-muted-foreground"
          >
            回到顶部
            <ArrowUpIcon aria-hidden className="size-3" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
