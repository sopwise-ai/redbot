"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpenIcon,
  GitPullRequestIcon,
  HomeIcon,
  PawPrintIcon,
  ShuffleIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { recordVisit } from "@/lib/history";
import { pickRandom } from "@/lib/random";
import { useHistory } from "@/lib/use-history";
import type { RandomPick, TopicSummary } from "@/lib/schema";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** 当前项左侧的红色竖条：全站只有「当前位置」和 hover 用品牌红。 */
const activeBar =
  "relative before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r-full before:bg-primary before:opacity-0 data-[active=true]:before:opacity-100";

const itemClass = cn(
  "h-9 rounded-lg px-2 text-sm text-muted-foreground transition-colors",
  "data-[active=true]:bg-primary/8 data-[active=true]:font-medium data-[active=true]:text-foreground",
  "dark:data-[active=true]:bg-primary/15",
  activeBar,
);

export function AppSidebar({
  topics,
  total,
  active,
  onSelect,
  randomPool,
  historyActive = false,
  onOpenHistory,
}: {
  topics: TopicSummary[];
  total: number;
  active: string;
  onSelect: (slug: string) => void;
  randomPool: RandomPick[];
  historyActive?: boolean;
  onOpenHistory?: () => void;
}) {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { entries } = useHistory();

  // 最近访问的主题：足迹里现在带了 topic slug，不再需要 id→topic 的全量映射
  const recentTopics: TopicSummary[] = [];
  const seenRecent = new Set<string>();
  for (const entry of entries) {
    if (!entry.topic || seenRecent.has(entry.topic)) continue;
    const topic = topics.find((item) => item.slug === entry.topic);
    if (!topic) continue;
    seenRecent.add(entry.topic);
    recentTopics.push(topic);
    if (recentTopics.length === 3) break;
  }

  function closeOnMobile() {
    if (isMobile) setOpenMobile(false);
  }

  // 移动端选完主题就收起抽屉，否则遮罩会挡住刚切出来的内容。
  function select(slug: string) {
    onSelect(slug);
    closeOnMobile();
  }

  // 主题顺序即 data/topics.json 的顺序
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={closeOnMobile}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-sm">
              <span className="size-2 rounded-full bg-primary-foreground" />
            </span>
            <span className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold tracking-tight">{site.name}</span>
              <span className="truncate text-xs text-muted-foreground">{site.tagline}</span>
            </span>
          </Link>
          <SidebarTrigger className="relative hidden shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] md:inline-flex" />
          {isMobile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="关闭导航"
              onClick={() => setOpenMobile(false)}
              className="relative shrink-0 text-muted-foreground after:absolute after:-inset-1.5 after:content-[''] focus-visible:ring-sidebar-ring"
            >
              <XIcon />
            </Button>
          ) : null}
        </div>
      </SidebarHeader>

      <div className="px-2 pt-1 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="随机一个"
              onClick={() => {
                const pick = pickRandom(randomPool);
                if (!pick) return;
                recordVisit(pick.id, pick.topicSlug);
                window.open(pick.url, "_blank", "noopener,noreferrer");
              }}
              className="h-9 gap-2 rounded-lg border border-sidebar-border bg-card px-2 text-sm font-normal text-foreground shadow-xs transition-colors group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent"
            >
              <ShuffleIcon className="text-muted-foreground" />
              <span className="truncate group-data-[collapsible=icon]:hidden">随机一个</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>

      <SidebarContent>
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <nav aria-label="站点导航">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="首页" className={itemClass}>
                    <Link
                      href="/"
                      onClick={closeOnMobile}
                      aria-current={active === "" ? "page" : undefined}
                      data-active={active === ""}
                    >
                      <HomeIcon />
                      <span className="truncate">首页</span>
                      <SidebarMenuBadge className="text-xs tabular-nums">{total}</SidebarMenuBadge>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={historyActive}
                    aria-current={historyActive ? "page" : undefined}
                    onClick={() => {
                      onOpenHistory?.();
                      closeOnMobile();
                    }}
                    tooltip="足迹"
                    className={itemClass}
                  >
                    <PawPrintIcon />
                    <span className="truncate">足迹</span>
                    {entries.length > 0 ? (
                      <SidebarMenuBadge className="text-xs tabular-nums">
                        {entries.length}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="全部主题" className={itemClass}>
                    <Link href="/topics/" onClick={closeOnMobile}>
                      <BookOpenIcon />
                      <span className="truncate">全部主题</span>
                      <SidebarMenuBadge className="text-xs tabular-nums">
                        {topics.length}
                      </SidebarMenuBadge>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>

        {recentTopics.length > 0 ? (
          <SidebarGroup className="py-0">
            <SidebarGroupLabel className="text-xs">最近访问</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentTopics.map((topic) => (
                  <TopicMenuItem
                    key={topic.slug}
                    topic={topic}
                    active={active}
                    onSelect={select}
                    onPrefetch={() => router.prefetch(`/topics/${topic.slug}/`)}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup className="py-0">
          <SidebarGroupLabel className="sticky top-0 z-10 bg-sidebar text-xs">
            主题
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {topics.map((topic) => (
                <TopicMenuItem
                  key={topic.slug}
                  topic={topic}
                  active={active}
                  onSelect={select}
                  onPrefetch={() => router.prefetch(`/topics/${topic.slug}/`)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/70 pt-3 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" className="text-muted-foreground">
              <Link href="/about/" onClick={closeOnMobile}>
                <BookOpenIcon />
                <span>关于与标准</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" className="text-muted-foreground">
              <a
                href={`${site.repo}/blob/main/CONTRIBUTING.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitPullRequestIcon />
                <span>提交收录</span>
                <ArrowUpRight className="ml-auto" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function TopicMenuItem({
  topic,
  active,
  onSelect,
  onPrefetch,
}: {
  topic: TopicSummary;
  active: string;
  onSelect: (slug: string) => void;
  onPrefetch: () => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active === topic.slug}
        aria-current={active === topic.slug ? "page" : undefined}
        onClick={() => onSelect(topic.slug)}
        onPointerEnter={onPrefetch}
        tooltip={topic.name}
        className={itemClass}
      >
        <span aria-hidden className="w-[18px] shrink-0 text-center text-base leading-none">
          {topic.emoji}
        </span>
        <span className="truncate">{topic.name}</span>
        <SidebarMenuBadge className="text-xs tabular-nums">{topic.count}</SidebarMenuBadge>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
