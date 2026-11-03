import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { catalog, getStats, randomPool, topics } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "搜索",
  description: `在 RedBot 收录的 ${catalog.links.length} 个中文互联网优质信息源里搜索，不区分主题。`,
  alternates: { canonical: "/search/" },
  openGraph: {
    title: `搜索 · ${site.name}`,
    description: `在 ${catalog.links.length} 个信息源里搜索。`,
    url: `${site.url}/search/`,
  },
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  const stats = getStats();

  return (
    <AppShell
      topics={topics}
      randomPool={randomPool}
      total={stats.total}
      updated={stats.updated}
      view="search"
    />
  );
}
