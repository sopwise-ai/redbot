import { describe, expect, it } from "vitest";

import { bucketByGroup, buildHueMap, hueFor } from "@/lib/groups";
import type { CategoryGroup } from "@/lib/schema";

function group(partial: Partial<CategoryGroup>): CategoryGroup {
  return {
    slug: "x",
    label: "X",
    group: "资讯",
    emoji: "🗂️",
    blurb: "x",
    items: [],
    ...partial,
  };
}

const groups = [
  group({ slug: "news", label: "新闻", group: "资讯", items: [{ id: "a" } as never] }),
  group({ slug: "tech", label: "技术", group: "资讯" }),
  group({ slug: "fun", label: "好玩", group: "生活" }),
];

describe("bucketByGroup", () => {
  it("按 group 字段聚合", () => {
    const buckets = bucketByGroup(groups);
    expect([...buckets.keys()]).toEqual(["资讯", "生活"]);
    expect(buckets.get("资讯")?.map((g) => g.slug)).toEqual(["news", "tech"]);
    expect(buckets.get("生活")?.map((g) => g.slug)).toEqual(["fun"]);
  });

  it("分组顺序 = 首次出现顺序（保持 categories.json 原序）", () => {
    const reordered = [
      group({ slug: "fun", label: "好玩", group: "生活" }),
      group({ slug: "news", label: "新闻", group: "资讯" }),
    ];
    expect([...bucketByGroup(reordered).keys()]).toEqual(["生活", "资讯"]);
  });

  it("空列表返回空 Map", () => {
    expect(bucketByGroup([]).size).toBe(0);
  });
});

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
    const many = Array.from({ length: 10 }, (_, i) => group({ label: `类${i}` }));
    const map = buildHueMap(many);
    expect(map.get("类8")).toBe(hueFor(8));
    expect(map.get("类9")).toBe(hueFor(9));
  });
});
