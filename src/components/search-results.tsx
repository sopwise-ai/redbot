"use client";

import { LinkPill } from "@/components/pill-wall";
import type { LinkItem } from "@/lib/schema";

/**
 * 搜索结果：按钮保持原样，下面补一行「主题 · 推荐理由」。
 * 手机上按钮没有 hover，没有这行就只能靠名字猜。
 */
export function SearchResults({
  items,
  hueByLabel,
}: {
  items: LinkItem[];
  hueByLabel: Map<string, number>;
}) {
  return (
    <ul data-search-results className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <LinkPill item={item} hue={hueByLabel.get(item.tags[0]) ?? 0} />
          <p className="mt-1 line-clamp-2 px-1 text-2xs leading-4 text-muted-foreground">
            <span className="text-foreground/70">{item.tags[0]}</span>
            <span aria-hidden> · </span>
            {item.desc}
          </p>
        </li>
      ))}
    </ul>
  );
}
