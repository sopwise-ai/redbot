import type { CategoryGroup } from "@/lib/schema";

/** 8 个低饱和色相，按分类顺序分配；超过 8 个分类时循环。 */
export const HUES = [25, 55, 95, 150, 195, 240, 290, 330] as const;

/** 色相由分类顺序决定：调整 categories.json 顺序会改变全站配色，这是刻意的（见 AGENTS.md）。 */
export function hueFor(index: number) {
  return HUES[index % HUES.length];
}

/**
 * 把扁平的分类列表按 `group` 字段聚合成有序分组。
 * 展示层专用（侧栏、主题索引）：顺序 = 首次出现顺序，保持 categories.json 的原始排序。
 */
export function bucketByGroup(groups: CategoryGroup[]): Map<string, CategoryGroup[]> {
  const buckets = new Map<string, CategoryGroup[]>();
  for (const group of groups) {
    const list = buckets.get(group.group);
    if (list) list.push(group);
    else buckets.set(group.group, [group]);
  }
  return buckets;
}

/** 分类主标签 → 色相。色点、文字色都查这张表。 */
export function buildHueMap(groups: CategoryGroup[]): Map<string, number> {
  return new Map(groups.map((group, index) => [group.label, hueFor(index)]));
}
