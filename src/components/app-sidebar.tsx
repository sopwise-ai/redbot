"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpenIcon, GitPullRequestIcon, ShuffleIcon, XIcon } from "lucide-react";

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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { recordVisit } from "@/lib/history";
import { pickRandom } from "@/lib/random";
import { useHistory } from "@/lib/use-history";
import type { CategoryGroup } from "@/lib/schema";
import { site } from "@/lib/site";

const itemClass =
  "h-9 rounded-lg px-2 text-sm text-muted-foreground transition-colors data-[active=true]:bg-primary/8 data-[active=true]:font-semibold data-[active=true]:text-foreground dark:data-[active=true]:bg-primary/15";

export function AppSidebar({
  groups,
  total,
  active,
  onSelect,
  historyActive = false,
  onOpenHistory,
}: {
  groups: CategoryGroup[];
  total: number;
  active: string;
  onSelect: (slug: string) => void;
  historyActive?: boolean;
  onOpenHistory?: () => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { entries } = useHistory();

  // 最近访问的主题：从足迹里按「最近点过」去重取前 3 个（纯本地，不新增存储）
  const groupByItem = new Map<string, CategoryGroup>();
  for (const group of groups) for (const item of group.items) groupByItem.set(item.id, group);
  const recentGroups: CategoryGroup[] = [];
  const seenRecent = new Set<string>();
  for (const entry of entries) {
    const group = groupByItem.get(entry.id);
    if (!group || seenRecent.has(group.slug)) continue;
    seenRecent.add(group.slug);
    recentGroups.push(group);
    if (recentGroups.length === 3) break;
  }

  // 移动端选完主题就收起抽屉，否则遮罩会挡住刚切出来的内容。
  // 注意：抽屉是 Radix Dialog（Sheet），onOpenChange(false) 会在退出动画后卸载内容并解除
  // body 滚动锁；这里同步关，避免与分类切换的 View Transition 抢时序。
  function select(slug: string) {
    onSelect(slug);
    if (isMobile) setOpenMobile(false);
  }

  // 主题顺序即 data/topics.json 的顺序
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="size-2 rounded-full bg-primary-foreground" />
            </div>
            <div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-md font-semibold">{site.name}</span>
              <span className="truncate text-2xs text-muted-foreground">{site.tagline}</span>
            </div>
          </div>
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

      <div className="px-2 pb-2 group-data-[collapsible=icon]:px-1">
        <Button
          variant="outline"
          onClick={() => {
            const pick = pickRandom(groups.flatMap((group) => group.items));
            if (!pick) return;
            recordVisit(pick.id);
            window.open(pick.url, "_blank", "noopener,noreferrer");
          }}
          className="h-9 w-full justify-start gap-2 rounded-lg px-2.5 text-sm font-normal shadow-xs group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <ShuffleIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate group-data-[collapsible=icon]:hidden">随机一个</span>
        </Button>
      </div>

      <SidebarContent>
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <nav aria-label="主题导航">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={historyActive}
                    aria-current={historyActive ? "true" : undefined}
                    onClick={() => {
                      onOpenHistory?.();
                      if (isMobile) setOpenMobile(false);
                    }}
                    tooltip="足迹"
                    className={itemClass}
                  >
                    <span
                      aria-hidden
                      className="w-[18px] shrink-0 text-center text-sm leading-none"
                    >
                      🐾
                    </span>
                    <span className="truncate">足迹</span>
                    {entries.length > 0 ? (
                      <span className="ml-auto text-2xs text-muted-foreground tabular-nums">
                        {entries.length}
                      </span>
                    ) : null}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={active === "all"}
                    aria-current={active === "all" ? "true" : undefined}
                    onClick={() => select("all")}
                    tooltip="全部"
                    className={itemClass}
                  >
                    <span
                      aria-hidden
                      className="w-[18px] shrink-0 text-center text-base leading-none"
                    >
                      🗂️
                    </span>
                    <span className="truncate">全部</span>
                    <span className="ml-auto text-2xs text-muted-foreground tabular-nums">
                      {total}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="全部主题" className={itemClass}>
                    <Link
                      href="/topics/"
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <span
                        aria-hidden
                        className="w-[18px] shrink-0 text-center text-base leading-none"
                      >
                        🧭
                      </span>
                      <span className="truncate">全部主题</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>

        {recentGroups.length > 0 ? (
          <SidebarGroup className="py-0">
            <SidebarGroupLabel className="h-6 px-2 text-2xs font-medium tracking-[0.08em] text-muted-foreground">
              最近访问
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentGroups.map((group) => (
                  <TopicMenuItem key={group.slug} group={group} active={active} onSelect={select} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <div className="sticky top-0 z-10 flex items-center gap-2 bg-sidebar px-3 pt-3 pb-1 group-data-[collapsible=icon]:hidden">
          <span className="text-2xs font-medium tracking-[0.08em] text-muted-foreground">主题</span>
          <span className="ml-auto text-2xs text-muted-foreground tabular-nums">
            {groups.length}
          </span>
        </div>

        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.map((group) => (
                <TopicMenuItem key={group.slug} group={group} active={active} onSelect={select} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" className="text-sm text-muted-foreground">
              <Link
                href="/about/#criteria"
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <BookOpenIcon />
                <span>收录标准</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" className="text-sm text-muted-foreground">
              <a
                href={`${site.repo}/blob/main/CONTRIBUTING.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitPullRequestIcon />
                <span>提交收录</span>
                <ArrowUpRight className="ml-auto size-3.5" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function TopicMenuItem({
  group,
  active,
  onSelect,
}: {
  group: CategoryGroup;
  active: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active === group.slug}
        aria-current={active === group.slug ? "true" : undefined}
        onClick={() => onSelect(group.slug)}
        tooltip={group.name}
        className={itemClass}
      >
        <span aria-hidden className="w-[18px] shrink-0 text-center text-base leading-none">
          {group.emoji}
        </span>
        <span className="truncate">{group.name}</span>
        <span className="ml-auto text-2xs text-muted-foreground tabular-nums">
          {group.items.length}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
