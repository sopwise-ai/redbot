import type { Category, GroupMeta, LinkItem, TopicFile } from "@/lib/schema";

export interface TopicEntry {
  /** 主题 slug（= 文件名，不带 .json） */
  slug: string;
  file: TopicFile;
}

export interface MergedCatalog {
  categories: Category[];
  links: LinkItem[];
  /** 所有主题 updated 的最大值 */
  updated: string;
}

/**
 * 把各主题文件合并成运行时模型。
 * 纯函数：不读文件，校验脚本、生成脚本与单元测试共用。
 *
 * 这里补上「主分类」：链接写在哪个主题文件，`tags[0]` 就是该主题的 label，
 * 因此主题文件里只需要写副标签。
 */
export function mergeTopics(entries: TopicEntry[]): MergedCatalog {
  const categories: Category[] = [];
  const links: LinkItem[] = [];
  let updated = "";

  for (const { slug, file } of entries) {
    const groupBySlug = new Map<string, GroupMeta>();
    for (const group of file.groups) groupBySlug.set(group.slug, group);

    categories.push({
      slug,
      name: file.name,
      emoji: file.emoji,
      desc: file.desc,
      groups: file.groups,
    });
    if (file.updated > updated) updated = file.updated;

    for (const link of file.links) {
      const group = link.group ? groupBySlug.get(link.group) : undefined;
      if (link.group && !group) {
        throw new Error(
          `data/topics/${slug}.json：链接「${link.name}」引用了未定义的分组「${link.group}」`,
        );
      }
      links.push({
        id: link.id,
        name: link.name,
        url: link.url,
        desc: link.desc,
        tags: [file.name, ...link.tags],
        topic: { slug, name: file.name },
        ...(group ? { group } : {}),
        ...(link.aliases.length > 0 ? { aliases: link.aliases } : {}),
      });
    }
  }

  return { categories, links, updated };
}

/**
 * 清单与目录必须双向一一对应。
 * 返回人话错误；空数组 = 通过。纯函数，供校验脚本与生成脚本共用。
 */
export function checkTopicSet(manifest: readonly string[], fileSlugs: readonly string[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const files = new Set(fileSlugs);

  for (const slug of manifest) {
    if (seen.has(slug)) errors.push(`data/topics.json 里重复登记了「${slug}」`);
    seen.add(slug);

    if (!files.has(slug)) {
      errors.push(`清单里有「${slug}」，但 data/topics/${slug}.json 不存在`);
    }
  }

  for (const slug of fileSlugs) {
    if (!seen.has(slug)) {
      errors.push(`data/topics/${slug}.json 没有登记在 data/topics.json 里`);
    }
  }

  return errors;
}

/**
 * 主题内分组的完整性：slug/name 唯一、引用存在、每组非空。
 * `all` / `ungrouped` 是 URL 状态保留字，不允许作为分组 slug。
 */
export function checkTopicGroups(file: TopicFile): string[] {
  const errors: string[] = [];
  const slugs = new Set<string>();
  const names = new Set<string>();

  for (const group of file.groups) {
    if (group.slug === "all" || group.slug === "ungrouped") {
      errors.push(`分组 slug「${group.slug}」是保留字，请换一个`);
    }
    if (slugs.has(group.slug)) errors.push(`分组 slug 重复：「${group.slug}」`);
    slugs.add(group.slug);
    if (names.has(group.name)) errors.push(`分组名重复：「${group.name}」`);
    names.add(group.name);
  }

  const counts = new Map<string, number>();
  for (const link of file.links) {
    if (!link.group) continue;
    if (!slugs.has(link.group)) {
      errors.push(`链接「${link.name}」引用了未定义的分组「${link.group}」`);
    } else {
      counts.set(link.group, (counts.get(link.group) ?? 0) + 1);
    }
  }

  for (const group of file.groups) {
    if ((counts.get(group.slug) ?? 0) === 0) {
      errors.push(`分组「${group.name}」没有任何条目`);
    }
  }

  return errors;
}
