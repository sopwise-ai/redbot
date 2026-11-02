import type { Category, LinkItem, TopicFile } from "@/lib/schema";

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
    categories.push({ slug, label: file.label, emoji: file.emoji, blurb: file.blurb });
    if (file.updated > updated) updated = file.updated;

    for (const link of file.links) {
      links.push({
        id: link.id,
        name: link.name,
        url: link.url,
        desc: link.desc,
        tags: [file.label, ...link.tags],
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
