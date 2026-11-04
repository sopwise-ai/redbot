"use client";

import Link from "next/link";
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
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary shadow-sm"
            >
              <span className="size-2 rounded-full bg-primary-foreground" />
            </span>
            <div className="grid gap-0.5 leading-tight">
              <span className="text-sm font-semibold tracking-tight">{site.name}</span>
              <span className="text-xs text-muted-foreground">{site.tagline} · © 2026</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {total} 个信息源 · {categories} 个主题
            </span>
            <span className="tabular-nums">更新于 {updated}</span>
            <Link
              href="/about/"
              className="rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              关于
            </Link>
            <a
              href={site.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              {site.license}
            </a>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={backToTop}
              className="gap-1 rounded-full text-xs text-muted-foreground"
            >
              回到顶部
              <ArrowUpIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
