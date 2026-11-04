"use client";

import * as React from "react";

import { resolveGroupFilter } from "@/lib/group-filter";
import type { CategoryGroup } from "@/lib/schema";
import { replaceUrlQuietly } from "@/lib/url";

/**
 * 主题页的分组筛选：`?group=` 是状态。
 *
 * 写入用 replaceUrlQuietly（silent）：URL 变了，但不该把焦点从 chip 上抢走。
 * 读取规则见 lib/group-filter.ts 的 resolveGroupFilter —— 与 layout.tsx 的内联脚本同源。
 */
export function useGroupFilter(activeTopic: CategoryGroup | null) {
  // 首帧就读 ?group=：放在 effect 里会先渲染全部、再筛成一组，内容会明显缩一下
  const [groupFilter, setGroupFilter] = React.useState(() =>
    typeof document === "undefined"
      ? ""
      : resolveGroupFilter(window.location.search, activeTopic?.groups ?? []),
  );

  // 换主题时同步一次：新主题不一定有旧主题的分组
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 只在 activeTopic 变化时读一次地址栏
    setGroupFilter(resolveGroupFilter(window.location.search, activeTopic?.groups ?? []));
  }, [activeTopic]);

  const changeGroupFilter = React.useCallback(
    (next: string) => {
      setGroupFilter(next);
      if (!activeTopic) return;
      const suffix = next ? `?group=${encodeURIComponent(next)}` : "";
      replaceUrlQuietly(`/topics/${activeTopic.slug}/${suffix}`, { silent: true });
    },
    [activeTopic],
  );

  /** 浏览器前进/后退后，把地址栏里的 ?group= 重新读成 state */
  const syncGroupFilter = React.useCallback(() => {
    setGroupFilter(resolveGroupFilter(window.location.search, activeTopic?.groups ?? []));
  }, [activeTopic]);

  return { groupFilter, changeGroupFilter, syncGroupFilter };
}
