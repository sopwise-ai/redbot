"use client";

import * as React from "react";
import { Trash2Icon } from "lucide-react";

import { LinkPill } from "@/components/pill-wall";
import { Button } from "@/components/ui/button";
import { removeVisits, clearHistory } from "@/lib/history";
import { buildHueMap } from "@/lib/groups";
import type { CategoryGroup, LinkItem } from "@/lib/schema";
import { useHistory } from "@/lib/use-history";

export function HistoryView({ groups }: { groups: CategoryGroup[] }) {
  const { entries, ready } = useHistory();
  const [managing, setManaging] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [confirmClear, setConfirmClear] = React.useState(false);

  const byId = React.useMemo(
    () => new Map(groups.flatMap((group) => group.items).map((item) => [item.id, item])),
    [groups],
  );
  const hueByLabel = React.useMemo(() => buildHueMap(groups), [groups]);

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
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <LinkPill
              item={item}
              hue={hueByLabel.get(item.tags[0]) ?? 0}
              variant={managing ? "manage" : "browse"}
              selected={managing && selected.has(item.id)}
              onToggle={toggle}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
