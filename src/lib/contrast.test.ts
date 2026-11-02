import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { contrastRatio, oklchToSrgb, parseOklch, relativeLuminance } from "@/lib/contrast";

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** 从 globals.css 里取某个 token 的值（只取第一次出现，即 :root 浅色那组） */
function token(name: string, occurrence = 0): string {
  const matches = [...CSS.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, "g"))];
  const raw = matches[occurrence]?.[1];
  if (!raw) throw new Error(`token --${name} #${occurrence} not found`);
  return raw.trim();
}

describe("parseOklch", () => {
  it("解析普通写法", () => {
    expect(parseOklch("oklch(0.52 0.006 264)")).toEqual({ l: 0.52, c: 0.006, h: 264 });
  });

  it("解析带百分号与 deg 的写法", () => {
    // L 带 % → 除以 100；C 不带 % → 原值；deg 后缀忽略
    expect(parseOklch("oklch(98.5% 0.0015 264deg)")).toEqual({ l: 0.985, c: 0.0015, h: 264 });
  });

  it("彩度带百分号按 100% = 0.4 换算（CSS Color 4 的参考范围）", () => {
    expect(parseOklch("oklch(50% 25% 264)")).toEqual({ l: 0.5, c: 0.1, h: 264 });
  });

  it("非 oklch 返回 null", () => {
    expect(parseOklch("#fff")).toBeNull();
  });
});

describe("色彩转换", () => {
  it("白色最亮、黑色最暗", () => {
    const white = relativeLuminance(oklchToSrgb({ l: 1, c: 0, h: 0 }));
    const black = relativeLuminance(oklchToSrgb({ l: 0, c: 0, h: 0 }));
    expect(white).toBeCloseTo(1, 3);
    expect(black).toBeCloseTo(0, 3);
  });

  it("纯色的转换结果落在 0–1 内", () => {
    for (const color of [
      { l: 0.52, c: 0.2, h: 30 },
      { l: 0.7, c: 0.15, h: 150 },
      { l: 0.3, c: 0.12, h: 260 },
    ]) {
      for (const channel of oklchToSrgb(color)) {
        expect(channel).toBeGreaterThanOrEqual(-0.01);
        expect(channel).toBeLessThanOrEqual(1.01);
      }
    }
  });

  it("黑底白字是 21:1", () => {
    const ratio = contrastRatio({ l: 0, c: 0, h: 0 }, { l: 1, c: 0, h: 0 });
    expect(ratio).toBeCloseTo(21, 1);
  });

  it("同色对比度是 1:1", () => {
    const gray = { l: 0.5, c: 0, h: 0 };
    expect(contrastRatio(gray, gray)).toBeCloseTo(1, 5);
  });

  it("alpha 会拉低对比度（这正是 /40 的病因）", () => {
    const bg = { l: 0.985, c: 0.0015, h: 264 };
    const fg = { l: 0.52, c: 0.006, h: 264 };
    const solid = contrastRatio(bg, fg);
    const faded = contrastRatio(bg, fg, 0.4);
    expect(faded).toBeLessThan(solid);
    expect(faded).toBeLessThan(3);
  });
});

/**
 * 项目自定的下限（PRODUCT-DESIGN §9）：正文与辅助文字都要 ≥ 4.5:1。
 * 这里锁的是「实色 muted-foreground」在三种常见底上的表现——
 * 只要有人把 `/40 /50 /60` 加回来，这条断言就会失败。
 */
describe("muted-foreground 对比度下限（4.5:1）", () => {
  const backgrounds = ["background", "card", "sidebar"] as const;

  for (const [index, label] of ["浅色", "深色"].entries()) {
    for (const bgName of backgrounds) {
      it(`${label}：muted-foreground / ${bgName} ≥ 4.5`, () => {
        const bg = parseOklch(token(bgName, index));
        const fg = parseOklch(token("muted-foreground", index));
        expect(bg).not.toBeNull();
        expect(fg).not.toBeNull();
        const ratio = contrastRatio(bg!, fg!);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it("浅色：带 /60 透明度会跌破 3:1（反例，解释为什么要去后缀）", () => {
    const bg = parseOklch(token("background", 0))!;
    const fg = parseOklch(token("muted-foreground", 0))!;
    expect(contrastRatio(bg, fg, 0.6)).toBeLessThan(3);
  });
});
