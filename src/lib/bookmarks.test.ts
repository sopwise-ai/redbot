import { describe, expect, it } from "vitest";

import { bookmarkFileName, buildBookmarks, escapeHtml } from "@/lib/bookmarks";
import type { LinkItem } from "@/lib/schema";

function link(overrides: Partial<LinkItem> & Pick<LinkItem, "id" | "name">): LinkItem {
  return {
    url: `https://example.com/${overrides.id}`,
    desc: "",
    tags: ["科技"],
    ...overrides,
  };
}

describe("escapeHtml", () => {
  it("转义会破坏书签 HTML 的字符", () => {
    expect(escapeHtml(`A & B <C> "D"`)).toBe("A &amp; B &lt;C&gt; &quot;D&quot;");
  });
});

describe("buildBookmarks", () => {
  it("生成 Netscape 书签头，并按主题分组", () => {
    const output = buildBookmarks(
      [
        link({ id: "a", name: "甲", topic: { slug: "tech", name: "科技" } }),
        link({ id: "b", name: "乙", topic: { slug: "tech", name: "科技" } }),
        link({ id: "c", name: "丙", topic: { slug: "news", name: "新闻" } }),
      ],
      { name: "RedBot", tagline: "中文网站精选清单" },
    );

    expect(output.startsWith("<!DOCTYPE NETSCAPE-Bookmark-file-1>")).toBe(true);
    expect(output).toContain("<H3>RedBot · 中文网站精选清单</H3>");
    expect(output.indexOf("<H3>科技</H3>")).toBeLessThan(output.indexOf("<H3>新闻</H3>"));
    expect(output.match(/<DT><A HREF=/g)).toHaveLength(3);
  });

  it("站点名与 URL 都做转义", () => {
    const output = buildBookmarks(
      [link({ id: "x", name: `A <script> "B"`, url: "https://example.com/?a=1&b=2" })],
      { name: "R&B", tagline: "<tag>" },
    );
    expect(output).toContain("<H3>R&amp;B · &lt;tag&gt;</H3>");
    expect(output).toContain("A &lt;script&gt; &quot;B&quot;");
    expect(output).toContain("https://example.com/?a=1&amp;b=2");
    expect(output).not.toContain("<script>");
  });

  it("没有主题时退回主分类，再退回未分组", () => {
    const output = buildBookmarks([
      link({ id: "a", name: "甲", tags: ["新闻"] }),
      link({ id: "b", name: "乙", tags: [] }),
    ]);
    expect(output).toContain("<H3>新闻</H3>");
    expect(output).toContain("<H3>未分组</H3>");
  });
});

describe("bookmarkFileName", () => {
  it("文件名带 UTC 日期，重复导出不会互相覆盖", () => {
    expect(bookmarkFileName(new Date("2026-11-04T00:00:00Z"))).toBe(
      "redbot-bookmarks-2026-11-04.html",
    );
  });
});
