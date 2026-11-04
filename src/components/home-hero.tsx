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
 * 不做卡片、不做渐变、不做主题目录（左侧栏已经是导航）：白画布上只排字，
 * 靠字号对比（60px 标题 / 12px 眉标）建立秩序。
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
    <section aria-labelledby="hero-title" className="relative isolate pt-14 sm:pt-20">
      {/* Linear 式的低亮红晕：只在标题后方，不参与布局；深色下更强一点 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 h-[460px] bg-[radial-gradient(55%_60%_at_28%_10%,oklch(0.62_0.2_27/0.06),transparent_72%)] dark:bg-[radial-gradient(55%_60%_at_28%_10%,oklch(0.62_0.2_27/0.16),transparent_72%)]"
      />

      {/* 刊头行：左边是栏目说明，右边是刷新日期 —— 两端对齐，首屏才有基准线 */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground">
          人工挑选 · {total} 个信息源
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">更新于 {updated}</p>
      </div>

      <h1
        id="hero-title"
        className="mt-5 text-4xl leading-[1.04] font-semibold tracking-[-0.02em] text-balance sm:text-6xl lg:text-7xl"
      >
        {site.tagline}
      </h1>

      <p className="mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">{site.subtitle}</p>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        点一下直达榜单、快讯与列表页，不用在站内再找。
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3">
        <Button
          type="button"
          size="lg"
          className="h-10 rounded-lg px-5"
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
        <Button
          asChild
          variant="ghost"
          size="lg"
          className="group h-10 rounded-lg px-4 text-muted-foreground hover:text-foreground"
        >
          <Link href="/topics/">
            按主题浏览
            <ArrowRightIcon
              data-icon="inline-end"
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </Link>
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">{site.trust}</p>
    </section>
  );
}
