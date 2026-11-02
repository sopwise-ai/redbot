/**
 * WCAG 2.1 对比度计算的纯函数实现。
 *
 * 为什么自己算而不用第三方库：只需要「oklch → sRGB → 相对亮度 → 比值」四步，
 * 引入 colorjs.io 这类库会给构建加几十 KB，而这个文件只有构建期与单测用它。
 *
 * 为什么要测「带透明度的文字」：项目里辅助文字一度写成
 * `text-muted-foreground/40`——CSS 的 alpha 合成会让前景色向背景靠拢，
 * 实测浅色下只有 1.75:1，远低于 PRODUCT-DESIGN 自定的 4.5:1。
 * 单测把这条锁住，避免以后再随手加 `/50`。
 */

export interface Oklch {
  /** 亮度 0–1 */
  l: number;
  /** 彩度 */
  c: number;
  /** 色相角（度） */
  h: number;
}

export type Rgb = readonly [number, number, number];

const OKLCH_RE = /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*\)$/i;

/** 解析 `oklch(L C H)`；L/C 可带百分号（按 100% = 1 处理） */
export function parseOklch(css: string): Oklch | null {
  const match = OKLCH_RE.exec(css.trim());
  if (!match) return null;
  const read = (raw: string, scale: number) =>
    raw.endsWith("%") ? (parseFloat(raw) / 100) * scale : parseFloat(raw);
  return {
    l: read(match[1], 1),
    c: read(match[2], 0.4),
    h: parseFloat(match[3]),
  };
}

/** oklch → sRGB（gamma 编码，0–1；未截断，便于发现越界） */
export function oklchToSrgb({ l, c, h }: Oklch): Rgb {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = lPrime ** 3;
  const m3 = mPrime ** 3;
  const s3 = sPrime ** 3;

  const linearToSrgb = (value: number) =>
    value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;

  return [
    linearToSrgb(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    linearToSrgb(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    linearToSrgb(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  ];
}

/** sRGB 分量线性化（WCAG 定义，与 gamma 解码是同一条曲线） */
function linearize(channel: number) {
  const clamped = Math.min(1, Math.max(0, channel));
  return clamped <= 0.04045 ? clamped / 12.92 : ((clamped + 0.055) / 1.055) ** 2.4;
}

/** WCAG 相对亮度 */
export function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * 带 alpha 的前景叠在背景上的实际颜色。
 * CSS 在 **sRGB（gamma 编码）空间**做 alpha 合成，不是线性空间——顺序错了比值会偏。
 */
export function composite(fg: Oklch, alpha: number, bg: Oklch): Rgb {
  const [fr, fg_, fb] = oklchToSrgb(fg);
  const [br, bg_, bb] = oklchToSrgb(bg);
  const mix = (f: number, b: number) => f * alpha + b * (1 - alpha);
  return [mix(fr, br), mix(fg_, bg_), mix(fb, bb)];
}

/** 两色的 WCAG 对比度（1–21）。`alpha` 是前景透明度，默认不透明 */
export function contrastRatio(bg: Oklch, fg: Oklch, alpha = 1): number {
  const fgRgb = alpha >= 1 ? oklchToSrgb(fg) : composite(fg, alpha, bg);
  const bgRgb = oklchToSrgb(bg);
  const a = relativeLuminance(fgRgb);
  const b = relativeLuminance(bgRgb);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}
