import type { LinkItem } from "@/lib/schema";
import { site } from "@/lib/site";

/** 书签文件是 HTML：属性值必须转义，否则站点名里的 `<` / `&` 会破坏结构。 */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 浏览器能直接导入的 Netscape 书签文件。
 * 纯函数：导出组件只负责下载，分组与转义都在这里，可单测。
 */
export function buildBookmarks(
  items: LinkItem[],
  meta: { name: string; tagline: string } = { name: site.name, tagline: site.tagline },
): string {
  const lines = [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
    `    <DT><H3>${escapeHtml(meta.name)} · ${escapeHtml(meta.tagline)}</H3>`,
    "    <DL><p>",
  ];

  const byTopic = new Map<string, LinkItem[]>();
  for (const item of items) {
    const key = item.topic?.name ?? item.tags[0] ?? "未分组";
    const list = byTopic.get(key);
    if (list) list.push(item);
    else byTopic.set(key, [item]);
  }

  for (const [topicName, topicItems] of byTopic) {
    lines.push(`        <DT><H3>${escapeHtml(topicName)}</H3>`);
    lines.push("        <DL><p>");
    for (const item of topicItems) {
      lines.push(`            <DT><A HREF="${escapeHtml(item.url)}">${escapeHtml(item.name)}</A>`);
    }
    lines.push("        </DL><p>");
  }

  lines.push("    </DL><p>", "</DL><p>", "");
  return lines.join("\n");
}

/** 文件名带日期，重复导出不会互相覆盖。 */
export function bookmarkFileName(date = new Date()) {
  return `redbot-bookmarks-${date.toISOString().slice(0, 10)}.html`;
}
