"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

/**
 * 只跟随系统主题，不提供切换器 —— 少一个控件，就少一份维护。
 * 用 next-themes 而不是手写 media query，是为了让 shadcn 的 `dark:` 变体正常工作。
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
