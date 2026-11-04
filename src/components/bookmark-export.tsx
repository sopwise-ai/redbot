"use client";

import * as React from "react";
import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { bookmarkFileName, buildBookmarks } from "@/lib/bookmarks";
import { loadCorpus } from "@/lib/corpus";
import { cn } from "@/lib/utils";

/** 浏览器能直接导入的 Netscape 书签文件；纯前端生成，不经过服务器。 */
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
      link.download = bookmarkFileName();
      // 有的浏览器要求节点在文档里才会触发下载
      document.body.append(link);
      link.click();
      link.remove();
      // 立刻 revoke 会让 Firefox / Safari 的下载中断：等浏览器开始读 blob 之后再释放
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      <Button variant="outline" size="sm" className="rounded-lg" onClick={download} disabled={busy}>
        {busy ? <Spinner data-icon="inline-start" /> : <DownloadIcon data-icon="inline-start" />}
        {busy ? "准备中…" : "导出书签"}
      </Button>
    </Card>
  );
}
