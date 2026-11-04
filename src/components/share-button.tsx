"use client";

import * as React from "react";
import { CheckIcon, Share2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** 分享当前主题：优先系统分享面板，不支持时复制链接并短暂反馈。 */
export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  async function onShare() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // 用户取消分享时不要再落回复制
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 剪贴板不可用时静默，不打断浏览 */
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onShare}
      aria-label={copied ? "链接已复制" : "分享本主题"}
      className="relative text-muted-foreground after:absolute after:-inset-1 after:content-['']"
    >
      {copied ? <CheckIcon aria-hidden /> : <Share2Icon aria-hidden />}
      {copied ? (
        <span role="status" className="sr-only">
          链接已复制
        </span>
      ) : null}
    </Button>
  );
}
