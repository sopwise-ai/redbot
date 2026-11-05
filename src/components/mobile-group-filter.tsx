"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ALL_GROUPS, UNGROUPED_GROUP, itemsInGroup } from "@/lib/group-filter";
import type { GroupMeta, LinkItem } from "@/lib/schema";
import { cn } from "@/lib/utils";

/**
 * 移动端分组筛选：横滑 chip 在小屏上只露出半个，改成底部抽屉，
 * 一屏能看全所有分组，也有足够的触控面积。
 */
export function MobileGroupFilter({
  groups,
  items,
  value,
  onChange,
}: {
  groups: GroupMeta[];
  items: LinkItem[];
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ungrouped = itemsInGroup(items, UNGROUPED_GROUP).length;

  const options = [
    { slug: ALL_GROUPS, name: "全部", count: items.length },
    ...groups.map((group) => ({
      slug: group.slug,
      name: group.name,
      count: itemsInGroup(items, group.slug).length,
    })),
    ...(ungrouped > 0 ? [{ slug: UNGROUPED_GROUP, name: "未分组", count: ungrouped }] : []),
  ];

  const current = options.find((option) => option.slug === (value || ALL_GROUPS)) ?? options[0];

  function select(slug: string) {
    onChange(slug === ALL_GROUPS ? "" : slug);
    setOpen(false);
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="justify-between gap-2">
          分组：{current.name}
          <ChevronDownIcon aria-hidden className="text-muted-foreground" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>按分组筛选</DrawerTitle>
          <DrawerDescription>共 {items.length} 个信息源</DrawerDescription>
        </DrawerHeader>
        <ul className="flex flex-col gap-1 px-3 pb-6">
          {options.map((option) => {
            const active = option.slug === (value || ALL_GROUPS);
            return (
              <li key={option.slug}>
                <button
                  type="button"
                  onClick={() => select(option.slug)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-accent",
                    active && "bg-accent font-medium",
                  )}
                >
                  <span>{option.name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                    {option.count}
                    {active ? <CheckIcon aria-hidden className="size-3.5" /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
