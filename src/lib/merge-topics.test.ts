import { describe, expect, it } from "vitest";

import { checkTopicGroups, checkTopicSet, mergeTopics, type TopicEntry } from "@/lib/merge-topics";
import type { TopicFile } from "@/lib/schema";

const file = (over: Partial<TopicFile> = {}): TopicFile => ({
  name: "AI",
  emoji: "🤖",
  desc: "模型、论文与新工具",
  updated: "2026-10-28",
  groups: [],
  links: [
    {
      id: "qbitai",
      name: "量子位",
      url: "https://www.qbitai.com/",
      tags: ["快讯"],
      aliases: [],
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
      name: "新闻",
      emoji: "📰",
      desc: "今天发生了什么",
      updated: "2026-11-02",
      links: [
        {
          id: "weibo-hot",
          name: "微博热搜",
          url: "https://s.weibo.com/top/summary",
          tags: [],
          aliases: [],
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
      name: "AI",
      emoji: "🤖",
      desc: "模型、论文与新工具",
      groups: [],
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

describe("主题内分组", () => {
  const grouped = (): TopicEntry => ({
    slug: "auto",
    file: file({
      name: "汽车",
      emoji: "🚗",
      desc: "车与出行",
      groups: [
        { slug: "news", name: "汽车资讯" },
        { slug: "brand", name: "品牌官网" },
      ],
      links: [
        {
          id: "autohome",
          name: "汽车之家",
          url: "https://www.autohome.com.cn/",
          group: "news",
          tags: [],
          aliases: [],
          desc: "看车",
        },
        {
          id: "bmw",
          name: "宝马中国",
          url: "https://www.bmw.com.cn/",
          group: "brand",
          tags: [],
          aliases: [],
          desc: "官网",
        },
        {
          id: "misc",
          name: "未分组站",
          url: "https://example.com/misc",
          tags: [],
          aliases: [],
          desc: "没有分组",
        },
      ],
    }),
  });

  it("把 group 元信息挂到链接上；未分组不挂", () => {
    const { categories, links } = mergeTopics([grouped()]);
    expect(categories[0].groups).toHaveLength(2);
    expect(links[0].group).toEqual({ slug: "news", name: "汽车资讯" });
    expect(links[2].group).toBeUndefined();
  });

  it("引用未定义的分组直接抛错", () => {
    expect(() =>
      mergeTopics([
        {
          slug: "bad",
          file: file({
            links: [
              {
                id: "x",
                name: "X",
                url: "https://example.com/x",
                group: "missing",
                tags: [],
                aliases: [],
                desc: "x",
              },
            ],
          }),
        },
      ]),
    ).toThrow(/未定义的分组/);
  });
});

describe("checkTopicGroups", () => {
  it("正常分组无错误", () => {
    expect(
      checkTopicGroups(
        file({
          groups: [{ slug: "news", name: "资讯" }],
          links: [
            {
              id: "a",
              name: "A",
              url: "https://example.com/a",
              group: "news",
              tags: [],
              aliases: [],
              desc: "a",
            },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it("空分组、重复、保留字、未知引用都会报错", () => {
    const errors = checkTopicGroups(
      file({
        groups: [
          { slug: "all", name: "资讯" },
          { slug: "all", name: "资讯" },
        ],
        links: [
          {
            id: "a",
            name: "A",
            url: "https://example.com/a",
            group: "missing",
            tags: [],
            aliases: [],
            desc: "a",
          },
        ],
      }),
    );
    expect(errors.some((item) => item.includes("保留字"))).toBe(true);
    expect(errors.some((item) => item.includes("重复"))).toBe(true);
    expect(errors.some((item) => item.includes("未定义"))).toBe(true);
    expect(errors.some((item) => item.includes("没有任何条目"))).toBe(true);
  });
});
