"use client";

import * as React from "react";

/**
 * 侧栏开合的 cookie（由 ui/sidebar.tsx 写入，layout.tsx 的内联脚本也读它）。
 * 只有「展开 / 折叠」一个布尔，不含任何身份信息。
 */
export function isSidebarCollapsed(cookie: string) {
  return /(?:^|;\s*)sidebar_state=false/.test(cookie);
}

/**
 * 侧栏开合：cookie 由 SidebarProvider 负责写，这里负责读回来。
 *
 * 首帧就按 cookie 决定：layout.tsx 的 body 末尾脚本已经把侧栏 DOM 改成折叠态，
 * 这里读同一个 cookie，React 首帧与 DOM 一致，既不会 mismatch 也不会先画成展开。
 */
export function useSidebarOpen() {
  const [sidebarOpen, setSidebarOpen] = React.useState(() =>
    typeof document === "undefined" ? true : !isSidebarCollapsed(document.cookie),
  );

  // 侧栏已经按真实状态画完一帧，撤掉首屏防闪标记（layout.tsx 里打的）
  React.useEffect(() => {
    const id = requestAnimationFrame(() =>
      document.documentElement.removeAttribute("data-sidebar"),
    );
    return () => cancelAnimationFrame(id);
  }, [sidebarOpen]);

  return [sidebarOpen, setSidebarOpen] as const;
}
