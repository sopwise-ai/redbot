import type { MetadataRoute } from "next";

import { catalog, categories } from "@/lib/catalog";
import { site } from "@/lib/site";

// 静态导出下元数据路由必须显式声明为静态
export const dynamic = "force-static";

/**
 * 目录站的生命线是被搜到：首页、主题索引与 17 个主题页全部可索引。
 * 搜索页（/search/）与足迹页是纯客户端状态页，已 noindex，不进 sitemap。
 * lastModified 读数据的 updated 字段——改数据即改时间戳，无需手工维护。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${catalog.updated}T00:00:00+08:00`);

  return [
    { url: `${site.url}/`, lastModified, changeFrequency: "daily", priority: 1 },
    {
      url: `${site.url}/topics/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...categories.map((category) => ({
      url: `${site.url}/topics/${category.slug}/`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
