/**
 * 生成浏览器的搜索/足迹语料：public/search-corpus.json。
 * 只在构建期生成，不进版本库；数据一变重新生成。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { mergeTopics } from "../src/lib/merge-topics";
import { loadTopics } from "./lib/load-topics";

const dataDir = fileURLToPath(new URL("../data", import.meta.url));
const outFile = fileURLToPath(new URL("../public/search-corpus.json", import.meta.url));

const { entries, errors } = loadTopics(dataDir);
if (errors.length > 0) {
  console.error(`✗ 数据文件有问题（${errors.length} 处）：`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const { links } = mergeTopics(entries);
mkdirSync(fileURLToPath(new URL("../public", import.meta.url)), { recursive: true });
writeFileSync(outFile, JSON.stringify(links), "utf8");
console.log(`✓ 搜索语料：${links.length} 条 → public/search-corpus.json`);
