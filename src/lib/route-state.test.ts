import { describe, expect, it } from "vitest";

import { ALL, parseRoute } from "@/lib/route-state";

const SLUGS = ["news", "tech", "ai"];

describe("parseRoute", () => {
  it("搜索页：读出 q 参数（URL 编码会被解码）", () => {
    const route = parseRoute("/search/", "?q=%E6%96%B0%E9%97%BB", SLUGS);
    expect(route).toEqual({ isSearch: true, query: "新闻", active: ALL });
  });

  it("搜索页：没有 q 时 search 为空串（不报错）", () => {
    expect(parseRoute("/search/", "", SLUGS)).toEqual({
      isSearch: true,
      query: "",
      active: ALL,
    });
  });

  it("搜索页：q 两端空白被裁掉", () => {
    expect(parseRoute("/search/", "?q=%20%E5%BE%AE%E5%8D%9A%20", SLUGS).query).toBe("微博");
  });

  it("搜索页无尾斜杠也认", () => {
    expect(parseRoute("/search", "?q=ai", SLUGS).isSearch).toBe(true);
  });

  it("分类页：已知 slug 原样返回", () => {
    expect(parseRoute("/topics/tech/", "", SLUGS)).toEqual({
      isSearch: false,
      query: "",
      active: "tech",
    });
  });

  it("分类页：未知 slug 退到 ALL", () => {
    expect(parseRoute("/topics/nope/", "", SLUGS).active).toBe(ALL);
  });

  it("首页与主题索引都归 ALL", () => {
    expect(parseRoute("/", "", SLUGS).active).toBe(ALL);
    expect(parseRoute("/topics/", "", SLUGS).active).toBe(ALL);
  });

  it("非搜索路由即使带 q 参数也不当搜索态", () => {
    // 防止把 `/?q=x`（外站拼错、或旧链接）误判成搜索
    expect(parseRoute("/", "?q=微博", SLUGS)).toEqual({
      isSearch: false,
      query: "",
      active: ALL,
    });
  });

  it("足迹页不参与分类判定", () => {
    expect(parseRoute("/history/", "", SLUGS)).toEqual({
      isSearch: false,
      query: "",
      active: ALL,
    });
  });
});
