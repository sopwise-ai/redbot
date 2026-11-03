import { describe, expect, it } from "vitest";

import { buildHueMap, hueFor } from "@/lib/groups";
import type { CategoryGroup } from "@/lib/schema";

function group(partial: Partial<CategoryGroup>): CategoryGroup {
  return {
    slug: "x",
    name: "X",
    emoji: "🗂️",
    desc: "x",
    groups: [],
    items: [],
    ...partial,
  };
}

const groups = [
  group({ slug: "news", name: "新闻", items: [{ id: "a" } as never] }),
  group({ slug: "tech", name: "技术" }),
  group({ slug: "fun", name: "好玩" }),
];

describe("hueFor", () => {
  it("索引即 HUES 顺序", () => {
    expect(hueFor(0)).toBe(25);
    expect(hueFor(1)).toBe(55);
  });

  it("超过 8 个分类时循环", () => {
    expect(hueFor(8)).toBe(hueFor(0));
    expect(hueFor(9)).toBe(hueFor(1));
  });
});

describe("buildHueMap", () => {
  it("主标签 → 色相，索引即分类顺序", () => {
    const map = buildHueMap(groups);
    expect(map.get("新闻")).toBe(hueFor(0));
    expect(map.get("技术")).toBe(hueFor(1));
    expect(map.get("好玩")).toBe(hueFor(2));
  });

  it("超过 8 个分类时色相循环（与 hueFor 一致）", () => {
    const many = Array.from({ length: 10 }, (_, i) => group({ name: `类${i}` }));
    const map = buildHueMap(many);
    expect(map.get("类8")).toBe(hueFor(8));
    expect(map.get("类9")).toBe(hueFor(9));
  });
});
