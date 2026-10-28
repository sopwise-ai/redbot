import catalogJson from "@data/links.json";
import categoriesJson from "@data/categories.json";

import {
  catalogSchema,
  categoriesSchema,
  type Catalog,
  type Category,
  type CategoryGroup,
} from "@/lib/schema";

/**
 * 数据在模块加载时（= 构建时）完成解析与校验。
 * 数据不合法 → 构建失败，而不是上线一个坏页面。
 */
export const catalog: Catalog = catalogSchema.parse(catalogJson);
export const categories: Category[] = categoriesSchema.parse(categoriesJson);

const categoryByLabel = new Map(categories.map((category) => [category.label, category]));

export function getGroups(): CategoryGroup[] {
  const groups: CategoryGroup[] = categories.map((category) => ({
    ...category,
    items: [],
  }));
  const index = new Map(groups.map((group) => [group.slug, group]));

  for (const link of catalog.links) {
    const primary = categoryByLabel.get(link.tags[0]);
    if (!primary) {
      throw new Error(
        `链接 ${link.id} 的主分类「${link.tags[0]}」不在 categories.json 中，请先定义分类。`,
      );
    }
    index.get(primary.slug)!.items.push(link);
  }

  const empty = groups.filter((group) => group.items.length === 0);
  if (empty.length > 0) {
    throw new Error(`以下分类没有任何条目：${empty.map((g) => g.label).join("、")}`);
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
