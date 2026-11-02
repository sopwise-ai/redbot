import { describe, expect, it } from "vitest";

import { checkTopicSet, mergeTopics, type TopicEntry } from "@/lib/merge-topics";
import type { TopicFile } from "@/lib/schema";

const file = (over: Partial<TopicFile> = {}): TopicFile => ({
  label: "AI",
  emoji: "🤖",
  blurb: "模型、论文与新工具",
  updated: "2026-10-28",
  links: [
    {
      id: "qbitai",
      name: "量子位",
      url: "https://www.qbitai.com/",
      tags: ["快讯"],
      desc: "AI 进展的日常追踪",
    },
  ],
  ...over,
});

const entries: TopicEntry[] = [
  { slug: "ai", file: file() },
  {
    slug: "news",
    file: file({
      label: "新闻",
      emoji: "📰",
      blurb: "今天发生了什么",
      updated: "2026-11-02",
      links: [
        {
          id: "weibo-hot",
          name: "微博热搜",
          url: "https://s.weibo.com/top/summary",
          tags: [],
          desc: "十分钟前的全网议题",
        },
      ],
    }),
  },
];

describe("mergeTopics", () => {
  it("分类顺序 = 清单顺序，且带上文件里的元信息", () => {
    const { categories } = mergeTopics(entries);
    expect(categories.map((c) => c.slug)).toEqual(["ai", "news"]);
    expect(categories[0]).toEqual({
      slug: "ai",
      label: "AI",
      emoji: "🤖",
      blurb: "模型、论文与新工具",
    });
  });

  it("主分类由文件决定：tags[0] = label，副标签按原顺序跟在后面", () => {
    const { links } = mergeTopics(entries);
    expect(links[0].tags).toEqual(["AI", "快讯"]);
    expect(links[1].tags).toEqual(["新闻"]);
  });

  it("updated 取所有主题文件的最大值", () => {
    expect(mergeTopics(entries).updated).toBe("2026-11-02");
  });

  it("没有任何主题文件时 updated 为空串（由调用方报错）", () => {
    expect(mergeTopics([]).updated).toBe("");
  });
});

describe("checkTopicSet", () => {
  it("清单与目录一致时无错误", () => {
    expect(checkTopicSet(["ai", "news"], ["news", "ai"])).toEqual([]);
  });

  it("清单有、文件没有 → 报错", () => {
    expect(checkTopicSet(["ai", "news"], ["ai"])).toEqual([
      "清单里有「news」，但 data/topics/news.json 不存在",
    ]);
  });

  it("文件有、清单没有 → 报错", () => {
    expect(checkTopicSet(["ai"], ["ai", "news"])).toEqual([
      "data/topics/news.json 没有登记在 data/topics.json 里",
    ]);
  });

  it("清单内重复 → 报错", () => {
    expect(checkTopicSet(["ai", "ai"], ["ai"])).toEqual(["data/topics.json 里重复登记了「ai」"]);
  });
});
