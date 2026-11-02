/**
 * 从 data/ 生成 README.md。
 * README 是「同一份数据的另一种渲染」，因此永远不需要手工同步。
 *
 * 渲染逻辑在 scripts/lib/readme.ts（纯函数，有单元测试），这里只负责读写。
 *
 * 用法：
 *   tsx scripts/generate-readme.ts            # 写入 README.md
 *   tsx scripts/generate-readme.ts --check    # 只检查是否与数据一致，不一致就退出 1
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { mergeTopics } from "../src/lib/merge-topics";
import { LIMITS } from "../src/lib/schema";
import { site } from "../src/lib/site";
import { loadTopics } from "./lib/load-topics";
import { buildReadme } from "./lib/readme";

const dataDir = fileURLToPath(new URL("../data", import.meta.url));
const root = new URL("../", import.meta.url);

const { entries, errors } = loadTopics(dataDir);
if (errors.length > 0) {
  console.error(`✗ 数据文件有问题（${errors.length} 处）：`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const merged = mergeTopics(entries);
const catalog = { updated: merged.updated, links: merged.links };
const categories = merged.categories;

const readme = buildReadme({
  catalog,
  categories,
  site,
  limits: { perCategory: LIMITS.perCategory },
});

const target = new URL("README.md", root);
const check = process.argv.includes("--check");

if (!check) {
  writeFileSync(target, readme, "utf8");
  console.log(`✓ README.md 已生成：${catalog.links.length} 条链接 / ${categories.length} 个主题`);
} else {
  const current = readFileSync(target, "utf8");
  if (current === readme) {
    console.log("✓ README.md 与数据一致");
  } else {
    // 只打印首个差异位置：整篇 diff 在 CI 日志里没有价值
    const at = [...current].findIndex((char, index) => char !== readme[index]);
    console.error("✗ README.md 与 data/ 不一致，跑一次 `npm run readme` 再提交。");
    console.error(`  首个差异在第 ${at + 1} 个字符附近：`);
    console.error(`  当前：${JSON.stringify(current.slice(at, at + 60))}`);
    console.error(`  应为：${JSON.stringify(readme.slice(at, at + 60))}`);
    process.exit(1);
  }
}
