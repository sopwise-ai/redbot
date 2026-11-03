"use client";

import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CategoryGroup } from "@/lib/schema";
import { site } from "@/lib/site";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 浏览器能直接导入的 Netscape 书签文件；纯前端生成，不经过服务器。 */
function buildBookmarks(groups: CategoryGroup[]) {
  const lines = [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
    `    <DT><H3>${escapeHtml(site.name)} · ${escapeHtml(site.tagline)}</H3>`,
    "    <DL><p>",
  ];

  for (const group of groups) {
    lines.push(`        <DT><H3>${escapeHtml(group.name)}</H3>`);
    lines.push("        <DL><p>");
    for (const item of group.items) {
      lines.push(`            <DT><A HREF="${escapeHtml(item.url)}">${escapeHtml(item.name)}</A>`);
    }
    lines.push("        </DL><p>");
  }

  lines.push("    </DL><p>", "</DL><p>", "");
  return lines.join("\n");
}

export function BookmarkExport({ groups }: { groups: CategoryGroup[] }) {
  const count = groups.reduce((sum, group) => sum + group.items.length, 0);

  function download() {
    const blob = new Blob([buildBookmarks(groups)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `redbot-bookmarks-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
      <p className="text-xs text-muted-foreground">
        把 {count} 个信息源按主题导出，可导入 Chrome / Safari / Edge 的书签栏。
      </p>
      <Button variant="outline" size="sm" className="rounded-full" onClick={download}>
        <DownloadIcon aria-hidden className="size-3.5" />
        导出书签
      </Button>
    </div>
  );
}
