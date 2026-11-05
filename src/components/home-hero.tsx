"use client";

import Link from "next/link";
import { ArrowRightIcon, ShuffleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { recordVisit } from "@/lib/history";
import { pickRandom } from "@/lib/random";
import type { RandomPick } from "@/lib/schema";
import { site } from "@/lib/site";

/**
 * 首页首屏：编辑部刊头。
 *
 * 居中排印：一行眉标（来源与日期）→ 72px 标题 → 副行 → 两个动作 → 信任行，
 * 靠字号对比与一条 64px 的细线收尾，进入下方主题区。
 * 品牌三层（tagline / subtitle / trust）只在这里出现。
 */
export function HomeHero({
  total,
  updated,
  randomPool,
}: {
  total: number;
  updated: string;
  randomPool: RandomPick[];
}) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex flex-col items-center pt-10 text-center sm:pt-24"
    >
      {/* 低亮红晕：只给标题一层环境光，不参与布局；深色下略强，浅色几乎不可见 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[520px] bg-[radial-gradient(50%_55%_at_50%_0%,oklch(0.62_0.2_27/0.05),transparent_75%)] dark:bg-[radial-gradient(50%_55%_at_50%_0%,oklch(0.62_0.2_27/0.12),transparent_75%)]"
      />

      <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground">
        人工挑选 · {total} 个信息源
        <span className="hidden sm:inline"> · 更新于 {updated}</span>
      </p>

      <h1
        id="hero-title"
        className="mt-5 text-4xl leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:mt-6 sm:text-6xl lg:text-7xl"
      >
        {site.tagline}
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground sm:text-xl">
        {site.subtitle}
      </p>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-pretty text-muted-foreground">
        点一下直达榜单、快讯与列表页，不用在站内再找。
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
        <Button
          type="button"
          size="lg"
          onClick={() => {
            const pick = pickRandom(randomPool);
            if (!pick) return;
            recordVisit(pick.id, pick.topicSlug);
            window.open(pick.url, "_blank", "noopener,noreferrer");
          }}
        >
          <ShuffleIcon data-icon="inline-start" />
          随机一个
        </Button>
        <Button asChild variant="ghost" size="lg" className="group">
          <Link href="/topics/">
            按主题浏览
            <ArrowRightIcon
              data-icon="inline-end"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </Link>
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">{site.trust}</p>

      <div aria-hidden className="mt-10 h-px w-16 bg-border sm:mt-16" />
    </section>
  );
}
