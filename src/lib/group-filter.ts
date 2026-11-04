import type { CategoryGroup, LinkItem } from "@/lib/schema";

/** 「全部」在 ToggleGroup 里的 value；URL 上不写它（`?group=all` 等价于不过滤）。 */
export const ALL_GROUPS = "all";

/** 没有归入任何分组的条目，作为伪分组参与筛选与计数。 */
export const UNGROUPED_GROUP = "ungrouped";

/** 主题页按钮墙的一组视图模型。 */
export interface PillGroup {
  slug: string;
  name: string;
  items: LinkItem[];
  /** 分组自身的 slug（不含主题前缀），供首屏脚本按 ?group= 匹配 */
  groupSlug?: string;
  /** 首帧就藏起来（分组筛选的未选中项）：保持 DOM 结构不变，只切显示 */
  hidden?: boolean;
}

/**
 * 从地址栏解析分组筛选。
 *
 * 唯一事实源：`layout.tsx` 里绘制前的内联脚本必须与这里保持同一口径，
 * 否则会出现「脚本藏了、React 认为没藏」的空白页（`?group=all` 就踩过这个坑）。
 * 因此 `all` 显式视为「不过滤」，与 URL 的语义一致。
 */
export function resolveGroupFilter(search: string, groups: readonly { slug: string }[]): string {
  const requested = new URLSearchParams(search).get("group") ?? "";
  if (!requested || requested === ALL_GROUPS) return "";
  const valid = requested === UNGROUPED_GROUP || groups.some((group) => group.slug === requested);
  return valid ? requested : "";
}

/** 某一分组（或未分组）下的条目。筛选与计数共用这一个判断。 */
export function itemsInGroup(items: readonly LinkItem[], slug: string): LinkItem[] {
  return items.filter((item) =>
    slug === UNGROUPED_GROUP ? !item.group : item.group?.slug === slug,
  );
}

/**
 * 主题页的按钮墙分组。
 *
 * 分组筛选不「少渲染几组」，而是全部渲染、把不匹配的组标记成 hidden：
 * 静态 HTML 只能是「全部」，客户端首帧若少渲染几组，浏览器会先画出全部再缩水。
 */
export function buildWallGroups(
  activeTopic: CategoryGroup | null,
  searching: boolean,
  groupFilter: string,
): PillGroup[] {
  if (!activeTopic || searching) return [];
  if (activeTopic.groups.length === 0) return [activeTopic];

  const isHidden = (slug: string) => Boolean(groupFilter) && groupFilter !== slug;

  const list: PillGroup[] = activeTopic.groups.map((group) => ({
    slug: `${activeTopic.slug}-${group.slug}`,
    groupSlug: group.slug,
    name: group.name,
    items: itemsInGroup(activeTopic.items, group.slug),
    hidden: isHidden(group.slug),
  }));

  const ungrouped = itemsInGroup(activeTopic.items, UNGROUPED_GROUP);
  if (ungrouped.length > 0) {
    list.push({
      slug: `${activeTopic.slug}-${UNGROUPED_GROUP}`,
      groupSlug: UNGROUPED_GROUP,
      name: "未分组",
      items: ungrouped,
      hidden: isHidden(UNGROUPED_GROUP),
    });
  }

  return list;
}
