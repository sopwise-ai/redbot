"use client";

import { LinkCard } from "@/components/link-card";
import { Badge } from "@/components/ui/badge";
import type { LinkItem } from "@/lib/schema";

/**
 * 搜索结果：名称 + 推荐理由 + 所属主题，一个结果就是一张可点的卡。
 * 手机上按钮没有 hover，说明文字是唯一能判断「要不要点」的线索。
 */
export function SearchResults({
  items,
  hueByLabel,
  onOpen,
}: {
  items: LinkItem[];
  hueByLabel: Map<string, number>;
  onOpen?: (item: LinkItem) => void;
}) {
  return (
    <ul data-search-results className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <LinkCard
            item={item}
            hue={hueByLabel.get(item.tags[0]) ?? 0}
            showDescription
            descLines={2}
            description={item.group ? `${item.desc} · ${item.group.name}` : item.desc}
            // 主题紧跟在站名后面：单独一行会把卡片顶成三行，一屏少看好几条
            badge={
              item.topic ? (
                <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-xs font-normal">
                  {item.topic.name}
                </Badge>
              ) : null
            }
            onOpen={() => onOpen?.(item)}
          />
        </li>
      ))}
    </ul>
  );
}
