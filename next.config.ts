import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // RedBot 是纯静态站点：构建期把整页编译成 HTML，
  // 不依赖 Node 运行时，也不发起任何运行时请求。
  //
  // 前提：部署在域名**根路径**（https://redbot.cc/）。产物里的资源引用是 /_next/... 这种绝对路径，
  // 要迁到子路径（例如 GitHub Pages 项目页 /redbot/），必须同时改三处：
  //   1) 这里加 basePath，2) src/app/manifest.ts 的 start_url / scope，3) src/app/layout.tsx 的 metadataBase
  // 缺一处就会出现资源 404 或 canonical 指错域。
  output: "export",
  trailingSlash: true,
  // 纯静态导出没有图片优化服务；本项目只有 public/og.png，保留这一行不影响产物
  images: { unoptimized: true },
  reactStrictMode: true,
  // 开发时隐藏 Next 的浮标，方便截图比对设计
  devIndicators: false,
  // 注意：静态导出没有服务端，在这里写 headers() / redirects() / rewrites() 只会打印一条警告后失效。
  // /_next/static 的长缓存、安全响应头（CSP、X-Content-Type-Options、Referrer-Policy）
  // 以及 /xxx → /xxx/ 的 301，都必须在托管层（Nginx / Cloudflare / Vercel）配置。
};

export default nextConfig;
