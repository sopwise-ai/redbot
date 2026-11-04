import type { Metadata, Viewport } from "next";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/lib/site";
import { serializeJsonLd, websiteJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: ["信息源", "热榜", "导航", "链接入口", "中文互联网", "RedBot"],
  authors: [{ name: site.author, url: site.repo }],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: site.url,
    siteName: site.name,
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${site.name} · ${site.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

/**
 * 首屏防闪：静态导出的 HTML 只能是展开态，读到「上次是折叠」就在绘制前给 <html> 打标记。
 * 内联、阻塞、只碰 documentElement —— 与 next-themes 避免深色闪白的做法同源。
 */
const sidebarInitScript =
  '(function(){try{if(/(?:^|;\\s*)sidebar_state=false/.test(document.cookie)){document.documentElement.setAttribute("data-sidebar","collapsed")}}catch(e){}})()';

/**
 * body 末尾的同步脚本：侧栏 DOM 已经解析出来、但还没绘制，直接把展开态改成折叠态。
 * 配合 AppShell 里 useState 的惰性初始化（同样读 cookie），React 首帧就按折叠渲染，
 * 与改过的 DOM 一致，既不会 hydrate mismatch，也不会出现「空白栏 -> 图标浮现」。
 */
const sidebarDomScript =
  '(function(){try{if(!/(?:^|;\\s*)sidebar_state=false/.test(document.cookie))return;var sb=document.querySelector(\'[data-slot="sidebar"]\');if(sb){sb.setAttribute("data-state","collapsed");sb.setAttribute("data-collapsible","icon")}}catch(e){}})()';

/**
 * 分组筛选同理：`?group=` 只有客户端知道，但静态 HTML 永远是「全部组」。
 * 在绘制前把不匹配的 section 加上 hidden —— React 首帧渲染用的是同一个判断，
 * 结构一致，所以不会 hydrate mismatch，也不会先铺满再缩水。
 */
const groupDomScript =
  '(function(){try{var q=new URLSearchParams(location.search).get("group");if(!q)return;var ns=document.querySelectorAll("section[data-group-slug]");for(var i=0;i<ns.length;i++){var g=ns[i].getAttribute("data-group-slug");if(g!==q)ns[i].classList.add("hidden")}}catch(e){}})()';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: sidebarInitScript }} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd()) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: sidebarDomScript }} />
        <script dangerouslySetInnerHTML={{ __html: groupDomScript }} />
      </body>
    </html>
  );
}
