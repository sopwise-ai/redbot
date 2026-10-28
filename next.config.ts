import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // RedBot 是纯静态站点：构建期把整页编译成 HTML，
  // 不依赖 Node 运行时，也不发起任何运行时请求。
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // 开发时隐藏 Next 的浮标，方便截图比对设计
  devIndicators: false,
};

export default nextConfig;
