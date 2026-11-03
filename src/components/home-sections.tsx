"use client";

import Link from "next/link";

import { PillWall } from "@/components/pill-wall";
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
    <div className="flex flex-col gap-10">
      {sections.map(({ topic, items }) => (
        <section key={topic.slug} className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span aria-hidden className="text-base leading-none">
              {topic.emoji}
            </span>
            <h2 className="text-md font-medium">{topic.name}</h2>
            <span className="text-2xs text-muted-foreground tabular-nums">{topic.count}</span>
            <Link
              href={`/topics/${topic.slug}/`}
              className="ml-auto text-2xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              查看全部 →
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">{topic.desc}</p>
          <PillWall
            groups={[{ slug: topic.slug, name: topic.name, items }]}
            hueByLabel={hueByLabel}
          />
        </section>
      ))}
    </div>
  );
}
