/** 8 个低饱和色相，按分类顺序分配；超过 8 个分类时循环。 */
export const HUES = [25, 55, 95, 150, 195, 240, 290, 330] as const;

/** 色相由主题顺序决定：调整 data/topics.json 顺序会改变全站配色，这是刻意的（见 AGENTS.md）。 */
export function hueFor(index: number) {
  return HUES[index % HUES.length];
}

/** 分类主标签 → 色相。色点、文字色都查这张表。 */
export function buildHueMap(categories: Array<{ name: string }>): Map<string, number> {
  return new Map(categories.map((category, index) => [category.name, hueFor(index)]));
}
