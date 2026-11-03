import { describe, expect, it } from "vitest";

import { createSearchIndex, createTopicIndex } from "@/lib/search";
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
  item({
    id: "weibo",
    name: "微博热搜",
    desc: "十分钟前的全网议题",
    tags: ["新闻", "热榜"],
    aliases: ["weibo", "wb"],
  }),
  item({
    id: "bilibili",
    name: "哔哩哔哩",
    desc: "年轻人的视频社区",
    tags: ["娱乐", "视频"],
    aliases: ["bilibili", "blbl", "b站"],
  }),
  item({
    id: "dribbble",
    name: "Dribbble",
    desc: "设计作品灵感",
    tags: ["产品设计", "灵感"],
    aliases: ["dribbble"],
  }),
  item({
    id: "arxiv",
    name: "arXiv cs.AI",
    desc: "每天的最新预印本",
    tags: ["AI", "论文"],
  }),
  item({
    id: "hn",
    name: "Hacker News",
    desc: "全球技术圈的头条",
    tags: ["开发", "社区"],
    aliases: ["hn"],
  }),
  item({
    id: "zhihu",
    name: "知乎热榜",
    url: "https://www.zhihu.com/hot",
    desc: "正在讨论的问题",
    tags: ["新闻", "问答"],
    aliases: ["zhihu", "zh"],
  }),
  item({
    id: "github",
    name: "GitHub Trending",
    desc: "今天涨星最快的仓库",
    tags: ["开发", "开源"],
    aliases: ["github", "gh"],
  }),
];

const ids = (query: string) =>
  createSearchIndex(items)
    .search(query)
    .map((result) => result.id);

describe("createSearchIndex — 名称与正文", () => {
  it("按名称精确命中", () => {
    expect(ids("微博热搜")).toContain("weibo");
  });

  it("名称权重高于描述：搜「热搜」命中名称里的「微博热搜」", () => {
    expect(ids("热搜")).toContain("weibo");
  });

  it("能按描述文本命中", () => {
    expect(ids("预印本")).toContain("arxiv");
  });

  it("能按副标签命中", () => {
    expect(ids("论文")).toContain("arxiv");
    expect(ids("论文")).not.toContain("weibo");
  });

  it("按域名命中：zhihu.com → 知乎热榜", () => {
    expect(ids("zhihu.com")).toEqual(["zhihu"]);
  });

  it("直接粘 URL 也能按域名命中", () => {
    expect(ids("https://www.zhihu.com/hot")).toEqual(["zhihu"]);
  });

  it("无匹配返回空数组", () => {
    expect(ids("zzz不存在的词")).toEqual([]);
  });

  it("返回结果保持原对象引用（React key 与 memo 依赖不受影响）", () => {
    expect(createSearchIndex(items).search("微博")[0]).toBe(items[0]);
  });
});

describe("createSearchIndex — 别名召回", () => {
  it("英文名精确命中：bilibili → 哔哩哔哩", () => {
    expect(ids("bilibili")).toEqual(["bilibili"]);
  });

  it("拼音首字母精确命中：wb → 微博热搜", () => {
    expect(ids("wb")).toEqual(["weibo"]);
  });

  it("blbl 只命中哔哩哔哩，不会错配到 Dribbble", () => {
    expect(ids("blbl")).toEqual(["bilibili"]);
  });

  it("别名前缀命中：bili → 哔哩哔哩", () => {
    expect(ids("bili")).toEqual(["bilibili"]);
  });

  it("名称前缀命中：github → GitHub Trending", () => {
    expect(ids("github")).toEqual(["github"]);
  });

  it("两个字符的短词不会被前缀规则收窄（ai 仍走模糊匹配）", () => {
    const index = createSearchIndex([
      item({ id: "ai", name: "AIBase", desc: "AI 工具库", aliases: [] }),
      item({ id: "air", name: "爱范儿", desc: "AI 与产品", aliases: [] }),
      item({ id: "other", name: "少数派", desc: "效率工具", aliases: [] }),
    ]);
    expect(index.search("ai").map((result) => result.id)).toContain("ai");
    expect(index.search("ai").map((result) => result.id)).toContain("air");
  });
});

describe("createSearchIndex — 近义词与主题建议", () => {
  it("nearMisses 能为拼写错误给出候选", () => {
    const near = createSearchIndex(items).nearMisses("bilibli");
    expect(near.map((result) => result.id)).toContain("bilibili");
  });

  it("主题索引能按名称/说明推荐主题", () => {
    const topics = createTopicIndex([
      { slug: "fun", name: "娱乐", emoji: "🎬", desc: "打发时间的正确方式" },
      { slug: "ai", name: "AI", emoji: "🤖", desc: "模型、论文与新工具" },
    ]);
    expect(topics.search("模型").map((result) => result.item.slug)).toEqual(["ai"]);
  });
});
