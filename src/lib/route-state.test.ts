import { describe, expect, it } from "vitest";

import { parseRoute } from "@/lib/route-state";

describe("parseRoute", () => {
  it("搜索页：读出 q 参数（URL 编码会被解码）", () => {
    expect(parseRoute("/search/", "?q=%E6%96%B0%E9%97%BB")).toEqual({
      isSearch: true,
      query: "新闻",
    });
  });

  it("搜索页：没有 q 时 search 为空串（不报错）", () => {
    expect(parseRoute("/search/", "")).toEqual({ isSearch: true, query: "" });
  });

  it("搜索页：q 两端空白被裁掉", () => {
    expect(parseRoute("/search/", "?q=%20%E5%BE%AE%E5%8D%9A%20").query).toBe("微博");
  });

  it("搜索页无尾斜杠也认", () => {
    expect(parseRoute("/search", "?q=ai").isSearch).toBe(true);
  });

  it("非搜索路由即使带 q 参数也不当搜索态", () => {
    // 防止把 `/?q=x`（外站拼错、或旧链接）误判成搜索
    expect(parseRoute("/", "?q=微博")).toEqual({ isSearch: false, query: "" });
  });

  it("主题页、主题索引、足迹页都不参与搜索态", () => {
    for (const pathname of ["/topics/tech/", "/topics/", "/history/", "/about/"]) {
      expect(parseRoute(pathname, "?q=微博")).toEqual({ isSearch: false, query: "" });
    }
  });
});
