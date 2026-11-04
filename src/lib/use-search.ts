"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { loadCorpus } from "@/lib/corpus";
import { readRecentSearches, rememberSearch } from "@/lib/recent-searches";
import { parseRoute, type ParsedRoute, type ShellView } from "@/lib/route-state";
import type { LinkItem, TopicSummary } from "@/lib/schema";
import { createSearchIndex, createTopicIndex } from "@/lib/search";
import { pushUrlQuietly, replaceUrlQuietly } from "@/lib/url";

/**
 * 顶栏搜索的全部状态与副作用（query / 语料 / 结果 / 最近搜索 / 地址栏）。
 * 从 app-shell 抽出来的原因只有一个：外壳已经承载了太多与「搜什么」无关的职责。
 */
export function useShellSearch({
  topics,
  view,
}: {
  topics: TopicSummary[];
  /** 当前页面视图；只在「从 /search/ 清空搜索」时用来决定 push 还是 replace */
  view: ShellView;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [recentExpanded, setRecentExpanded] = React.useState(false);
  const [corpus, setCorpus] = React.useState<LinkItem[] | null>(null);
  const [corpusError, setCorpusError] = React.useState(false);

  // 进入搜索前所在的路径，清空搜索时回到这里
  const originPath = React.useRef("/");
  const trackedOrigin = React.useRef(false);
  // 首帧「URL → state」是否已同步完成。同步之前不许回写地址栏，
  // 否则直链 /search/?q=新闻 会被回写 effect 改写成 /（P0-1 的根因）
  const urlSynced = React.useRef(false);
  // 本次搜索是否已经在历史里留下过一条记录（第一次进入搜索 push，之后只 replace）
  const searchEntryPushed = React.useRef(false);

  const searching = query.trim().length > 0;

  // 最近搜索只存在 localStorage；静态导出没有服务端状态，挂载后读一次
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 挂载边界，静态导出只能客户端读
    setRecentSearches(readRecentSearches());
  }, []);

  const requestCorpus = React.useCallback(() => {
    if (corpus) return;
    loadCorpus()
      .then((items) => {
        setCorpus(items);
        setCorpusError(false);
      })
      .catch(() => setCorpusError(true));
  }, [corpus]);

  React.useEffect(() => {
    if (searching || view === "history") requestCorpus();
  }, [searching, view, requestCorpus]);

  const searchIndex = React.useMemo(() => (corpus ? createSearchIndex(corpus) : null), [corpus]);
  const results = React.useMemo(
    () => (searching && searchIndex ? searchIndex.search(query) : []),
    [searchIndex, query, searching],
  );
  const nearMisses = React.useMemo(
    () => (searching && results.length === 0 && searchIndex ? searchIndex.nearMisses(query) : []),
    [searchIndex, query, searching, results.length],
  );
  const topicIndex = React.useMemo(() => createTopicIndex(topics), [topics]);
  const topicSuggestions = React.useMemo(
    () =>
      searching && results.length === 0
        ? topicIndex.search(query, { limit: 3 }).map((result) => result.item)
        : [],
    [topicIndex, query, searching, results.length],
  );

  // 点搜索框、还没输入、且有历史时展示最近搜索
  const showRecent = searchFocused && !searching && recentSearches.length > 0;

  // 首帧把 URL 上的搜索词读进 state（「URL 是状态」的读侧）。
  // 静态导出没有服务端注入，只能挂载后读一次；urlSynced 同时充当「只跑一次」的守卫。
  // 必须排在「回写地址栏」的 effect 之前：先读后写，直链 /search/?q= 才不会被当成清空。
  React.useEffect(() => {
    if (urlSynced.current) return;
    const route = parseRoute(window.location.pathname, window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 首帧只能从地址栏读这一次
    if (route.query) setQuery(route.query);
    // 直链/刷新进来时这条 URL 本来就在历史里，后续输入只 replace 不再 push
    if (route.isSearch) searchEntryPushed.current = true;
    urlSynced.current = true;
    // 只在挂载时跑一次：urlSynced 同时是守卫，不依赖任何外部值
  }, []);

  // 记录「搜索从哪儿来」：第一次输入时抓一次当前地址
  React.useEffect(() => {
    if (!searching && !window.location.pathname.startsWith("/search")) {
      originPath.current = window.location.pathname + window.location.search;
      trackedOrigin.current = true;
    }
  }, [searching]);

  // 地址栏：只在「搜索中」回写 /search/?q=；清空由 exitSearch 负责。
  // 必须用 replaceUrlQuietly（绕过 Next 的 replaceState patch），否则输入框每打一个字就失焦。
  React.useEffect(() => {
    // 首帧还没读完 URL：这一轮 state 里的 query 还是空串，回写会把它冲掉
    if (!urlSynced.current || !searching) return;
    const target = `/search/?${new URLSearchParams({ q: query.trim() }).toString()}`;
    // 内容相同就不写：首帧读入 query 会再触发一次本 effect，不加判断会多写一次历史记录
    if (window.location.pathname + window.location.search === target) return;
    // 第一次进入搜索用 push：后退能回到来源分类，而不是把来源页替换掉。
    // 之后每打一个字只 replace，否则历史里会堆满「豆」「豆瓣」「豆瓣电」…
    if (!searchEntryPushed.current) {
      pushUrlQuietly(target);
      searchEntryPushed.current = true;
    } else {
      replaceUrlQuietly(target);
    }
  }, [searching, query]);

  // 退出搜索：清空输入，并把地址栏还原到来源页。
  // 放在事件回调里而不是 effect 里——StrictMode 会把挂载时的 effect 连跑两遍，
  // 靠 ref 标记「首轮跳过」并不成立；「用户清空了」只有从交互入口才能确定。
  const exitSearch = React.useCallback(() => {
    searchEntryPushed.current = false;
    setQuery("");
    if (!window.location.pathname.startsWith("/search")) return;
    const back = trackedOrigin.current ? originPath.current : "/";
    // 直接打开 /search/?q= 时，页面本身就是搜索视图；只 replace URL 会留下
    // 「地址是 /、内容还是搜索空态」的错位，必须真正导航回首页。
    if (view === "search") router.push(back);
    else replaceUrlQuietly(back);
  }, [router, view]);

  /** 浏览器前进/后退：把地址栏重新读成 state（与首帧读 URL 用同一个解析器） */
  const applyRoute = React.useCallback((route: ParsedRoute) => {
    // 后退/前进到搜索页：把 q 读回来；离开搜索页则清空，即「退出搜索态」
    setQuery(route.query);
    // 搜索页这条 URL 已经在历史里了，之后打字只 replace
    if (route.isSearch) searchEntryPushed.current = true;
  }, []);

  /** 点开搜索结果时把这次搜索记进「最近搜索」 */
  const rememberQuery = React.useCallback(() => {
    setRecentSearches(rememberSearch(query));
  }, [query]);

  return {
    inputRef,
    query,
    setQuery,
    searching,
    searchFocused,
    setSearchFocused,
    recentSearches,
    setRecentSearches,
    recentExpanded,
    setRecentExpanded,
    showRecent,
    corpus,
    corpusError,
    requestCorpus,
    results,
    nearMisses,
    topicSuggestions,
    exitSearch,
    applyRoute,
    rememberQuery,
  };
}
