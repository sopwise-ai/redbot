import { describe, expect, it } from "vitest";

import { headCount, headMeta } from "@/lib/head-meta";
import type { ShellView } from "@/components/app-shell";
import type { CategoryGroup } from "@/lib/schema";

const activeGroup = {
  slug: "news",
  name: "新闻",
  emoji: "📰",
  desc: "正在发生的事",
  items: [{ id: "weibo-hot" }],
} as unknown as CategoryGroup;

const options = {
  view: "wall" as ShellView,
  searching: false,
  activeGroup: null,
  total: 189,
};

describe("headMeta", () => {
  it("wall + 无分类：全部信息源", () => {
    expect(headMeta(options)).toEqual({
      emoji: "🗂️",
      title: "全部信息源",
      subtitle: "点一下直达，不用再记网址",
    });
  });

  it("wall + 选中分类：报头变成分类的 emoji/name/desc", () => {
    expect(headMeta({ ...options, activeGroup })).toEqual({
      emoji: "📰",
      title: "新闻",
      subtitle: "正在发生的事",
    });
  });

  it("搜索中优先于一切视图", () => {
    expect(headMeta({ ...options, view: "history", searching: true }).title).toBe("搜索结果");
    expect(headMeta({ ...options, view: "topics", searching: true }).emoji).toBe("🔍");
  });

  it("topics / search / history / about 各有固定文案", () => {
    expect(headMeta({ ...options, view: "topics" }).title).toBe("全部主题");
    expect(headMeta({ ...options, view: "search" }).title).toBe("搜索");
    expect(headMeta({ ...options, view: "history" }).subtitle).toBe(
      "你点过的信息源，按最近使用排序",
    );
    expect(headMeta({ ...options, view: "about" }).title).toBe("关于");
  });
});

describe("headCount", () => {
  const counts = {
    searching: false,
    view: "wall" as ShellView,
    searchCount: 3,
    historyCount: 7,
    activeGroupCount: null,
    total: 189,
  };

  it("wall + 无分类 → total", () => {
    expect(headCount(counts)).toBe(189);
  });

  it("wall + 选中分类 → 该分类条数", () => {
    expect(headCount({ ...counts, activeGroupCount: 12 })).toBe(12);
  });

  it("搜索中 → 搜索结果数（即使人停留在别的视图）", () => {
    expect(headCount({ ...counts, searching: true })).toBe(3);
  });

  it("topics / search / about → 0（计数徽章不渲染）", () => {
    expect(headCount({ ...counts, view: "topics" })).toBe(0);
    expect(headCount({ ...counts, view: "search" })).toBe(0);
    expect(headCount({ ...counts, view: "about" })).toBe(0);
  });

  it("history → 足迹条数", () => {
    expect(headCount({ ...counts, view: "history" })).toBe(7);
  });
});
