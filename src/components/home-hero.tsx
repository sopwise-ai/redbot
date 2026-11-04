"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckIcon, ShuffleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { recordVisit } from "@/lib/history";
import { pickRandom } from "@/lib/random";
import type { RandomPick } from "@/lib/schema";
import { site } from "@/lib/site";

const trustItems = site.trust.split(" · ");

/**
 * 首页首屏：品牌三层 + 两个动作 + 全站规模。
 * 这里是全站唯一展示 tagline / subtitle / trust 的地方。
 */
export function HomeHero({
  total,
  topicCount,
  updated,
  randomPool,
}: {
  total: number;
  topicCount: number;
  updated: string;
  randomPool: RandomPick[];
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-md">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,oklch(0.545_0.19_27/0.12),transparent_62%)] dark:bg-[radial-gradient(90%_120%_at_100%_0%,oklch(0.665_0.19_27/0.16),transparent_62%)]"
      />
      <div className="relative flex flex-col gap-8 p-6 sm:gap-10 sm:p-10 lg:flex-row lg:items-center lg:gap-14 lg:p-12">
        <div className="min-w-0 flex-1">
          <Badge
            variant="outline"
            className="rounded-full border-border/80 bg-background/70 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur"
          >
            人工挑选 · 持续更新
          </Badge>

          <h1 className="mt-4 font-serif text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            {site.tagline}
          </h1>
          <p className="mt-2 text-base text-muted-foreground sm:text-lg">{site.subtitle}</p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button asChild size="lg" className="rounded-full has-[>svg]:pr-3">
              <Link href="/topics/">
                按主题浏览
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="rounded-full bg-background/60 backdrop-blur"
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
          </div>

          <ul className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
            {trustItems.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckIcon aria-hidden className="size-3.5 text-muted-foreground" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Separator className="lg:hidden" />

        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:min-w-[200px] lg:grid-cols-1 lg:gap-5 lg:border-l lg:border-border/70 lg:pl-12">
          <Stat label="信息源" value={total} />
          <Stat label="主题" value={topicCount} />
          <div className="col-span-2 sm:col-span-1">
            <Stat label="更新于" value={updated} small />
          </div>
        </dl>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  small = false,
}: {
  label: string;
  value: number | string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="order-2 text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          small
            ? "order-1 text-base font-medium tracking-tight whitespace-nowrap tabular-nums"
            : "order-1 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl"
        }
      >
        {value}
      </dd>
    </div>
  );
}
