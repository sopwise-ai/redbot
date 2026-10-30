"use client";

import * as React from "react";
import { ArrowUpRight, CheckIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { removeVisits, clearHistory } from "@/lib/history";
import { hueFor } from "@/components/pill-wall";
import type { CategoryGroup, LinkItem } from "@/lib/schema";
import { useHistory } from "@/lib/use-history";
import { cn } from "@/lib/utils";

export function HistoryView({ groups }: { groups: CategoryGroup[] }) {
  const { entries, ready } = useHistory();
  const [managing, setManaging] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [confirmClear, setConfirmClear] = React.useState(false);

  const byId = React.useMemo(
    () => new Map(groups.flatMap((group) => group.items).map((item) => [item.id, item])),
    [groups],
  );
  const hueByLabel = React.useMemo(
    () => new Map(groups.map((group, index) => [group.label, hueFor(index)])),
    [groups],
  );

  // 足迹顺序即「最近使用」，过滤掉已经下架的条目
  const items = React.useMemo(
    () => entries.map((entry) => byId.get(entry.id)).filter((item): item is LinkItem => !!item),
    [entries, byId],
  );

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

  if (!ready) {
    return <div className="h-40" aria-hidden />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-16 text-center">
        <p className="text-md font-medium">还没有足迹</p>
        <p className="mt-2 text-sm text-muted-foreground">
          随便点几个信息源，它们会自动出现在这里，方便下次直接打开。
        </p>
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
          const active = selected.has(item.id);
          return (
            <li key={item.id} className="min-w-0">
              <Button
                asChild={!managing}
                variant="outline"
                size="sm"
                onClick={managing ? () => toggle(item.id) : undefined}
                aria-pressed={managing ? active : undefined}
                className={cn(
                  "group h-9 w-full justify-between gap-2.5 rounded-lg border-border bg-card px-3 text-base font-normal text-foreground/90 shadow-xs transition-[background-color,border-color,box-shadow] duration-150 hover:border-ring/25 hover:bg-accent hover:text-foreground hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none",
                  active && "border-primary/60 bg-primary/5",
                )}
              >
                {managing ? (
                  <>
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[5px] border",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {active ? <CheckIcon aria-hidden className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
                  </>
                ) : (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.desc}
                    aria-label={`${item.name}：${item.desc}（在新标签页打开）`}
                  >
                    <span
                      aria-hidden
                      style={{ ["--dot-hue" as string]: hueByLabel.get(item.tags[0]) ?? 0 }}
                      className="size-[5px] shrink-0 rounded-full bg-[oklch(0.64_0.13_var(--dot-hue))] dark:bg-[oklch(0.75_0.11_var(--dot-hue))]"
                    />
                    <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
                    <ArrowUpRight
                      aria-hidden
                      className="size-3.5 shrink-0 text-muted-foreground/35 transition-colors group-hover:text-primary"
                    />
                  </a>
                )}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
