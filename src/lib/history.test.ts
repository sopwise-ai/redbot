// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearHistory,
  formatRelativeTime,
  readHistory,
  recordVisit,
  removeVisits,
  subscribeHistory,
} from "@/lib/history";

/**
 * history.ts 是全站唯一有状态、碰用户数据的模块：
 * localStorage 读写、损坏数据容错、跨组件同步全在这里，值得真 DOM 环境测。
 */

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readHistory", () => {
  it("空存储返回空数组", () => {
    expect(readHistory()).toEqual([]);
  });

  it("按最近点击时间倒序", () => {
    window.localStorage.setItem(
      "redbot:history",
      JSON.stringify([
        { id: "old", at: 1, count: 2 },
        { id: "new", at: 3, count: 1 },
      ]),
    );
    expect(readHistory().map((e) => e.id)).toEqual(["new", "old"]);
  });

  it("损坏的 JSON 返回空数组而不是抛错", () => {
    window.localStorage.setItem("redbot:history", "{not json");
    expect(readHistory()).toEqual([]);
  });

  it("非数组 JSON 返回空数组", () => {
    window.localStorage.setItem("redbot:history", JSON.stringify({ id: "x" }));
    expect(readHistory()).toEqual([]);
  });

  it("过滤掉结构不对的条目，保留合法条目", () => {
    window.localStorage.setItem(
      "redbot:history",
      JSON.stringify([
        { id: "good", at: 1, count: 1 },
        { id: 42, at: 2, count: 1 }, // id 不是字符串
        { id: "no-at", count: 1 }, // 缺 at
        null, // 不是对象
      ]),
    );
    expect(readHistory().map((e) => e.id)).toEqual(["good"]);
  });
});

describe("recordVisit", () => {
  it("首次点击写入 count=1", () => {
    recordVisit("weibo-hot");
    const entries = readHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ id: "weibo-hot", count: 1 });
    expect(entries[0].at).toBeGreaterThan(0);
  });

  it("记录主题；后续不带主题的点击保留它", () => {
    recordVisit("baidu", "tools");
    expect(readHistory()[0].topic).toBe("tools");
    recordVisit("baidu");
    expect(readHistory()[0]).toMatchObject({ id: "baidu", topic: "tools", count: 2 });
  });

  it("重复点击累加次数并置顶", () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(100);
    recordVisit("a");
    now.mockReturnValue(150);
    recordVisit("b");
    now.mockReturnValue(200);
    recordVisit("a"); // 第二次点 a：count 2、时间最新

    const entries = readHistory();
    expect(entries.map((e) => e.id)).toEqual(["a", "b"]);
    expect(entries[0]).toEqual({ id: "a", at: 200, count: 2 });
  });

  it("超出 300 条上限时截断最旧的", () => {
    vi.spyOn(Date, "now").mockImplementation(() => 1000);
    for (let i = 0; i < 305; i++) recordVisit(`id-${i}`);
    const entries = readHistory();
    expect(entries).toHaveLength(300);
    // 最旧的 5 条（id-0..4）被挤出，最新的保留
    expect(entries[0].id).toBe("id-304");
    expect(entries.at(-1)?.id).toBe("id-5");
  });
});

describe("removeVisits / clearHistory", () => {
  it("按 id 批量删除，不动其他条目", () => {
    recordVisit("keep");
    recordVisit("drop-1");
    recordVisit("drop-2");
    removeVisits(["drop-1", "drop-2"]);
    expect(readHistory().map((e) => e.id)).toEqual(["keep"]);
  });

  it("清空后存储为空数组（键仍存在）", () => {
    recordVisit("x");
    clearHistory();
    expect(readHistory()).toEqual([]);
    expect(window.localStorage.getItem("redbot:history")).toBe("[]");
  });
});

describe("subscribeHistory", () => {
  it("写操作触发同标签页回调，取消订阅后不再触发", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeHistory(listener);

    recordVisit("a");
    expect(listener).toHaveBeenCalledTimes(1);

    clearHistory();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    recordVisit("b");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-11-03T12:00:00+08:00").getTime();
  const at = (msAgo: number) => now - msAgo;

  it("一分钟内是「刚刚」", () => {
    expect(formatRelativeTime(at(30_000), now)).toBe("刚刚");
  });

  it("分钟 / 小时 / 天逐级切换", () => {
    expect(formatRelativeTime(at(5 * 60_000), now)).toBe("5 分钟前");
    expect(formatRelativeTime(at(3 * 3_600_000), now)).toBe("3 小时前");
    expect(formatRelativeTime(at(2 * 86_400_000), now)).toBe("2 天前");
  });

  it("超过 30 天回落到日期", () => {
    expect(formatRelativeTime(at(40 * 86_400_000), now)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
