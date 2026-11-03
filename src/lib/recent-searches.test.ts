// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

import { clearRecentSearches, readRecentSearches, rememberSearch } from "@/lib/recent-searches";

beforeEach(() => window.localStorage.clear());

describe("recent-searches", () => {
  it("空存储返回空数组", () => {
    expect(readRecentSearches()).toEqual([]);
  });

  it("最新记录排最前，最多 5 条", () => {
    for (const term of ["a", "b", "c", "d", "e", "f"]) rememberSearch(term);
    expect(readRecentSearches()).toEqual(["f", "e", "d", "c", "b"]);
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
