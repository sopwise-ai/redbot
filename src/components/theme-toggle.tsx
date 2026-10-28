"use client";

import * as React from "react";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS = [
  { value: "light", label: "浅色", icon: SunIcon },
  { value: "dark", label: "深色", icon: MoonIcon },
  { value: "system", label: "跟随系统", icon: MonitorIcon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // 首帧不知道用户偏好，先渲染一个占位，避免 hydration 不一致
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const current = OPTIONS.find((option) => option.value === theme) ?? OPTIONS[2];
  const CurrentIcon = mounted ? current.icon : MonitorIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`切换主题（当前：${mounted ? current.label : "跟随系统"}）`}
          className="text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <CurrentIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = mounted && theme === option.value;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="gap-2"
            >
              <Icon aria-hidden className="size-3.5 text-muted-foreground" />
              <span>{option.label}</span>
              {active ? <CheckIcon aria-hidden className="ml-auto size-3.5" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
