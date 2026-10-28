import { LIMITS } from "../../src/lib/schema";
import type { Catalog, Category } from "../../src/lib/schema";

export interface CheckResult {
  /** 阻断构建的问题 */
  errors: string[];
  /** 只提示、不阻断的问题 */
  warnings: string[];
  /** 指向站点首页的条目（历史遗留，单独统计） */
  homepageLinks: string[];
  /** 每个分类的实际条目数 */
  perCategory: Map<string, number>;
}

/**
 * 纯函数形式的数据规则校验：不读文件、不打印、不退出进程。
 * CLI（scripts/validate.ts）与单元测试共用这一份实现 —— 规则只写一遍。
 */
export function checkData(
  catalog: Catalog,
  categories: Category[],
  limits: { perCategory: number; categories: number; subtags: readonly string[] } = LIMITS,
): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const homepageLinks: string[] = [];
  const perCategory = new Map<string, number>();

  const labels = new Set(categories.map((category) => category.label));
  const subtags = new Set<string>(limits.subtags);

  // ── 唯一性 ──────────────────────────────────────────────
  const seenId = new Map<string, string>();
  const seenUrl = new Map<string, string>();
  const seenName = new Map<string, string>();

  for (const link of catalog.links) {
    if (seenId.has(link.id)) {
      errors.push(`id 重复：「${link.id}」（${seenId.get(link.id)} 与 ${link.name}）`);
    } else {
      seenId.set(link.id, link.name);
    }

    const normalized = normalizeUrl(link.url);
    if (seenUrl.has(normalized)) {
      errors.push(`URL 重复：「${link.name}」与「${seenUrl.get(normalized)}」`);
    } else {
      seenUrl.set(normalized, link.name);
    }

    const nameKey = link.name.toLowerCase().replace(/\s+/g, "");
    if (seenName.has(nameKey)) {
      errors.push(`名称重复：「${link.name}」与「${seenName.get(nameKey)}」`);
    } else {
      seenName.set(nameKey, link.name);
    }
  }

  // ── 分类与标签 ──────────────────────────────────────────
  for (const link of catalog.links) {
    const [primary, ...rest] = link.tags;

    if (!labels.has(primary)) {
      errors.push(`「${link.name}」的主分类「${primary}」不在 categories.json 中`);
    } else {
      perCategory.set(primary, (perCategory.get(primary) ?? 0) + 1);
    }

    for (const tag of rest) {
      if (!subtags.has(tag)) {
        errors.push(
          `「${link.name}」使用了未登记的副标签「${tag}」，请先在 schema.ts 的 LIMITS.subtags 中登记`,
        );
      }
    }
  }

  // ── 配额 ────────────────────────────────────────────────
  if (categories.length > limits.categories) {
    errors.push(`分类过多：${categories.length} 个，上限 ${limits.categories} 个`);
  }

  for (const category of categories) {
    const count = perCategory.get(category.label) ?? 0;
    if (count === 0) errors.push(`分类「${category.label}」没有任何条目`);
    if (count > limits.perCategory) {
      errors.push(
        `分类「${category.label}」有 ${count} 条，超过上限 ${limits.perCategory} 条 —— 请先下架旧的，再加新的`,
      );
    }
  }

  // ── 质量提醒（不阻断构建）──────────────────────────────
  for (const link of catalog.links) {
    if (!link.url.startsWith("https://")) errors.push(`「${link.name}」不是 https`);

    const url = new URL(link.url);
    if (url.pathname === "/" || url.pathname === "") homepageLinks.push(link.name);

    if (link.name.length > 12) {
      warnings.push(`「${link.name}」名称偏长（${link.name.length} 字符），按钮里会被截断`);
    }
  }

  return { errors, warnings, homepageLinks, perCategory };
}

/** 归一化 URL：去掉 www、末尾斜杠与协议差异，用于查重。 */
export function normalizeUrl(raw: string): string {
  const url = new URL(raw);
  const host = url.host.replace(/^www\./, "").toLowerCase();
  const path = url.pathname.replace(/\/+$/, "");
  return `${host}${path}${url.search}`;
}
