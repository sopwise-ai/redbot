// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";

import { applyCategorySwitch, type TransitionEnv } from "@/lib/switch-category";

function makeEnv(overrides: Partial<TransitionEnv> = {}): TransitionEnv {
  return {
    scrollTo: vi.fn(),
    setTag: vi.fn(),
    prefersReducedMotion: false,
    ...overrides,
  };
}

describe("applyCategorySwitch", () => {
  it("先 scrollTo(0) 再 setTag 再应用（顺序即约定）", () => {
    const calls: string[] = [];
    const env = makeEnv({
      scrollTo: () => calls.push("scroll"),
      setTag: () => calls.push("tag"),
    });
    applyCategorySwitch({
      next: "news",
      env,
      apply: (next) => calls.push(`apply:${next}`),
    });
    // 不支持 View Transitions 的环境：直接应用，顺序 scroll → tag → apply
    expect(calls).toEqual(["scroll", "tag", "apply:news"]);
  });

  it("不支持 startViewTransition 时直接同步应用", () => {
    const env = makeEnv();
    const apply = vi.fn();
    applyCategorySwitch({ next: "tech", env, apply });
    expect(apply).toHaveBeenCalledWith("tech");
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it("用户开启减弱动效时跳过 View Transitions", () => {
    const startViewTransition = vi.fn();
    const env = makeEnv({ startViewTransition, prefersReducedMotion: true });
    const apply = vi.fn();
    applyCategorySwitch({ next: "tech", env, apply });
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(apply).toHaveBeenCalledWith("tech");
  });

  it("支持且未减弱动效时用 startViewTransition 包一层", () => {
    const startViewTransition = vi.fn((cb: () => void) => {
      cb(); // happy-dom 没有 flushSync 兼容问题，回调立即执行
      return { finished: Promise.resolve() };
    });
    const env = makeEnv({ startViewTransition });
    const apply = vi.fn();
    applyCategorySwitch({ next: "ai", env, apply });
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith("ai");
  });

  it("scrollTo 在 startViewTransition 之前（快照位移防线）", () => {
    const order: string[] = [];
    const startViewTransition = vi.fn((cb: () => void) => {
      order.push("transition-start");
      cb();
      return { finished: Promise.resolve() };
    });
    const env = makeEnv({
      startViewTransition,
      scrollTo: () => order.push("scroll"),
    });
    applyCategorySwitch({ next: "ai", env, apply: () => order.push("apply") });
    expect(order.indexOf("scroll")).toBeLessThan(order.indexOf("transition-start"));
  });
});
