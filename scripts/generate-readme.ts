/**
 * 从 data/ 生成 README.md。
 * README 是「同一份数据的另一种渲染」，因此永远不需要手工同步。
 *
 * 渲染逻辑在 scripts/lib/readme.ts（纯函数，有单元测试），这里只负责读写。
 *
 * 用法：tsx scripts/generate-readme.ts
 */
import { readFileSync, writeFileSync } from "node:fs";

import { categoriesSchema, catalogSchema, LIMITS } from "../src/lib/schema";
import { site } from "../src/lib/site";
import { buildReadme } from "./lib/readme";

const root = new URL("../", import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf8"));

const catalog = catalogSchema.parse(readJson("data/links.json"));
const categories = categoriesSchema.parse(readJson("data/categories.json"));

const readme = buildReadme({
  catalog,
  categories,
  site,
  limits: { perCategory: LIMITS.perCategory },
});

writeFileSync(new URL("README.md", root), readme, "utf8");
console.log(`✓ README.md 已生成：${catalog.links.length} 条链接 / ${categories.length} 个分类`);
