"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { GroupMeta, LinkItem } from "@/lib/schema";

export const ALL_GROUPS = "all";
export const UNGROUPED_GROUP = "ungrouped";

const chipClass =
  "h-8 shrink-0 gap-1.5 rounded-full border border-border/70 bg-card px-3 text-xs font-normal text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-none";

/** 主题页内的分组筛选；没有 groups 的主题不渲染。 */
export function GroupFilter({
  groups,
  items,
  value,
  onChange,
}: {
  groups: GroupMeta[];
  items: LinkItem[];
  /** 空串 = 全部 */
  value: string;
  onChange: (slug: string) => void;
}) {
  if (groups.length === 0) return null;

  const countOf = (slug: string) =>
    items.filter((item) => (slug === UNGROUPED_GROUP ? !item.group : item.group?.slug === slug))
      .length;
  const ungrouped = countOf(UNGROUPED_GROUP);

  return (
    <div className="-mx-1 mb-6 scrollbar-none overflow-x-auto overscroll-x-contain">
      <ToggleGroup
        type="single"
        value={value || ALL_GROUPS}
        onValueChange={(next) => onChange(!next || next === ALL_GROUPS ? "" : next)}
        aria-label="按分组筛选"
        className="w-max gap-1.5 px-1 py-1"
      >
        <ToggleGroupItem value={ALL_GROUPS} className={chipClass}>
          全部
          <span className="tabular-nums opacity-60">{items.length}</span>
        </ToggleGroupItem>
        {groups.map((group) => (
          <ToggleGroupItem key={group.slug} value={group.slug} className={chipClass}>
            {group.name}
            <span className="tabular-nums opacity-60">{countOf(group.slug)}</span>
          </ToggleGroupItem>
        ))}
        {ungrouped > 0 ? (
          <ToggleGroupItem value={UNGROUPED_GROUP} className={chipClass}>
            未分组
            <span className="tabular-nums opacity-60">{ungrouped}</span>
          </ToggleGroupItem>
        ) : null}
      </ToggleGroup>
    </div>
  );
}
