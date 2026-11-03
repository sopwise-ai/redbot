import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { categories, getStats, getTopic, randomPool, topics } from "@/lib/catalog";
import { site } from "@/lib/site";
import { serializeJsonLd, topicJsonLd } from "@/lib/structured-data";

// 只生成 data/topics.json 里登记的主题；其余路径走 404
export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) return {};

  return {
    title: category.name,
    description: `${category.name} · ${category.desc}。${site.description}`,
    alternates: { canonical: `/topics/${category.slug}/` },
    openGraph: {
      title: `${category.name} · ${site.name}`,
      description: category.desc,
      url: `${site.url}/topics/${category.slug}/`,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!categories.some((category) => category.slug === slug)) notFound();

  const stats = getStats();
  const category = categories.find((item) => item.slug === slug)!;
  const group = getTopic(slug)!;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(topicJsonLd(category, group?.items ?? [])),
        }}
      />
      <AppShell
        topics={topics}
        activeTopic={group}
        randomPool={randomPool}
        total={stats.total}
        updated={stats.updated}
      />
    </>
  );
}
