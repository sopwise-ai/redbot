"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/** 「上一次看过的路径」，用来区分刷新与 SPA 导航 */
const LAST_PATH_KEY = "redbot:last-path";

/**
 * 全站焦点交接：skip link、路由切换后把焦点交给 main、Next 路由段 DIV 的兜底。
 *
 * 这几段逻辑互相关联（都围绕「焦点现在在谁身上」），拆到别处反而要靠注释同步；
 * 集中在一个 hook 里，至少让 app-shell 的渲染部分只关心页面内容。
 */
export function useFocusHandoff(inputRef: React.RefObject<HTMLInputElement | null>) {
  const pathname = usePathname();
  const [skipReady, setSkipReady] = React.useState(false);

  // skip link 平时不挂载：否则导航后的焦点会落到它身上，把它点亮。
  // 触发条件：焦点还在 body（页面刚加载、用户还没交互）时按下第一次 Tab。
  // Tab 的默认行为与本监听同帧发生：setSkipReady 触发的渲染要等 React 提交，
  // 元素挂载后再抢回焦点，所以这里用两帧 rAF（一帧等提交，一帧等布局稳定）。
  React.useEffect(() => {
    function onFirstTab(event: KeyboardEvent) {
      if (event.key !== "Tab" || event.shiftKey) return;
      if (document.activeElement !== document.body) return;
      setSkipReady(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.getElementById("skip-link")?.focus()),
      );
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // 焦点若已移出 skip link（比如用户按 Shift+Tab 走了），留给全局 Esc 逻辑
      if (document.activeElement === document.getElementById("skip-link")) {
        setSkipReady(false);
        document.body.focus();
      }
    }
    window.addEventListener("keydown", onFirstTab, true);
    window.addEventListener("keydown", onEscape, true);
    return () => {
      window.removeEventListener("keydown", onFirstTab, true);
      window.removeEventListener("keydown", onEscape, true);
    };
  }, []);

  // 路由切换后把焦点交给主区域：否则焦点会停在 skip link 上，把它「点亮」成可见元素。
  // 触发源：popstate 与 replaceUrlQuietly（派发 redbot:replacestate）。
  React.useEffect(() => {
    function handFocusToContent() {
      window.setTimeout(() => {
        const active = document.activeElement;
        // 输入框持有焦点时不动它：搜索中每打一个字都会 replaceUrlQuietly，
        // 抢焦点会打断输入（见 replaceUrlQuietly 的注释）。
        if (active === inputRef.current) return;
        const el = document.getElementById("content");
        if (!el || active === el) return;
        el.focus({ preventScroll: true });
      }, 0);
    }
    window.addEventListener("redbot:replacestate", handFocusToContent);
    window.addEventListener("popstate", handFocusToContent);
    return () => {
      window.removeEventListener("redbot:replacestate", handFocusToContent);
      window.removeEventListener("popstate", handFocusToContent);
    };
  }, [inputRef]);

  // usePathname 变化＝客户端导航完成。用 sessionStorage 的「上次路径」做基准：
  // - 直开/新 tab：无基准 → 不动焦点（保持浏览器默认）；
  // - 刷新：基准 === 当前路径 → 不动；
  // - SPA 导航（含跨视图重挂 AppShell）：基准 ≠ 当前路径 → 把焦点交给主区域。
  React.useEffect(() => {
    const last = window.sessionStorage.getItem(LAST_PATH_KEY);
    const isNavigation = last !== null && last !== pathname;
    window.sessionStorage.setItem(LAST_PATH_KEY, pathname);
    if (!isNavigation) return;
    const id = window.setTimeout(() => {
      if (document.activeElement === inputRef.current) return;
      document.getElementById("content")?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname, inputRef]);

  // Next 客户端导航后，焦点会被 handlePotentialScroll 移到路由段 DIV 上（无 id 的普通 div）。
  // 用 focusin 捕获：焦点落到「非交互的裸 DIV」且不在 main#content 里时，交给 main。
  React.useEffect(() => {
    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      // 只处理「Next 路由段 DIV」：无 id、无 role、无 tabindex、无交互语义
      if (target.tagName !== "DIV") return;
      if (target.id || target.getAttribute("role") || target.tabIndex >= 0) return;
      if (document.activeElement === inputRef.current) return;
      const main = document.getElementById("content");
      if (!main || main.contains(target)) return;
      // 延后一帧，避免与 React 的 DOM 操作竞争
      window.setTimeout(() => {
        if (document.activeElement === target) {
          main.focus({ preventScroll: true });
        }
      }, 0);
    }
    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, [inputRef]);

  // 滚动锁兜底：移动端抽屉关闭时，Radix 依赖 exit 动画的 animationend 卸载
  // react-remove-scroll（body[data-scroll-locked]）。动画被打断或渲染挂起时该回调可能丢失，
  // 锁就残留在 body 上，页面再也滚不动。
  React.useEffect(() => {
    function releaseStaleScrollLock() {
      window.setTimeout(() => {
        const body = document.body;
        if (!body.hasAttribute("data-scroll-locked")) return;
        if (document.querySelector('[role="dialog"][data-state="open"]')) return; // 锁是正当的
        body.removeAttribute("data-scroll-locked");
        body.classList.remove(
          "with-scroll-bars-hidden",
          "right-scroll-bar-position",
          "width-before-scroll-bar",
        );
      }, 50);
    }
    window.addEventListener("popstate", releaseStaleScrollLock);
    window.addEventListener("redbot:replacestate", releaseStaleScrollLock);
    return () => {
      window.removeEventListener("popstate", releaseStaleScrollLock);
      window.removeEventListener("redbot:replacestate", releaseStaleScrollLock);
    };
  }, []);

  const dismissSkipLink = React.useCallback(() => setSkipReady(false), []);

  return { skipReady, dismissSkipLink };
}
