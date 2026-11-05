"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

/**
 * 主题：浅色 / 深色 / 跟随系统三态，切换器在 theme-toggle.tsx。
 * 用 next-themes 而不是手写 media query，是为了让 shadcn 的 `dark:` 变体正常工作，
 * 并复用它注入的防闪脚本（首帧不闪白）。
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
