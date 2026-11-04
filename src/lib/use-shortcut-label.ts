"use client";

import { useEffect, useState } from "react";

/**
 * 快捷键提示按平台显示：Mac 上是 ⌘K，其他平台是 Ctrl K。
 *
 * 服务端/静态导出阶段不知道平台，先给 ⌘K，挂载后再换 —— 与 ThemeToggle 的
 * hydration 守卫同一个思路（首帧只差一个图标/文案，不闪布局）。
 */
export function useShortcutLabel() {
  const [label, setLabel] = useState("⌘K");

  useEffect(() => {
    const platform = navigator.platform || navigator.userAgent;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 平台信息只有挂载后才知道
    if (!/Mac|iPhone|iPad|iPod/i.test(platform)) setLabel("Ctrl K");
  }, []);

  return label;
}
