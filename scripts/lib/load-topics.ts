import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { checkTopicGroups, checkTopicSet, type TopicEntry } from "../../src/lib/merge-topics";
import { topicFileSchema, topicsManifestSchema } from "../../src/lib/schema";

export interface LoadTopicsResult {
  entries: TopicEntry[];
  errors: string[];
}

const describe = (error: unknown) => (error instanceof Error ? error.message : String(error));

const TOPIC_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/;

/**
 * 扫描主题目录：只认 `<slug>.json`（小写 kebab-case），其余文件单独报出来，
 * 不再静默忽略 —— 否则 `AI.JSON`、`ai.json.bak` 会让作者对着「文件不存在」反复怀疑自己。
 */
export function listTopicFiles(topicsDir: string): { slugs: string[]; invalid: string[] } {
  const slugs: string[] = [];
  const invalid: string[] = [];

  for (const name of readdirSync(topicsDir)) {
    if (name.startsWith(".")) continue;
    if (TOPIC_FILE.test(name)) slugs.push(name.slice(0, -".json".length));
    else invalid.push(name);
  }

  return { slugs, invalid };
}

/**
 * 从磁盘读取 data/topics.json + data/topics/*.json。
 * 只给 Node 脚本用（validate / generate-readme）；应用侧走生成的静态入口。
 * 不在这一层抛错：把所有问题收集起来一次性打印，PR 作者不用改一处跑一次。
 */
export function loadTopics(dataDir: string): LoadTopicsResult {
  const errors: string[] = [];

  let manifestRaw: unknown;
  try {
    manifestRaw = JSON.parse(readFileSync(join(dataDir, "topics.json"), "utf8"));
  } catch (error) {
    return { entries: [], errors: [`data/topics.json 读取失败：${describe(error)}`] };
  }

  const manifest = topicsManifestSchema.safeParse(manifestRaw);
  if (!manifest.success) {
    for (const issue of manifest.error.issues) {
      errors.push(`data/topics.json → ${issue.path.join(".") || "(root)"}：${issue.message}`);
    }
    return { entries: [], errors };
  }

  let fileSlugs: string[];
  try {
    const listed = listTopicFiles(join(dataDir, "topics"));
    for (const name of listed.invalid) {
      errors.push(`data/topics/${name} 文件名不合规：必须是小写 kebab-case 的 .json`);
    }
    fileSlugs = listed.slugs;
  } catch (error) {
    return { entries: [], errors: [`data/topics/ 目录读取失败：${describe(error)}`] };
  }

  errors.push(...checkTopicSet(manifest.data, fileSlugs));

  const entries: TopicEntry[] = [];
  for (const slug of manifest.data) {
    if (!fileSlugs.includes(slug)) continue;

    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(dataDir, "topics", `${slug}.json`), "utf8"));
    } catch (error) {
      errors.push(`data/topics/${slug}.json 读取失败：${describe(error)}`);
      continue;
    }

    const parsed = topicFileSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(
          `data/topics/${slug}.json → ${issue.path.join(".") || "(root)"}：${issue.message}`,
        );
      }
      continue;
    }

    const groupErrors = checkTopicGroups(parsed.data);
    if (groupErrors.length > 0) {
      for (const error of groupErrors) errors.push(`data/topics/${slug}.json → ${error}`);
      continue;
    }

    entries.push({ slug, file: parsed.data });
  }

  return { entries, errors };
}
