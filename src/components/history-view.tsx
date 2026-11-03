"use client";

import * as React from "react";
import Link from "next/link";
import { PawPrintIcon, ShuffleIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";

import { LinkPill } from "@/components/pill-wall";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { buildHueMap } from "@/lib/groups";
import { clearHistory, formatRelativeTime, recordVisit, removeVisits } from "@/lib/history";
import { pickRandom } from "@/lib/random";
import { useHistory } from "@/lib/use-history";
import type { LinkItem, TopicSummary } from "@/lib/schema";

export function HistoryView({
  corpus,
  topics,
  error = false,
}: {
  corpus: LinkItem[] | null;
  topics: TopicSummary[];
  error?: boolean;
}) {
  const { entries, ready } = useHistory();
  const [managing, setManaging] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const byId = React.useMemo(
    () => new Map((corpus ?? []).map((item) => [item.id, item])),
    [corpus],
  );
  const hueByLabel = React.useMemo(() => buildHueMap(topics), [topics]);

  // 足迹顺序即「最近使用」，过滤掉已经下架的条目
  const items = React.useMemo(
    () => entries.map((entry) => byId.get(entry.id)).filter((item): item is LinkItem => !!item),
    [entries, byId],
  );
  const entriesById = React.useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries],
  );
  const allItems = React.useMemo(() => corpus ?? [], [corpus]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitManaging() {
    setManaging(false);
    setSelected(new Set());
  }

  if (!ready || (!corpus && !error)) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[54px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Empty className="mx-auto w-full max-w-2xl rounded-2xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>足迹数据加载失败</EmptyTitle>
          <EmptyDescription>刷新页面再试一次。</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" onClick={() => window.location.reload()}>
            重新加载
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (items.length === 0) {
    return (
      <Empty className="mx-auto w-full max-w-2xl rounded-2xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PawPrintIcon />
          </EmptyMedia>
          <EmptyTitle>还没有足迹</EmptyTitle>
          <EmptyDescription>
            随便点几个信息源，它们会自动出现在这里，方便下次直接打开。
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                const pick = pickRandom(allItems);
                if (!pick) return;
                recordVisit(pick.id, pick.topic?.slug);
                window.open(pick.url, "_blank", "noopener,noreferrer");
              }}
            >
              <ShuffleIcon data-icon="inline-start" />
              随机一个
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/topics/">按主题浏览</Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length} 个 · 按最近使用排序
        </span>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          {managing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  setSelected(
                    selected.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
                  )
                }
              >
                {selected.size === items.length ? "取消全选" : "全选"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-destructive hover:text-destructive"
                disabled={selected.size === 0}
                onClick={() => {
                  removeVisits([...selected]);
                  setSelected(new Set());
                }}
              >
                删除选中{selected.size > 0 ? `（${selected.size}）` : ""}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-destructive hover:text-destructive"
                  >
                    <Trash2Icon data-icon="inline-start" />
                    清空
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>清空全部足迹？</AlertDialogTitle>
                    <AlertDialogDescription>
                      这会删除本机保存的 {items.length} 条访问记录，无法撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        clearHistory();
                        exitManaging();
                      }}
                    >
                      清空
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" size="sm" className="rounded-full" onClick={exitManaging}>
                完成
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setManaging(true)}
            >
              管理
            </Button>
          )}
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const entry = entriesById.get(item.id);
          return (
            <li key={item.id} className="min-w-0">
              <LinkPill
                item={item}
                hue={hueByLabel.get(item.tags[0]) ?? 0}
                variant={managing ? "manage" : "browse"}
                selected={managing && selected.has(item.id)}
                onToggle={toggle}
                meta={
                  !managing && entry
                    ? `点过 ${entry.count} 次 · ${formatRelativeTime(entry.at)}`
                    : undefined
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
