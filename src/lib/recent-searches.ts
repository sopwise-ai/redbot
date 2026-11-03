"use client";

/** 最近搜索：只存本机 localStorage，最多 5 条，供搜索框聚焦时展示。 */
const KEY = "redbot:recent-searches";
const LIMIT = 5;

function write(list: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT)));
  } catch {
    /* 配额满或被禁用时静默失败 */
  }
}

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, LIMIT);
  } catch {
    return [];
  }
}

/** 记录一次有效搜索：去重（忽略大小写）、最新的排最前。 */
export function rememberSearch(term: string): string[] {
  const value = term.trim();
  if (!value) return readRecentSearches();

  const next = [
    value,
    ...readRecentSearches().filter((item) => item.toLowerCase() !== value.toLowerCase()),
  ].slice(0, LIMIT);
  write(next);
  return next;
}

export function clearRecentSearches(): string[] {
  write([]);
  return [];
}
