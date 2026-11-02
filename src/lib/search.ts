import Fuse from "fuse.js";

import type { Category, LinkItem } from "@/lib/schema";
import { normalizeKeyword as normalize } from "@/lib/keyword";

const KEYS = [
  { name: "name", weight: 0.55 },
  { name: "aliases", weight: 0.3 },
  { name: "desc", weight: 0.1 },
  { name: "tags", weight: 0.05 },
];

export interface SearchIndex {
  search(query: string): LinkItem[];
  /** 0 结果时给「你是不是想找」用，阈值比正式搜索宽 */
  nearMisses(query: string, limit?: number): LinkItem[];
}

/**
 * 搜索索引在客户端构建（百条量级下开销可忽略）。
 *
 * 两段式：先看「名称 / 别名」的精确与前缀命中，再退回 Fuse 模糊匹配。
 * 目的是让 wb / bilibili / blbl 这类写法稳定命中，同时避免 blbl 被模糊匹配到 Dribbble。
 */
export function createSearchIndex(items: LinkItem[]): SearchIndex {
  const fuse = new Fuse(items, {
    keys: KEYS,
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 1,
    shouldSort: true,
  });
  const loose = new Fuse(items, {
    keys: KEYS,
    threshold: 0.6,
    ignoreLocation: true,
    minMatchCharLength: 1,
    shouldSort: true,
  });

  const aliasesOf = (item: LinkItem) => item.aliases ?? [];

  return {
    search(rawQuery) {
      const query = rawQuery.trim();
      if (!query) return [];
      const q = normalize(query);

      // 1) 别名精确命中：wb → 微博热搜；blbl → 哔哩哔哩
      const exact = items.filter((item) => aliasesOf(item).some((alias) => normalize(alias) === q));
      if (exact.length > 0) return exact;

      // 2) 名称 / 别名前缀命中（3 个字符起，避免 "ai" 这类短词把结果收窄）
      if (q.length >= 3) {
        const prefixed = items.filter(
          (item) =>
            normalize(item.name).startsWith(q) ||
            aliasesOf(item).some((alias) => normalize(alias).startsWith(q)),
        );
        if (prefixed.length > 0) return prefixed;
      }

      // 3) 模糊匹配
      return fuse.search(query).map((result) => result.item);
    },

    nearMisses(rawQuery, limit = 3) {
      const query = rawQuery.trim();
      if (!query) return [];
      return loose.search(query, { limit }).map((result) => result.item);
    },
  };
}

/** 主题索引：0 结果时给「去最接近的主题」用。 */
export function createTopicIndex(categories: Category[]) {
  return new Fuse(categories, {
    keys: [
      { name: "name", weight: 0.7 },
      { name: "desc", weight: 0.3 },
    ],
    threshold: 0.5,
    ignoreLocation: true,
    minMatchCharLength: 1,
    shouldSort: true,
  });
}
