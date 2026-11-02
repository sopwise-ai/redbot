import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { categories, getGroups, getStats } from "@/lib/catalog";
import { site } from "@/lib/site";

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
    title: category.label,
    description: `${category.label} · ${category.blurb}。${site.description}`,
    alternates: { canonical: `/topics/${category.slug}/` },
    openGraph: {
      title: `${category.label} · ${site.name}`,
      description: category.blurb,
      url: `${site.url}/topics/${category.slug}/`,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!categories.some((category) => category.slug === slug)) notFound();

  const groups = getGroups();
  const stats = getStats();

  return (
    <AppShell groups={groups} total={stats.total} updated={stats.updated} initialActive={slug} />
  );
}
