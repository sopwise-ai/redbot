"use client";

import * as React from "react";

import { readHistory, subscribeHistory, type HistoryEntry } from "@/lib/history";

/** 读取并提供足迹列表；同标签页与跨标签页都会自动刷新 */
export function useHistory() {
  const [entries, setEntries] = React.useState<HistoryEntry[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const refresh = () => setEntries(readHistory());
    refresh();
    // 挂载后读一次 localStorage（服务端没有存储），这次置位是 hydration 边界
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    return subscribeHistory(refresh);
  }, []);

  return { entries, ready };
}
