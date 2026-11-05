"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { PillWall } from "@/components/pill-wall";
import { hueFor } from "@/lib/groups";
import { Button } from "@/components/ui/button";
import type { HomeSection } from "@/lib/schema";

/** 首页：每个主题只铺前几条，剩下的进主题页。 */
export function HomeSections({
  sections,
  hueByLabel,
}: {
  sections: HomeSection[];
  hueByLabel: Map<string, number>;
}) {
  return (
    <div className="flex flex-col gap-10 sm:gap-16">
      {sections.map(({ topic, items }, index) => (
        <section
          key={topic.slug}
          aria-labelledby={`topic-${topic.slug}`}
          className="flex flex-col gap-4 border-t border-border/60 pt-8 first:border-t-0 first:pt-0"
        >
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              style={{ ["--tile-hue" as string]: hueFor(index) }}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[oklch(0.965_0.022_var(--tile-hue))] text-base dark:bg-[oklch(0.28_0.02_var(--tile-hue))]"
            >
              {topic.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id={`topic-${topic.slug}`}
                className="flex items-baseline gap-2 text-lg font-semibold"
              >
                {topic.name}
                <span className="text-xs font-normal text-muted-foreground tabular-nums">
                  {topic.count} 个
                </span>
              </h2>
              <p className="truncate text-sm text-muted-foreground">{topic.desc}</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href={`/topics/${topic.slug}/`}>
                全部
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          <PillWall
            groups={[{ slug: topic.slug, name: topic.name, items }]}
            hueByLabel={hueByLabel}
            showDescription
          />
        </section>
      ))}
    </div>
  );
}
