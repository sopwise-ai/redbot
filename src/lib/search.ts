import Fuse from "fuse.js";

import type { LinkItem } from "@/lib/schema";

/**
 * 搜索索引在客户端构建（94 条量级下开销可忽略）。
 * 若条目增长到数千条，把这里换成构建期预生成的索引即可，调用方无需改动。
 */
export function createSearchIndex(items: LinkItem[]) {
  return new Fuse(items, {
    keys: [
      { name: "name", weight: 0.6 },
      { name: "desc", weight: 0.25 },
      { name: "tags", weight: 0.15 },
    ],
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 1,
    shouldSort: true,
  });
}
