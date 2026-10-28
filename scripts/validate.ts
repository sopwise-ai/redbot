/**
 * 数据校验 CLI：站点构建前 + CI 中执行。
 * 目标是把「审核 PR 的人肉成本」压到最低 —— 机器能判断的，绝不让人看。
 *
 * 规则本身在 scripts/lib/checks.ts（纯函数，有单元测试），这里只负责读写与输出。
 *
 * 用法：
 *   tsx scripts/validate.ts                 # 结构与规则校验
 *   tsx scripts/validate.ts --check-links   # 额外探测每个 URL 是否可达（较慢）
 */
import { readFileSync } from "node:fs";

import { categoriesSchema, catalogSchema } from "../src/lib/schema";
import { checkData } from "./lib/checks";

const root = new URL("../", import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf8"));

const checkLinks = process.argv.includes("--check-links");

const catalogResult = catalogSchema.safeParse(readJson("data/links.json"));
const categoriesResult = categoriesSchema.safeParse(readJson("data/categories.json"));

if (!catalogResult.success) {
  console.error("✗ data/links.json 结构不合法：");
  for (const issue of catalogResult.error.issues) {
    console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}
if (!categoriesResult.success) {
  console.error("✗ data/categories.json 结构不合法：");
  for (const issue of categoriesResult.error.issues) {
    console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

const catalog = catalogResult.data;
const categories = categoriesResult.data;
const { errors, warnings, homepageLinks, perCategory } = checkData(catalog, categories);

// ── 链接可达性（可选）────────────────────────────────────
async function probe(url: string) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 RedBot-LinkCheck",
      },
    });
    await response.body?.cancel();
    return { status: response.status, ok: response.status < 400 };
  } catch (error) {
    return { status: 0, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function runLinkCheck() {
  const queue = [...catalog.links];
  const dead: string[] = [];
  const concurrency = 8;

  async function worker() {
    for (;;) {
      const link = queue.shift();
      if (!link) return;
      const result = await probe(link.url);
      if (!result.ok) dead.push(`${link.name} (${link.url}) → ${result.status || result.error}`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return dead;
}

// ── 输出 ─────────────────────────────────────────────────
console.log("RedBot 数据校验");
console.log(
  `  ${catalog.links.length} 条链接 / ${categories.length} 个分类 / ${new Set(catalog.links.flatMap((l) => l.tags.slice(1))).size} 个副标签`,
);
console.log(
  "  " +
    categories
      .map((category) => `${category.label} ${perCategory.get(category.label) ?? 0}`)
      .join(" · "),
);

if (warnings.length > 0) {
  console.log(`\n⚠ ${warnings.length} 条提醒：`);
  for (const warning of warnings) console.log(`  - ${warning}`);
}

if (homepageLinks.length > 0) {
  const preview = homepageLinks.slice(0, 6).join("、");
  console.log(
    `\n⚠ ${homepageLinks.length} 条仍指向站点首页（历史遗留）：${preview}${
      homepageLinks.length > 6 ? " 等" : ""
    }`,
  );
  console.log("  新增提交请指向具体的榜单 / 快讯 / 列表页，见 CONTRIBUTING.md");
}

if (errors.length > 0) {
  console.error(`\n✗ ${errors.length} 个错误：`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

if (checkLinks) {
  console.log("\n正在探测链接可达性（可能需要一分钟）…");
  runLinkCheck().then((dead) => {
    if (dead.length > 0) {
      console.error(`\n✗ ${dead.length} 个链接不可达：`);
      for (const item of dead) console.error(`  - ${item}`);
      process.exit(1);
    }
    console.log("✓ 全部链接可达");
    console.log("\n✓ 校验通过");
  });
} else {
  console.log("\n✓ 校验通过");
}
