import { describe, expect, it } from "vitest";

import {
  ALL_GROUPS,
  UNGROUPED_GROUP,
  buildWallGroups,
  itemsInGroup,
  resolveGroupFilter,
} from "@/lib/group-filter";
import type { CategoryGroup, LinkItem } from "@/lib/schema";

const GROUPS = [
  { slug: "hot", name: "热榜" },
  { slug: "deep", name: "深度" },
];

function link(id: string, groupSlug?: string): LinkItem {
  return {
    id,
    name: id,
    url: `https://example.com/${id}`,
    desc: "",
    tags: ["科技"],
    ...(groupSlug ? { group: { slug: groupSlug, name: groupSlug } } : {}),
  };
}

function topic(items: LinkItem[], groups = GROUPS): CategoryGroup {
  return { slug: "tech", name: "科技", emoji: "💻", desc: "", groups, items };
}

describe("resolveGroupFilter", () => {
  it("没有参数时返回空串（不过滤）", () => {
    expect(resolveGroupFilter("", GROUPS)).toBe("");
    expect(resolveGroupFilter("?q=新闻", GROUPS)).toBe("");
  });

  it("命中已定义的分组时原样返回", () => {
    expect(resolveGroupFilter("?group=hot", GROUPS)).toBe("hot");
  });

  it("未分组是合法值", () => {
    expect(resolveGroupFilter("?group=ungrouped", GROUPS)).toBe(UNGROUPED_GROUP);
  });

  it("all 等价于不过滤，而不是「一个叫 all 的分组」", () => {
    expect(resolveGroupFilter(`?group=${ALL_GROUPS}`, GROUPS)).toBe("");
  });

  it("未知分组退回不过滤", () => {
    expect(resolveGroupFilter("?group=nope", GROUPS)).toBe("");
    expect(resolveGroupFilter("?group=%E7%83%AD", GROUPS)).toBe("");
  });
});

describe("itemsInGroup", () => {
  it("按分组过滤，未分组用 null 判断", () => {
    const items = [link("a", "hot"), link("b", "deep"), link("c")];
    expect(itemsInGroup(items, "hot").map((item) => item.id)).toEqual(["a"]);
    expect(itemsInGroup(items, UNGROUPED_GROUP).map((item) => item.id)).toEqual(["c"]);
    expect(itemsInGroup(items, "missing")).toEqual([]);
  });
});

describe("buildWallGroups", () => {
  const items = [link("a", "hot"), link("b", "hot"), link("c", "deep"), link("d")];

  it("没有主题或搜索中不渲染按钮墙", () => {
    expect(buildWallGroups(null, false, "")).toEqual([]);
    expect(buildWallGroups(topic(items), true, "")).toEqual([]);
  });

  it("主题没有分组时整主题作为一组", () => {
    const noGroups = topic(items, []);
    expect(buildWallGroups(noGroups, false, "")).toEqual([noGroups]);
  });

  it("有分组时按分组切开，未分组追加在最后", () => {
    const groups = buildWallGroups(topic(items), false, "");
    expect(groups.map((group) => group.slug)).toEqual(["tech-hot", "tech-deep", "tech-ungrouped"]);
    expect(groups.map((group) => group.items.length)).toEqual([2, 1, 1]);
    expect(groups.every((group) => group.hidden === false)).toBe(true);
    expect(groups[2].groupSlug).toBe(UNGROUPED_GROUP);
  });

  it("筛选时只隐藏不匹配的组，DOM 结构不变", () => {
    const groups = buildWallGroups(topic(items), false, "hot");
    expect(groups.map((group) => group.hidden)).toEqual([false, true, true]);
  });

  it("没有未分组条目时不追加伪分组", () => {
    const groups = buildWallGroups(topic([link("a", "hot")]), false, "");
    expect(groups.map((group) => group.slug)).toEqual(["tech-hot", "tech-deep"]);
  });
});
