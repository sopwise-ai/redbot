/**
 * 数据概览：给维护者看的一次性统计，不写文件、不联网。
 * 用法：npm run stats
 */
import { fileURLToPath } from "node:url";

import { mergeTopics } from "../src/lib/merge-topics";
import { createSearchIndex } from "../src/lib/search";
import { loadTopics } from "./lib/load-topics";

const dataDir = fileURLToPath(new URL("../data", import.meta.url));

const { entries, errors } = loadTopics(dataDir);
if (errors.length > 0) {
  console.error(`✗ 数据文件有问题（${errors.length} 处）：`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const { categories, links, updated } = mergeTopics(entries);

const isHomepage = (url: string) => {
  try {
    const path = new URL(url).pathname;
    return path === "/" || path === "";
  } catch {
    return false;
  }
};

const homepageCount = links.filter((link) => isHomepage(link.url)).length;
const aliasCount = links.filter((link) => (link.aliases?.length ?? 0) > 0).length;
const percent = (value: number, total: number) =>
  total === 0 ? "0%" : `${((value / total) * 100).toFixed(1)}%`;

console.log("RedBot 数据概览");
console.log(`  ${links.length} 条链接 / ${categories.length} 个主题 / 更新于 ${updated}`);
console.log(
  `  首页链接 ${homepageCount} 条（${percent(homepageCount, links.length)}）· 有别名 ${aliasCount} 条（${percent(aliasCount, links.length)}）`,
);
console.log(
  "  " +
    categories
      .map((category) => {
        const count = links.filter((link) => link.tags[0] === category.name).length;
        return `${category.name} ${count}`;
      })
      .join(" · "),
);

const probes = [
  "bilibili",
  "weibo",
  "zhihu",
  "douban",
  "wb",
  "xhs",
  "blbl",
  "36kr",
  "github",
  "hn",
  "zhihu.com",
  "播客",
  "财报",
  "模板",
];
const index = createSearchIndex(links);
const misses = probes.filter((word) => index.search(word).length === 0);
console.log(
  `  搜索测试 ${probes.length - misses.length}/${probes.length} 命中${
    misses.length > 0 ? ` · 未命中：${misses.join("、")}` : ""
  }`,
);
