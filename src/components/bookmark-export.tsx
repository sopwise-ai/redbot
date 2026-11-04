"use client";

import { DownloadIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { loadCorpus } from "@/lib/corpus";
import type { LinkItem } from "@/lib/schema";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 浏览器能直接导入的 Netscape 书签文件；纯前端生成，不经过服务器。 */
function buildBookmarks(items: LinkItem[]) {
  const lines = [
    "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    "<TITLE>Bookmarks</TITLE>",
    "<H1>Bookmarks</H1>",
    "<DL><p>",
    `    <DT><H3>${escapeHtml(site.name)} · ${escapeHtml(site.tagline)}</H3>`,
    "    <DL><p>",
  ];

  const byTopic = new Map<string, LinkItem[]>();
  for (const item of items) {
    const key = item.topic?.name ?? item.tags[0];
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

export function BookmarkExport({ total }: { total: number }) {
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  async function download() {
    setBusy(true);
    setFailed(false);
    try {
      const items = await loadCorpus();
      const blob = new Blob([buildBookmarks(items)], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `redbot-bookmarks-${new Date().toISOString().slice(0, 10)}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // 语料没拉到（离线 / 被拦截）时不能只留一个毫无反应的按钮
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-8 flex-col gap-3 p-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className={cn("text-xs", failed ? "text-destructive" : "text-muted-foreground")}>
        {failed
          ? "导出失败：没能加载信息源清单，刷新页面再试一次。"
          : `把 ${total} 个信息源按主题导出，可导入 Chrome / Safari / Edge 的书签栏。`}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={download}
        disabled={busy}
      >
        {busy ? <Spinner data-icon="inline-start" /> : <DownloadIcon data-icon="inline-start" />}
        {busy ? "准备中…" : "导出书签"}
      </Button>
    </Card>
  );
}
