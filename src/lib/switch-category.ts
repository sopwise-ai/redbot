import { flushSync } from "react-dom";

/**
 * 分类切换的执行策略，纯函数、可单测：
 * 决定「直接 setState」还是「View Transitions 包一层」，以及副作用顺序。
 *
 * 顺序约定（AGENTS.md）：scrollTo(0) 必须在 startViewTransition **之前**，
 * 否则两张快照的滚动位置不同，过渡会产生位移。
 */

/** DOM 环境的最小接口：让测试可以注入假的 document/window */
export interface TransitionEnv {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  scrollTo: (options: { top: number }) => void;
  prefersReducedMotion: boolean;
  setTag: (slug: string) => void;
}

/** 把 next 应用到界面的动作：由调用方（React 组件）提供 */
export interface ApplyOptions {
  next: string;
  env: TransitionEnv;
  apply: (next: string) => void;
}

export function applyCategorySwitch({ next, env, apply }: ApplyOptions) {
  env.scrollTo({ top: 0 });
  env.setTag(next);
  if (!env.startViewTransition || env.prefersReducedMotion) {
    apply(next);
    return;
  }
  env.startViewTransition(() => {
    flushSync(() => apply(next));
  });
}

/** 从 window/document 提取 TransitionEnv（组件里用，测试里换成手造的 env） */
export function envFromWindow(
  win: Window & typeof globalThis,
  setTag: (slug: string) => void,
): TransitionEnv {
  const doc = win.document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  };
  return {
    startViewTransition: doc.startViewTransition?.bind(doc),
    scrollTo: (options) => win.scrollTo(options),
    prefersReducedMotion: win.matchMedia("(prefers-reduced-motion: reduce)").matches,
    setTag,
  };
}
