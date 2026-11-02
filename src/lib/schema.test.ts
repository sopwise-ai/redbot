import { describe, expect, it } from "vitest";

import { topicFileSchema, topicLinkSchema } from "@/lib/schema";

const link = (over: Record<string, unknown> = {}) => ({
  id: "example-source",
  name: "示例信息源",
  url: "https://example.com/hot",
  desc: "一句话说清它为什么值得点",
  ...over,
});

const file = (over: Record<string, unknown> = {}) => ({
  name: "阅读",
  emoji: "📚",
  desc: "书与长文字",
  updated: "2026-11-02",
  links: [link()],
  ...over,
});

const issues = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) => result.error?.issues.map((issue) => `${issue.path.join(".")}：${issue.message}`) ?? [];

describe("topicFileSchema — updated 必须是真实日期", () => {
  it("接受合法日期（含闰日）", () => {
    expect(topicFileSchema.safeParse(file({ updated: "2024-02-29" })).success).toBe(true);
  });

  it("拒绝不存在的日期 2026-02-30", () => {
    expect(issues(topicFileSchema.safeParse(file({ updated: "2026-02-30" })))).toContain(
      "updated：updated 不是真实存在的日期",
    );
  });

  it("拒绝越界日期 2026-13-40", () => {
    expect(topicFileSchema.safeParse(file({ updated: "2026-13-40" })).success).toBe(false);
  });

  it("拒绝非 ISO 形状", () => {
    expect(topicFileSchema.safeParse(file({ updated: "2026/11/02" })).success).toBe(false);
  });
});

describe("topicFileSchema — emoji 必须是单个字形", () => {
  it("接受带变体选择符的 emoji（⌨️ 是两个码元）", () => {
    expect(topicFileSchema.safeParse(file({ emoji: "⌨️" })).success).toBe(true);
  });

  it("拒绝普通多字符文本", () => {
    expect(issues(topicFileSchema.safeParse(file({ emoji: "abcdefgh" })))).toContain(
      "emoji：emoji 必须是单个字符",
    );
  });
});

describe("topicLinkSchema — tags", () => {
  it("可以省略，默认空数组", () => {
    const parsed = topicLinkSchema.parse(link());
    expect(parsed.tags).toEqual([]);
  });

  it("最多 2 个", () => {
    expect(topicLinkSchema.safeParse(link({ tags: ["热榜", "深度", "快讯"] })).success).toBe(false);
  });

  it("不能重复", () => {
    expect(issues(topicLinkSchema.safeParse(link({ tags: ["深度", "深度"] })))).toContain(
      "tags：副标签不能重复",
    );
  });
});

describe("topicLinkSchema — aliases", () => {
  it("最多 5 个", () => {
    const aliases = ["a", "b", "c", "d", "e", "f"];
    expect(topicLinkSchema.safeParse(link({ aliases })).success).toBe(false);
  });

  it("不能重复", () => {
    expect(issues(topicLinkSchema.safeParse(link({ aliases: ["wb", "WB"] })))).toContain(
      "aliases：别名不能重复",
    );
  });
});

describe("topicLinkSchema — url", () => {
  it("只接受 https，并给出可读提示", () => {
    expect(issues(topicLinkSchema.safeParse(link({ url: "http://example.com/hot" })))).toContain(
      "url：url 必须是 https 地址",
    );
  });
});
