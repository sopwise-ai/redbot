import { AppShell } from "@/components/app-shell";
import { getGroups, getStats } from "@/lib/catalog";

export default function HomePage() {
  const groups = getGroups();
  const stats = getStats();

  return <AppShell groups={groups} total={stats.total} updated={stats.updated} />;
}
