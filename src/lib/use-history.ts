"use client";

import * as React from "react";

import { readHistory, subscribeHistory, type HistoryEntry } from "@/lib/history";

/**
 * 只要「足迹条数」的地方用这个（侧栏徽章、报头计数）。
 *
 * 不能直接复用 useHistory()：它每次访问都返回新数组，点一下卡片就会让整个
 * AppShell（首页 102 张卡）重渲染。useSyncExternalStore 的 snapshot 是数字，
 * 重复点同一个站时长度不变，React 会跳过渲染。
 */
export function useHistoryCount() {
  return React.useSyncExternalStore(subscribeHistory, readHistoryCount, () => 0);
}

function readHistoryCount() {
  return readHistory().length;
}

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
