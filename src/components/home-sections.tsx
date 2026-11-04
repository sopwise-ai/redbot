"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { PillWall } from "@/components/pill-wall";
import { hueFor } from "@/lib/groups";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex flex-col gap-12">
      {sections.map(({ topic, items }, index) => (
        <section
          key={topic.slug}
          aria-labelledby={`topic-${topic.slug}`}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              style={{ ["--tile-hue" as string]: hueFor(index) }}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.965_0.022_var(--tile-hue))] text-base ring-1 ring-border/60 ring-inset dark:bg-[oklch(0.27_0.02_var(--tile-hue))] dark:ring-white/[0.05]"
            >
              {topic.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2
                  id={`topic-${topic.slug}`}
                  className="font-serif text-xl font-normal tracking-[0.01em]"
                >
                  {topic.name}
                </h2>
                <Badge variant="secondary" className="h-5 px-1.5 text-xs tabular-nums">
                  {topic.count}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">{topic.desc}</p>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            >
              <Link href={`/topics/${topic.slug}/`}>
                查看全部
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          <PillWall
            groups={[{ slug: topic.slug, name: topic.name, items }]}
            hueByLabel={hueByLabel}
          />
        </section>
      ))}
    </div>
  );
}
