/**
 * 静默改地址栏：绕过 Next.js App Router 对 history.replaceState 的 patch。
 *
 * 为什么不能用 window.history.replaceState：
 * Next.js 15 的 app-router.js 会 patch 它——每次调用都 dispatch
 * ACTION_RESTORE，router state 变化触发 <LayoutRouter> 的
 * handlePotentialScroll，把焦点抢到路由段节点（<main id="content">）上。
 * 后果：搜索框里每打一个字，地址栏变一次 URL，输入就失焦一次。
 *
 * patch 的实现（next/dist/client/components/app-router.js）：
 *   if (data?.__NA || data?._N) return originalReplaceState(...)  // 直接走原函数
 * 也就是说，data 里带上 __NA 标记即可完全绕开 dispatch。
 * （Next 自身的导航也是这样短路自己的 patch 的。）
 *
 * 副作用：usePathname/useSearchParams 不会感知这次 URL 变化。
 * 对本项目无影响——外壳不读这两个 hook 的值来渲染搜索状态，
 * URL 只是给用户复制/刷新用的展示层（刷新由服务端渲染正确分类）。
 */
export function replaceUrlQuietly(url: string) {
  // __NA 是 Next 内部「原生导航」标记；_N 是 pages router 的等价标记。
  // 带上它：patch 短路 → 原 History.prototype.replaceState 直接执行。
  window.history.replaceState({ __NA: true, _N: true } as never, "", url);
  // 自定义事件：usePathname 不感知这次变化，需要联动的地方（路由后焦点管理）靠它。
  // 注意 dispatchEvent 不会触发 Next 的 patch（那是 history 方法级别的拦截）。
  window.dispatchEvent(new CustomEvent("redbot:replacestate", { detail: { url } }));
}
