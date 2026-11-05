"use client";

import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import type { ShellView } from "@/lib/route-state";
import type { TopicSummary } from "@/lib/schema";
import { cn } from "@/lib/utils";

/**
 * 桌面主导航：页面入口 + 分类面板。
 *
 * 用 shadcn 的 NavigationMenu：hover / 键盘 / Esc / 焦点管理都由组件负责，
 * 分类面板挂在 `NavigationMenuContent` 里（`viewport={false}`，面板贴着触发器）。
 */
export function MainNav({
  topics,
  view,
  activeSlug,
}: {
  topics: TopicSummary[];
  view: ShellView;
  activeSlug: string;
}) {
  const pages = [
    { href: "/", label: "首页", active: view === "wall" && !activeSlug },
    { href: "/history/", label: "足迹", active: view === "history" },
    { href: "/topics/", label: "全部主题", active: view === "topics" },
  ];

  return (
    <NavigationMenu viewport={false} className="hidden md:flex">
      <NavigationMenuList className="gap-1">
        {pages.map((page) => (
          <NavigationMenuItem key={page.href}>
            <NavigationMenuLink
              asChild
              className={cn(
                navigationMenuTriggerStyle(),
                "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                page.active && "text-foreground",
              )}
            >
              <Link href={page.href} aria-current={page.active ? "page" : undefined}>
                {page.label}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}

        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:bg-accent data-[state=open]:bg-accent">
            分类
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[520px] grid-cols-3 gap-0.5 p-2">
              {topics.map((topic) => {
                const active = topic.slug === activeSlug;
                return (
                  <li key={topic.slug}>
                    <NavigationMenuLink
                      asChild
                      className={cn(
                        "flex-row items-center justify-between gap-3 px-3 py-2",
                        active && "bg-accent text-foreground",
                      )}
                    >
                      <Link
                        href={`/topics/${topic.slug}/`}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span aria-hidden>{topic.emoji}</span>
                          <span className="truncate">{topic.name}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {topic.count}
                        </span>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                );
              })}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
