import type { CategoryGroup } from "@/lib/schema";

import type { ShellView } from "@/components/app-shell";

/**
 * 报头文案的唯一事实源：视图 ×（搜索中）→ emoji / 标题 / 副标题。
 * 替换原先 5 层嵌套三元：每加一个视图只改这张表，不改 JSX。
 */

export interface HeadMeta {
  emoji: string;
  title: string;
  subtitle: string;
}

export function headMeta(options: {
  view: ShellView;
  searching: boolean;
  activeGroup: CategoryGroup | null;
  total: number;
}): HeadMeta {
  const { view, searching, activeGroup, total } = options;

  if (searching) {
    return {
      emoji: "🔍",
      title: "搜索结果",
      subtitle: `在全部 ${total} 个信息源里查找，不区分主题`,
    };
  }

  switch (view) {
    case "topics":
      return {
        emoji: "🗂️",
        title: "全部主题",
        subtitle: "按主题浏览，或直接从侧栏进入",
      };
    case "search":
      return {
        emoji: "🔍",
        title: "搜索",
        subtitle: `在全部 ${total} 个信息源里查找，不区分主题`,
      };
    case "history":
      return {
        emoji: "🐾",
        title: "足迹",
        subtitle: "你点过的信息源，按最近使用排序",
      };
    case "wall":
      return activeGroup
        ? {
            emoji: activeGroup.emoji,
            title: activeGroup.name,
            subtitle: activeGroup.desc,
          }
        : {
            emoji: "🗂️",
            title: "全部信息源",
            subtitle: "点一下直达，不用再记网址",
          };
  }
}

/** 报头右侧的计数：随视图与搜索状态变化 */
export function headCount(options: {
  view: ShellView;
  searching: boolean;
  searchCount: number;
  historyCount: number;
  activeGroupCount: number | null;
  total: number;
}): number {
  const { view, searching, searchCount, historyCount, activeGroupCount, total } = options;
  if (searching) return searchCount;
  if (view === "topics") return 0;
  if (view === "search") return 0;
  if (view === "history") return historyCount;
  return activeGroupCount ?? total;
}
