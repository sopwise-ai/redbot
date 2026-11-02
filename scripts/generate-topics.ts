/**
 * 从 data/ 生成 src/generated/topics.ts —— 主题文件的静态入口。
 *
 * 为什么需要它：Next/TS 只能静态分析 `import`，而「一主题一文件」是运行时才知道的目录结构。
 * 生成静态 import 后，主题 JSON 进入模块图 → dev 改数据可热更新、tsc 可类型检查；
 * 否则只能 fs 读目录，改完数据必须重启 dev server。
 *
 * 用法：
 *   tsx scripts/generate-topics.ts            # 写入 src/generated/topics.ts
 *   tsx scripts/generate-topics.ts --check    # 只检查是否最新，不一致就退出 1
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as prettier from "prettier";

import { checkTopicSet } from "../src/lib/merge-topics";
import { topicsManifestSchema } from "../src/lib/schema";
import { listTopicFiles } from "./lib/load-topics";

const root = fileURLToPath(new URL("../", import.meta.url));
const dataDir = join(root, "data");
const target = join(root, "src", "generated", "topics.ts");

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

async function main() {
  const check = process.argv.includes("--check");

  let manifestRaw: unknown;
  try {
    manifestRaw = JSON.parse(readFileSync(join(dataDir, "topics.json"), "utf8"));
  } catch (error) {
    console.error(`✗ data/topics.json 读取失败：${describe(error)}`);
    process.exit(1);
  }

  const manifest = topicsManifestSchema.safeParse(manifestRaw);
  if (!manifest.success) {
    console.error("✗ data/topics.json 结构不合法：");
    for (const issue of manifest.error.issues) {
      console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    process.exit(1);
  }

  const listed = listTopicFiles(join(dataDir, "topics"));
  if (listed.invalid.length > 0) {
    console.error("✗ data/topics/ 下有不合规的文件名：");
    for (const name of listed.invalid) {
      console.error(`  - ${name}（必须是小写 kebab-case 的 .json）`);
    }
    process.exit(1);
  }
  const fileSlugs = [...listed.slugs].sort();

  const problems = checkTopicSet(manifest.data, fileSlugs);
  if (problems.length > 0) {
    console.error("✗ 主题清单与目录不一致：");
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  const imports = manifest.data
    .map((slug, index) => `import topic${index} from "@data/topics/${slug}.json";`)
    .join("\n");
  const items = manifest.data
    .map((slug, index) => `  { slug: "${slug}", data: topic${index} },`)
    .join("\n");

  const source = `// 本文件由 scripts/generate-topics.ts 自动生成，请勿手改。
// 数据入口：data/topics.json（顺序）+ data/topics/<slug>.json（内容）。

${imports}

export const topicFiles: { slug: string; data: unknown }[] = [
${items}
];
`;

  const formatted = await prettier.format(source, { filepath: target });

  if (check) {
    let current = "";
    try {
      current = readFileSync(target, "utf8");
    } catch {
      console.error("✗ src/generated/topics.ts 不存在，跑一次 `npm run gen` 再提交。");
      process.exit(1);
    }
    if (current !== formatted) {
      console.error("✗ src/generated/topics.ts 与 data/ 不一致，跑一次 `npm run gen` 再提交。");
      process.exit(1);
    }
    console.log("✓ 主题入口与 data/ 一致");
    return;
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, formatted, "utf8");
  console.log(`✓ 已生成主题入口：${manifest.data.length} 个主题 → src/generated/topics.ts`);
}

main().catch((error: unknown) => {
  console.error(`✗ 生成失败：${describe(error)}`);
  process.exit(1);
});
