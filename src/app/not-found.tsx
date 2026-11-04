import Link from "next/link";
import { ArrowUpRightIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
        <h1 className="mt-3 font-serif text-2xl font-normal tracking-[0.01em]">这个页面不存在</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          链接可能已经失效，或者地址里有拼写错误。
        </p>
      </div>

      {/* 与顶栏同一个搜索控件：胶囊外形 + 左侧图标 + 右侧动作按钮，不要退回裸 Input */}
      <form action="/search/" method="get" role="search" className="w-full max-w-sm">
        <InputGroup className="h-11 rounded-full pr-1 shadow-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            name="q"
            aria-label="搜索信息源"
            placeholder="搜一个站，比如「播客」"
            autoComplete="off"
            spellCheck={false}
          />
          <InputGroupAddon align="inline-end" className="mr-0! pr-0 [&>button]:mr-0">
            <InputGroupButton
              type="submit"
              variant="default"
              size="sm"
              className="rounded-full px-4"
            >
              搜索
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
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
