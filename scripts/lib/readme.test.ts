import { describe, expect, it } from "vitest";

import type { Catalog, Category } from "../../src/lib/schema";
import { buildReadme } from "./readme";

const site = {
  name: "RedBot",
  domain: "redbot.cc",
  url: "https://redbot.cc",
  license: "MIT",
  author: "SopwiseAI",
  repo: "https://github.com/sopwise-ai/redbot",
};

const categories: Category[] = [
  { slug: "news", label: "新闻", blurb: "今天发生了什么" },
  { slug: "ai", label: "AI", blurb: "模型与工具" },
];

const catalog: Catalog = {
  version: 1,
  updated: "2026-10-28",
  links: [
    {
      id: "a",
      name: "微博热搜",
      url: "https://s.weibo.com/top/summary",
      tags: ["新闻"],
      desc: "十分钟前",
    },
    { id: "b", name: "量子位", url: "https://www.qbitai.com/", tags: ["AI"], desc: "AI 资讯" },
    { id: "c", name: "带|竖线的名字", url: "https://c.com/x", tags: ["新闻"], desc: "说明" },
  ],
};

const render = () => buildReadme({ catalog, categories, site, limits: { perCategory: 20 } });

describe("buildReadme", () => {
  it("目录锚点转小写，与 GitHub 的标题 slug 一致", () => {
    const md = render();
    expect(md).toContain("- [AI](#ai)");
    expect(md).not.toContain("(#AI)");
  });

  it("每个分类恰好一个 ### 标题，且标题不含 blurb", () => {
    const md = render();
    const headings = md.match(/^### .+$/gm) ?? [];
    expect(headings).toEqual(["### 新闻", "### AI"]);
    // 标题里混入 blurb 会让锚点失效（MD051 回归）
    expect(md).not.toMatch(/^### 新闻 ·/m);
  });

  it("标题不重复，否则锚点会冲突", () => {
    const md = render();
    const headings = md.match(/^#{1,6} .+$/gm) ?? [];
    expect(new Set(headings).size).toBe(headings.length);
  });

  it("名称中的竖线被转义，表格不会错列", () => {
    expect(render()).toContain("带\\|竖线的名字");
  });

  it("配额数字来自 limits，而不是写死", () => {
    const md = buildReadme({ catalog, categories, site, limits: { perCategory: 7 } });
    expect(md).toContain("每个主题最多 7 个");
  });

  it("链接数与分类数进入徽章", () => {
    const md = render();
    expect(md).toContain("信息源-3-");
    expect(md).toContain("主题-2-");
  });
});
