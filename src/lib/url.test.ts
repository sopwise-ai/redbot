// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";

import { pushUrlQuietly, replaceUrlQuietly } from "@/lib/url";

describe("replaceUrlQuietly", () => {
  it("调用原生 replaceState 并带上 __NA 标记（绕过 Next 的 patch）", () => {
    const native = vi.fn();
    const original = History.prototype.replaceState;
    // 模拟 Next patch：无 __NA 时 dispatch，有 __NA 时转发原生
    window.history.replaceState = function patched(data, _unused, url) {
      if ((data as { __NA?: boolean } | null)?.__NA) return native(data, _unused, url);
      throw new Error("should not dispatch ACTION_RESTORE");
    };
    try {
      replaceUrlQuietly("/search/?q=%E5%BE%AE");
      expect(native).toHaveBeenCalledTimes(1);
      const [data, , url] = native.mock.calls[0];
      expect((data as { __NA: boolean }).__NA).toBe(true);
      expect(url).toBe("/search/?q=%E5%BE%AE");
    } finally {
      window.history.replaceState = original;
    }
  });

  it("真实 happy-dom history 上也能正常执行（不抛错）", () => {
    expect(() => replaceUrlQuietly("/")).not.toThrow();
    expect(window.location.pathname).toBe("/");
  });

  it("派发 redbot:replacestate 自定义事件（供焦点管理等联动使用）", () => {
    const events: string[] = [];
    const onReplace = (event: Event) => {
      events.push((event as CustomEvent<{ url: string }>).detail.url);
    };
    window.addEventListener("redbot:replacestate", onReplace);
    try {
      replaceUrlQuietly("/topics/news/");
      expect(events).toEqual(["/topics/news/"]);
    } finally {
      window.removeEventListener("redbot:replacestate", onReplace);
    }
  });
});

describe("pushUrlQuietly", () => {
  it("带 __NA 标记走原生 pushState（历史长度 +1）", () => {
    const native = vi.fn();
    const original = History.prototype.pushState;
    window.history.pushState = function patched(data, _unused, url) {
      if ((data as { __NA?: boolean } | null)?.__NA) return native(data, _unused, url);
      throw new Error("should not dispatch ACTION_RESTORE");
    };
    try {
      pushUrlQuietly("/search/?q=x");
      expect(native).toHaveBeenCalledTimes(1);
      expect(native.mock.calls[0][2]).toBe("/search/?q=x");
    } finally {
      window.history.pushState = original;
    }
  });

  it("在真实 history 上新增条目，且不派发焦点事件", () => {
    const before = window.history.length;
    const events: string[] = [];
    const onReplace = () => events.push("fired");
    window.addEventListener("redbot:replacestate", onReplace);
    try {
      pushUrlQuietly("/history/");
      expect(window.location.pathname).toBe("/history/");
      expect(window.history.length).toBe(before + 1);
      // 打字时不能抢焦点：push 不该触发那套监听
      expect(events).toEqual([]);
    } finally {
      window.removeEventListener("redbot:replacestate", onReplace);
    }
  });
});
