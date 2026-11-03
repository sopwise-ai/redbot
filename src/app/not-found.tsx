import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { site } from "@/lib/site";

export const metadata = {
  title: "页面不存在",
  description: "这个页面不存在，回到 RedBot 首页继续浏览信息源。",
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-xl bg-primary shadow-sm"
      >
        <span className="size-2.5 rounded-full bg-primary-foreground" />
      </span>

      <div className="max-w-md">
        <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">这个页面不存在</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          链接可能已经失效，或者地址里有拼写错误。
        </p>
      </div>

      <form
        action="/search/"
        method="get"
        role="search"
        className="flex w-full max-w-sm items-center gap-2"
      >
        <Input
          type="search"
          name="q"
          aria-label="搜索信息源"
          placeholder="搜一个站，比如「播客」"
          autoComplete="off"
        />
        <Button type="submit" className="shrink-0 rounded-full">
          搜索
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild className="rounded-full">
          <Link href="/">回到首页</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <a href={site.repo} target="_blank" rel="noopener noreferrer">
            GitHub
            <ArrowUpRightIcon aria-hidden className="size-3.5" />
          </a>
        </Button>
      </div>
    </main>
  );
}
