import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { getStats, randomPool, topics } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "足迹",
  description: "你点过的信息源，按最近使用排序。只存在本地浏览器，不上传。",
  alternates: { canonical: "/history/" },
  openGraph: {
    title: `足迹 · ${site.name}`,
    description: "你点过的信息源，按最近使用排序。",
    url: `${site.url}/history/`,
  },
  robots: { index: false, follow: true },
};

export default function HistoryPage() {
  const stats = getStats();

  return (
    <AppShell
      topics={topics}
      randomPool={randomPool}
      total={stats.total}
      updated={stats.updated}
      view="history"
    />
  );
}
