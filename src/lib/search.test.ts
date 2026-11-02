import { describe, expect, it } from "vitest";

import { createSearchIndex } from "@/lib/search";
import type { LinkItem } from "@/lib/schema";

function item(partial: Partial<LinkItem>): LinkItem {
  return {
    id: "x",
    name: "x",
    url: "https://example.com",
    tags: ["新闻"],
    desc: "x",
    ...partial,
  };
}

const items = [
  item({ id: "weibo", name: "微博热搜", desc: "十分钟前的全网议题", tags: ["新闻", "热榜"] }),
  item({ id: "arxiv", name: "arXiv cs.AI", desc: "每天的最新预印本", tags: ["AI", "论文"] }),
  item({ id: "hn", name: "Hacker News", desc: "全球技术圈的头条", tags: ["开发", "社区"] }),
];

describe("createSearchIndex", () => {
  it("按名称精确命中", () => {
    const index = createSearchIndex(items);
    expect(index.search("微博热搜").map((r) => r.item.id)).toContain("weibo");
  });

  it("名称权重高于描述：搜「热搜」命中名称里的「微博热搜」", () => {
    const index = createSearchIndex(items);
    const ids = index.search("热搜").map((r) => r.item.id);
    expect(ids).toContain("weibo");
  });

  it("能按描述文本命中", () => {
    const index = createSearchIndex(items);
    const ids = index.search("预印本").map((r) => r.item.id);
    expect(ids).toContain("arxiv");
  });

  it("能按副标签命中", () => {
    const index = createSearchIndex(items);
    const ids = index.search("论文").map((r) => r.item.id);
    expect(ids).toContain("arxiv");
    expect(ids).not.toContain("weibo");
  });

  it("无匹配返回空数组", () => {
    const index = createSearchIndex(items);
    expect(index.search("zzz不存在的词")).toEqual([]);
  });

  it("返回结果保持原对象引用（React key 与 memo 依赖不受影响）", () => {
    const index = createSearchIndex(items);
    const result = index.search("微博");
    expect(result[0].item).toBe(items[0]);
  });
});
