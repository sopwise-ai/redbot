"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CategoryGroup } from "@/lib/schema";
import { cn } from "@/lib/utils";

const ALL = "all";

const chipClass =
  "h-8 shrink-0 rounded-full border-transparent px-3.5 text-xs text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

/** 移动端的主题筛选条：从抽屉里拉出来钉在页头下面 */
export function CategoryChips({
  groups,
  total,
  active,
  onSelect,
  className,
}: {
  groups: CategoryGroup[];
  total: number;
  active: string;
  onSelect: (slug: string) => void;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={active}
      onValueChange={(value) => onSelect(value || ALL)}
      aria-label="按主题过滤"
      className={cn("gap-1", className)}
    >
      <ToggleGroupItem value={ALL} className={chipClass}>
        全部
        <span className="text-2xs tabular-nums opacity-50">{total}</span>
      </ToggleGroupItem>
      {groups.map((group) => (
        <ToggleGroupItem key={group.slug} value={group.slug} className={chipClass}>
          {group.label}
          <span className="text-2xs tabular-nums opacity-50">{group.items.length}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
