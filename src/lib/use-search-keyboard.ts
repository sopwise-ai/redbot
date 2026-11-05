"use client";

import * as React from "react";

/**
 * 顶栏搜索的键盘操作：⌘/Ctrl+K、/、?、Enter、Esc、↑↓。
 *
 * 注意 `isComposing`：中文输入法里按 Enter 是「上屏」、按 Esc 是「取消候选」，
 * 这两下都不能被接管，否则焦点会被抢走、组字被清掉。
 */
export function useSearchKeyboard({
  inputRef,
  query,
  searching,
  exitSearch,
  shortcutsOpen,
  setShortcutsOpen,
  setSearchFocused,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  searching: boolean;
  exitSearch: () => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchFocused: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  React.useEffect(() => {
    function isTyping(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el) return false;
      return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
    }

    function onKeyDown(event: KeyboardEvent) {
      // 输入法组字中（含 Safari 的 keyCode 229）：一律不接管
      if (event.isComposing || event.keyCode === 229) return;

      if (shortcutsOpen) return;

      if (event.key === "/" && !isTyping(event.target) && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      if (event.key === "?" && !isTyping(event.target)) {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      // Enter 只把焦点交给第一个结果：自动打开外链太突然，用户按 Enter 往往只是想
      // 「确定这次输入」，并不想立刻跳到别人家的网站上
      if (event.key === "Enter" && document.activeElement === inputRef.current && searching) {
        const first = document.querySelector<HTMLElement>("[data-search-results] a[href^='http']");
        if (!first) return;
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.key === "Escape" && document.activeElement === inputRef.current) {
        if (query.trim()) exitSearch();
        else setSearchFocused(false);
        return;
      }

      if (!searching) return;
      const links = Array.from(
        document.querySelectorAll<HTMLElement>("[data-search-results] a[href^='http']"),
      );
      if (links.length === 0) return;
      const current = document.activeElement as HTMLElement | null;
      const onInput = current === inputRef.current;
      const onResult = !!current && links.includes(current);
      // 只在「输入框或结果链接」上接管方向键，别抢侧栏/页脚的键盘操作
      if (!onInput && !onResult) return;
      const index = current ? links.indexOf(current) : -1;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (onInput) links[0].focus();
        else (links[index + 1] ?? links[links.length - 1]).focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (index <= 0) inputRef.current?.focus();
        else links[index - 1].focus();
      } else if (event.key === "Escape" && onResult) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searching, shortcutsOpen, query, exitSearch, inputRef, setSearchFocused, setShortcutsOpen]);
}
