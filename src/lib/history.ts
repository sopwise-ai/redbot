"use client";

/**
 * 足迹：用户点过的链接。
 * 只存在浏览器 localStorage，没有后端、没有账号、不上传。
 */

const KEY = "redbot:history";
const LIMIT = 300;
const EVENT = "redbot:history-change";

export interface HistoryEntry {
  id: string;
  /** 最近一次点击时间戳 */
  at: number;
  /** 累计点击次数 */
  count: number;
}

function isEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" && typeof entry.at === "number" && typeof entry.count === "number"
  );
}

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, LIMIT)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* 配额满或被禁用时静默失败，不影响浏览 */
  }
}

/** 记录一次点击：已存在则累加次数并刷新时间 */
export function recordVisit(id: string) {
  const entries = readHistory();
  const existing = entries.find((entry) => entry.id === id);
  const next: HistoryEntry = existing
    ? { id, at: Date.now(), count: existing.count + 1 }
    : { id, at: Date.now(), count: 1 };

  write([next, ...entries.filter((entry) => entry.id !== id)]);
}

export function removeVisits(ids: string[]) {
  const drop = new Set(ids);
  write(readHistory().filter((entry) => !drop.has(entry.id)));
}

export function clearHistory() {
  write([]);
}

/** 订阅变更：同标签页靠自定义事件，跨标签页靠 storage 事件 */
export function subscribeHistory(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
