// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

import {
  clearRecentSearches,
  readRecentSearches,
  rememberSearch,
  removeRecentSearch,
} from "@/lib/recent-searches";

beforeEach(() => window.localStorage.clear());

describe("recent-searches", () => {
  it("空存储返回空数组", () => {
    expect(readRecentSearches()).toEqual([]);
  });

  it("最新记录排最前，最多 12 条", () => {
    const terms = Array.from({ length: 15 }, (_, i) => `term-${i}`);
    for (const term of terms) rememberSearch(term);
    const list = readRecentSearches();
    expect(list).toHaveLength(12);
    expect(list[0]).toBe("term-14");
    expect(list).not.toContain("term-0");
  });

  it("可以单独删一条，大小写不敏感", () => {
    rememberSearch("AI");
    rememberSearch("微博");
    rememberSearch("播客");
    expect(removeRecentSearch("ai")).toEqual(["播客", "微博"]);
    expect(readRecentSearches()).toEqual(["播客", "微博"]);
  });

  it("删不存在的词不报错，列表不变", () => {
    rememberSearch("微博");
    expect(removeRecentSearch("不存在")).toEqual(["微博"]);
  });

  it("忽略大小写去重，并把旧记录移到最前", () => {
    rememberSearch("AI");
    rememberSearch("微博");
    expect(rememberSearch("ai")).toEqual(["ai", "微博"]);
  });

  it("空白输入不记录", () => {
    rememberSearch("   ");
    expect(readRecentSearches()).toEqual([]);
  });

  it("清除后为空", () => {
    rememberSearch("播客");
    expect(clearRecentSearches()).toEqual([]);
    expect(readRecentSearches()).toEqual([]);
  });
});
