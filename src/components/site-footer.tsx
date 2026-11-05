"use client";

import Link from "next/link";
import { ArrowUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { site } from "@/lib/site";

/**
 * 页脚：品牌 + 两列入口 + 底部版权行。
 *
 * 之前把所有链接塞进一行，移动端会绕成三行、粗细不一；
 * 现在按「品牌 / 浏览 / 更多」分栏，窄屏自然堆叠。
 */
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

  const columns = [
    {
      title: "浏览",
      links: [
        { href: "/", label: "首页", external: false },
        { href: "/topics/", label: "全部主题", external: false },
        { href: "/history/", label: "我的足迹", external: false },
      ],
    },
    {
      title: "更多",
      links: [
        { href: "/about/", label: "关于", external: false },
        { href: `${site.repo}/blob/main/CONTRIBUTING.md`, label: "提交收录", external: true },
        { href: site.repo, label: "GitHub", external: true },
        { href: `${site.repo}/blob/main/LICENSE`, label: site.license, external: true },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex w-fit items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary"
              >
                <span className="size-2 rounded-full bg-primary-foreground" />
              </span>
              <span className="grid leading-tight">
                <span className="text-sm font-semibold tracking-tight">{site.name}</span>
                <span className="text-xs text-muted-foreground">{site.tagline}</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">
              {site.subtitle}。点一下直达榜单、快讯与列表页，不用在站内再找。
            </p>
            <p className="text-xs text-muted-foreground">{site.trust}</p>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
              <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground">
                {column.title}
              </p>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-6 items-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="inline-flex min-h-6 items-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {site.name} · {total}{" "}
            个信息源 · {categories} 个主题 · 更新于 {updated}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={backToTop}
            className="self-start text-muted-foreground sm:self-auto"
          >
            回到顶部
            <ArrowUpIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
