import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { getStats, randomPool, topics } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "关于",
  description: `${site.name}：${site.tagline}。收录标准、常见问题、隐私与免责声明。`,
  alternates: { canonical: "/about/" },
  openGraph: {
    title: `关于 · ${site.name}`,
    description: `${site.tagline}。收录标准、常见问题、隐私与免责声明。`,
    url: `${site.url}/about/`,
  },
};

export default function AboutPage() {
  const stats = getStats();

  return (
    <AppShell
      topics={topics}
      randomPool={randomPool}
      total={stats.total}
      updated={stats.updated}
      view="about"
    />
  );
}
