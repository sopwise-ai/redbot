/**
 * 主区域当前展示什么。
 * 放在 lib 而不是 app-shell：head-meta / shell-header 都要用它，
 * 从组件反向 import 会形成「lib → components → lib」的循环依赖。
 */
export type ShellView = "wall" | "topics" | "search" | "history" | "about";

export interface ParsedRoute {
  /** 当前是不是搜索页（`/search/`） */
  isSearch: boolean;
  /** 搜索词；非搜索页、或没有 `q` 参数时为空串 */
  query: string;
}

/**
 * 从地址栏解析搜索状态。
 *
 * 这是「URL 是状态」的**读侧**（写侧在 lib/use-search.ts 的两个 effect 里）。
 * 拆成纯函数的目的是：不读 window、不碰 DOM，可以用单测锁住边界
 * （直链、刷新、后退、URL 编码）。
 *
 * 分类不进这里：路由本身就是分类（`/topics/<slug>/`），页面级导航交给 Next，
 * 不需要再从 URL 解析一遍「当前是哪个主题」。
 *
 * 形状约定：
 * - `/search/?q=新闻` → `{ isSearch: true, query: "新闻" }`
 * - `/topics/tech/`、`/`、`/topics/` → `{ isSearch: false, query: "" }`
 */
export function parseRoute(pathname: string, search: string): ParsedRoute {
  // 只认 `/search/`：`/?q=x`（外站拼错、或旧链接）不该被当成搜索态
  if (!/^\/search\/?$/.test(pathname)) return { isSearch: false, query: "" };
  return { isSearch: true, query: (new URLSearchParams(search).get("q") ?? "").trim() };
}
