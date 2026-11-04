"use client";

import { Badge } from "@/components/ui/badge";
import { LinkCard } from "@/components/link-card";
import type { PillGroup } from "@/lib/group-filter";
import { cn } from "@/lib/utils";

/** 每一组包一层带 `data-group-slug` 的容器，方便首屏脚本按 ?group= 隐藏与样式钩子。 */
export function PillWall({
  groups,
  hueByLabel,
  showHeading = false,
  showDescription = false,
}: {
  groups: PillGroup[];
  hueByLabel: Map<string, number>;
  /** 主题页有分组时，每组前显示小标题 */
  showHeading?: boolean;
  /** 是否在名称下补一行推荐理由（主题页与搜索结果用） */
  showDescription?: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section
          key={group.slug}
          data-cat={group.slug}
          data-group-slug={group.groupSlug}
          className={cn("flex flex-col gap-3", group.hidden && "hidden")}
        >
          {showHeading ? (
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-medium">{group.name}</h2>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs tabular-nums">
                {group.items.length}
              </Badge>
            </div>
          ) : null}
          <ul aria-label={group.name} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <li key={item.id} className="min-w-0">
                <LinkCard
                  item={item}
                  hue={hueByLabel.get(item.tags[0]) ?? 0}
                  showDescription={showDescription}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
