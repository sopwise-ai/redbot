import type { Category, LinkItem } from "@/lib/schema";
import { site } from "@/lib/site";

/** 站点级 JSON-LD：告诉搜索引擎这是什么、搜索入口在哪。 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    alternateName: site.tagline,
    url: site.url,
    description: site.description,
    inLanguage: "zh-CN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/search/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** 主题页 JSON-LD：把该主题下的站点列成 ItemList。 */
export function topicJsonLd(category: Category, items: LinkItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} · ${site.name}`,
    description: category.desc,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
      description: item.desc,
    })),
  };
}

/** 转义 `<`，避免站点名/描述里的 </script> 提前闭合标签。 */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
