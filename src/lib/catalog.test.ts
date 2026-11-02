import { describe, expect, it } from "vitest";

import { catalog, categories, getGroups, getStats } from "@/lib/catalog";
import { LIMITS } from "@/lib/schema";

/**
 * catalog.ts 是数据的运行时入口：加载即校验、分组、统计。
 * 真实数据通过 schema 解析成功本身就是契约测试；
 * 配额与「分类必有条目」在这里断言，防止 data/ 漂移。
 */

describe("模块加载即校验（真实数据）", () => {
  it("catalog 与 categories 通过 schema 解析", () => {
    expect(catalog.links.length).toBeGreaterThan(0);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("数据 updated 字段是合法日期（sitemap 直接用它做 lastModified）", () => {
    expect(catalog.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getGroups", () => {
  const groups = getGroups();

  it("每个分类恰好一组，顺序与 data/topics.json 一致", () => {
    expect(groups.map((g) => g.slug)).toEqual(categories.map((c) => c.slug));
  });

  it("每条链接归入且只归入其主分类", () => {
    const total = groups.reduce((sum, g) => sum + g.items.length, 0);
    expect(total).toBe(catalog.links.length);
    for (const group of groups) {
      for (const item of group.items) {
        expect(item.tags[0]).toBe(categories.find((c) => c.slug === group.slug)!.name);
      }
    }
  });

  it("主题内顺序保持主题文件的原始顺序（顺序即优先级）", () => {
    const news = groups.find((g) => g.slug === "news")!;
    const original = catalog.links.filter((l) => l.tags[0] === "新闻");
    expect(news.items).toEqual(original);
  });

  it("每个主题至少一条（schema 已强制，这里守住展示层假设）", () => {
    expect(groups.every((g) => g.items.length > 0)).toBe(true);
  });
});

describe("配额不变量", () => {
  it("单分类不超过 LIMITS.perCategory", () => {
    for (const group of getGroups()) {
      expect(group.items.length).toBeLessThanOrEqual(LIMITS.perCategory);
    }
  });

  it("分类总数不超过 LIMITS.categories", () => {
    expect(categories.length).toBeLessThanOrEqual(LIMITS.categories);
  });
});

describe("getStats", () => {
  it("统计与真实数据一致", () => {
    const stats = getStats();
    expect(stats.total).toBe(catalog.links.length);
    expect(stats.categories).toBe(categories.length);
    expect(stats.updated).toBe(catalog.updated);
  });
});
