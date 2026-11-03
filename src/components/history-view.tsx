"use client";

import * as React from "react";
import { Trash2Icon } from "lucide-react";

import { LinkPill } from "@/components/pill-wall";
import { Button } from "@/components/ui/button";
import { clearHistory, formatRelativeTime, recordVisit, removeVisits } from "@/lib/history";
import { pickRandom } from "@/lib/random";
import { buildHueMap } from "@/lib/groups";
import type { LinkItem, TopicSummary } from "@/lib/schema";
import { useHistory } from "@/lib/use-history";

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
  const [confirmClear, setConfirmClear] = React.useState(false);

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

  if (!ready) return <div className="h-40" aria-hidden />;
  if (!corpus) {
    if (error) {
      return (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="text-md font-medium">足迹数据加载失败</p>
          <p className="mt-2 text-sm text-muted-foreground">刷新页面再试一次。</p>
        </div>
      );
    }
    return <div className="h-40" aria-hidden />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-16 text-center">
        <p className="text-md font-medium">还没有足迹</p>
        <p className="mt-2 text-sm text-muted-foreground">
          随便点几个信息源，它们会自动出现在这里，方便下次直接打开。
        </p>
        <Button
          size="sm"
          className="mt-5 rounded-full"
          onClick={() => {
            const pick = pickRandom(allItems);
            if (!pick) return;
            recordVisit(pick.id, pick.topic?.slug);
            window.open(pick.url, "_blank", "noopener,noreferrer");
          }}
        >
          随机一个
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length} 个 · 按最近使用排序
        </span>
        <div className="ml-auto flex items-center gap-2">
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
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-full text-destructive hover:text-destructive"
                onClick={() => {
                  if (!confirmClear) {
                    setConfirmClear(true);
                    window.setTimeout(() => setConfirmClear(false), 4000);
                    return;
                  }
                  clearHistory();
                  setConfirmClear(false);
                  exitManaging();
                }}
              >
                <Trash2Icon aria-hidden className="size-3.5" />
                {confirmClear ? "再点一次清空" : "清空"}
              </Button>
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

      <ul className="flex flex-wrap gap-2 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(172px,1fr))]">
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
              />
              {!managing && entry ? (
                <p className="mt-1 px-1 text-2xs text-muted-foreground">
                  点过 {entry.count} 次 · {formatRelativeTime(entry.at)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
