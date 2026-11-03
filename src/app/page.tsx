import { AppShell } from "@/components/app-shell";
import { getStats, homeSections, randomPool, topics } from "@/lib/catalog";

export default function HomePage() {
  const stats = getStats();

  return (
    <AppShell
      topics={topics}
      homeSections={homeSections}
      randomPool={randomPool}
      total={stats.total}
      updated={stats.updated}
    />
  );
}
