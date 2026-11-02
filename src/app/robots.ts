import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

// 静态导出下元数据路由必须显式声明为静态
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 纯客户端状态页：内容因人而异且无独立信息量
        disallow: ["/search/", "/history/"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
