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
    setReady(true);
    return subscribeHistory(refresh);
  }, []);

  return { entries, ready };
}
