import { describe, expect, it } from "vitest";

import type { Catalog, Category } from "../../src/lib/schema";
import { checkData, normalizeUrl } from "./checks";

const LIMITS = { perCategory: 3, categories: 2, subtags: ["热榜", "深度"] };

const categories: Category[] = [
  { slug: "news", label: "新闻", blurb: "今天发生了什么" },
  { slug: "dev", label: "开发", blurb: "写代码的人在看什么" },
];

const link = (over: Partial<Catalog["links"][number]> = {}) => ({
  id: "a",
  name: "示例",
  url: "https://example.com/hot",
  tags: ["新闻"],
  desc: "一句话说明",
  ...over,
});

const run = (links: Catalog["links"], cats: Category[] = categories) =>
  checkData({ version: 1, updated: "2026-10-28", links } as Catalog, cats, LIMITS);

describe("normalizeUrl", () => {
  it("忽略 www、末尾斜杠与协议差异", () => {
    expect(normalizeUrl("https://www.Example.com/hot/")).toBe(
      normalizeUrl("https://example.com/hot"),
    );
    expect(normalizeUrl("https://example.com/hot?tab=1")).toBe("example.com/hot?tab=1");
  });
});

describe("checkData — 唯一性", () => {
  it("id 重复时报错", () => {
    const { errors } = run([link(), link({ url: "https://b.com/x", name: "另一个" })]);
    expect(errors.some((e) => e.includes("id 重复"))).toBe(true);
  });

  it("URL 归一化后重复时报错", () => {
    const { errors } = run([
      link(),
      link({ id: "b", name: "另一个", url: "https://www.example.com/hot/" }),
    ]);
    expect(errors.some((e) => e.includes("URL 重复"))).toBe(true);
  });

  it("名称忽略大小写与空白后重复时报错", () => {
    const { errors } = run([
      link({ url: "https://a.com/x" }),
      link({ id: "b", name: "示例", url: "https://b.com/x" }),
    ]);
    expect(errors.some((e) => e.includes("名称重复"))).toBe(true);
  });
});

describe("checkData — 分类与标签", () => {
  it("主分类不在 categories 里时报错", () => {
    const { errors } = run([link({ tags: ["不存在"] }), link({ id: "b", url: "https://b.com/x" })]);
    expect(errors.some((e) => e.includes("主分类"))).toBe(true);
  });

  it("副标签不在白名单时报错", () => {
    const { errors } = run([
      link({ tags: ["新闻", "野标签"] }),
      link({ id: "b", url: "https://b.com/x" }),
    ]);
    expect(errors.some((e) => e.includes("未登记的副标签"))).toBe(true);
  });

  it("空分类报错", () => {
    const { errors } = run([
      link({ url: "https://a.com/x" }),
      link({ id: "b", url: "https://b.com/x" }),
    ]);
    expect(errors.some((e) => e.includes("开发") && e.includes("没有任何条目"))).toBe(true);
  });
});

describe("checkData — 配额", () => {
  it("超过单类配额时报错", () => {
    const links = [1, 2, 3, 4].map((i) =>
      link({ id: `n${i}`, name: `新闻${i}`, url: `https://n${i}.com/hot` }),
    );
    const { errors } = run([
      ...links,
      link({ id: "d1", name: "开发1", tags: ["开发"], url: "https://d.com/1" }),
    ]);
    expect(errors.some((e) => e.includes("超过上限"))).toBe(true);
  });

  it("分类数量超过上限时报错", () => {
    const { errors } = run(
      [link({ url: "https://a.com/x" }), link({ id: "b", url: "https://b.com/x" })],
      [...categories, { slug: "ai", label: "AI", blurb: "模型" }],
    );
    expect(errors.some((e) => e.includes("分类过多"))).toBe(true);
  });
});

describe("checkData — 链接与质量", () => {
  it("非 https 报错", () => {
    const { errors } = run([
      link({ url: "http://example.com/hot" }),
      link({ id: "b", url: "https://b.com/x" }),
    ]);
    expect(errors.some((e) => e.includes("不是 https"))).toBe(true);
  });

  it("指向首页的条目进入 homepageLinks", () => {
    const { homepageLinks } = run([
      link({ url: "https://a.com/" }),
      link({ id: "b", url: "https://b.com/x" }),
    ]);
    expect(homepageLinks).toContain("示例");
  });

  it("名称过长只给提醒，不阻断", () => {
    const { errors, warnings } = run([
      link({ name: "一个特别特别长的信息源名称", url: "https://a.com/x" }),
      link({ id: "b", name: "开发源", tags: ["开发"], url: "https://b.com/x" }),
    ]);
    expect(errors).toHaveLength(0);
    expect(warnings.some((w) => w.includes("名称偏长"))).toBe(true);
  });

  it("合法数据没有任何错误", () => {
    const { errors } = run([
      link({ url: "https://a.com/x" }),
      link({ id: "b", name: "开发源", tags: ["开发", "深度"], url: "https://b.com/x" }),
    ]);
    expect(errors).toHaveLength(0);
  });
});
