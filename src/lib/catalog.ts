import { topicFiles } from "@/generated/topics";

import { checkTopicGroups, mergeTopics, type TopicEntry } from "@/lib/merge-topics";
import { topicFileSchema, type Catalog, type Category, type CategoryGroup } from "@/lib/schema";

/**
 * 数据在模块加载时（= 构建时）完成解析与校验。
 * 主题 JSON 由 src/generated/topics.ts 静态引入，改数据能在 dev 里热更新；
 * 数据不合法 → 构建失败，而不是上线一个坏页面。
 */
const entries: TopicEntry[] = topicFiles.map(({ slug, data }) => {
  const parsed = topicFileSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`data/topics/${slug}.json 不合法：\n${issues}`);
  }
  const groupErrors = checkTopicGroups(parsed.data);
  if (groupErrors.length > 0) {
    throw new Error(
      `data/topics/${slug}.json：\n${groupErrors.map((item) => `  - ${item}`).join("\n")}`,
    );
  }

  return { slug, file: parsed.data };
});

const merged = mergeTopics(entries);

// label 是 getGroups 的分组键：重复会让两组静默并进同一组，必须在构建期拦下
const nameOwner = new Map<string, string>();
for (const category of merged.categories) {
  const owner = nameOwner.get(category.name);
  if (owner) {
    throw new Error(
      `主题 name 重复：「${category.name}」（data/topics/${owner}.json 与 data/topics/${category.slug}.json）`,
    );
  }
  nameOwner.set(category.name, category.slug);
}

export const catalog: Catalog = { updated: merged.updated, links: merged.links };
export const categories: Category[] = merged.categories;

const categoryByName = new Map(categories.map((category) => [category.name, category]));

export function getGroups(): CategoryGroup[] {
  const groups: CategoryGroup[] = categories.map((category) => ({
    ...category,
    items: [],
  }));
  const index = new Map(groups.map((group) => [group.slug, group]));

  for (const link of catalog.links) {
    const primary = categoryByName.get(link.tags[0]);
    if (!primary) {
      throw new Error(
        `链接 ${link.id} 的主分类「${link.tags[0]}」没有对应的主题文件，请检查 data/topics/。`,
      );
    }
    index.get(primary.slug)!.items.push(link);
  }

  return groups;
}

export function getStats() {
  return {
    total: catalog.links.length,
    categories: categories.length,
    updated: catalog.updated,
  };
}
