import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { getStats, randomPool, topics } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "全部主题",
  description:
    "RedBot 收录的全部主题：新闻、科技、AI、财经、开发、产品设计……按主题浏览中文互联网优质信息源。",
  alternates: { canonical: "/topics/" },
  openGraph: {
    title: `全部主题 · ${site.name}`,
    description: "按主题浏览中文互联网优质信息源。",
    url: `${site.url}/topics/`,
  },
};

export default function TopicsPage() {
  const stats = getStats();

  return (
    <AppShell
      topics={topics}
      randomPool={randomPool}
      total={stats.total}
      updated={stats.updated}
      view="topics"
    />
  );
}
