/** 全部信息源的分类标识，与 app-shell / category-chips 共用同一个字面量 */
export const ALL = "all";

export interface ParsedRoute {
  /** 当前是不是搜索页（`/search/`） */
  isSearch: boolean;
  /** 搜索词；非搜索页、或没有 `q` 参数时为空串 */
  query: string;
  /** 分类 slug；`/` 与未知 slug 都归到 ALL */
  active: string;
}

/**
 * 从地址栏解析「当前分类」与「搜索词」。
 *
 * 这是「URL 是状态」的**读侧**（写侧在 app-shell 的两个 effect 里）。
 * 拆成纯函数的目的：不读 window、不碰 DOM，可以用单测锁住边界
 * （直链、刷新、后退、未知分类、URL 编码）。
 *
 * 形状约定：
 * - `/search/?q=新闻` → `{ isSearch: true, query: "新闻", active: all }`
 * - `/topics/tech/`   → `{ isSearch: false, query: "", active: "tech" }`
 * - `/`、`/topics/`   → `{ isSearch: false, query: "", active: all }`
 */
export function parseRoute(
  pathname: string,
  search: string,
  slugs: readonly string[],
): ParsedRoute {
  const query = (new URLSearchParams(search).get("q") ?? "").trim();

  if (/^\/search\/?$/.test(pathname)) {
    // 搜索是全站的，没有「当前分类」；侧栏也不该给「全部」加红色高亮
    return { isSearch: true, query, active: ALL };
  }

  const match = /^\/topics\/([a-z0-9-]+)\/?$/.exec(pathname);
  const slug = match?.[1];
  return {
    isSearch: false,
    query: "",
    active: slug && slugs.includes(slug) ? slug : ALL,
  };
}
