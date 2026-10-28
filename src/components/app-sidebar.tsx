"use client";

import { ArrowUpRight, BookOpenIcon, GitPullRequestIcon, XIcon } from "lucide-react";

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
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import type { CategoryGroup } from "@/lib/schema";
import { site } from "@/lib/site";

export function AppSidebar({
  groups,
  total,
  active,
  onSelect,
}: {
  groups: CategoryGroup[];
  total: number;
  active: string;
  onSelect: (slug: string) => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  // 移动端选完主题就收起抽屉，否则遮罩会挡住刚切出来的内容
  function select(slug: string) {
    onSelect(slug);
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="size-2 rounded-full bg-primary-foreground" />
            </div>
            <div className="grid min-w-0 leading-tight">
              <span className="truncate font-semibold">{site.name}</span>
              <span className="truncate text-xs text-muted-foreground">{site.tagline}</span>
            </div>
          </div>
          {isMobile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="关闭导航"
              onClick={() => setOpenMobile(false)}
              className="shrink-0 text-muted-foreground focus-visible:ring-sidebar-ring"
            >
              <XIcon />
            </Button>
          ) : null}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{groups.length} 个主题</SidebarGroupLabel>
          <SidebarGroupContent>
            <nav aria-label="主题导航">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={active === "all"}
                    aria-current={active === "all" ? "true" : undefined}
                    onClick={() => select("all")}
                    tooltip="全部"
                    className="data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-primary"
                  >
                    <span
                      aria-hidden
                      className="flex size-6 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-[11px] font-medium text-muted-foreground"
                    >
                      全
                    </span>
                    <span className="truncate">全部</span>
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground/60">
                      {total}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {groups.map((group) => (
                  <SidebarMenuItem key={group.slug}>
                    <SidebarMenuButton
                      isActive={active === group.slug}
                      aria-current={active === group.slug ? "true" : undefined}
                      onClick={() => select(group.slug)}
                      tooltip={group.label}
                      className="data-[active=true]:bg-primary/10 data-[active=true]:font-medium data-[active=true]:text-primary"
                    >
                      <span
                        aria-hidden
                        className="flex size-6 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-[11px] font-medium text-muted-foreground"
                      >
                        {group.label.slice(0, 1)}
                      </span>
                      <span className="truncate">{group.label}</span>
                      <span className="ml-auto text-xs tabular-nums text-muted-foreground/60">
                        {group.items.length}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <a href={`${site.repo}#收录标准`} target="_blank" rel="noreferrer">
                <BookOpenIcon />
                <span>收录标准</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <a href={`${site.repo}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">
                <GitPullRequestIcon />
                <span>提交收录</span>
                <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
