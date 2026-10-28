import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

// 静态导出下元数据路由必须显式声明为静态
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} · ${site.tagline}`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#c62a2f",
    lang: "zh-CN",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
