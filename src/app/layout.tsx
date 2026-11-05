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
 * 分组筛选：`?group=` 只有客户端知道，但静态 HTML 永远是「全部组」。
 * 在绘制前把不匹配的 section 加上 hidden —— React 首帧渲染用的是同一个判断，
 * 结构一致，所以不会 hydrate mismatch，也不会先铺满再缩水。
 * 注意：这是本站唯一的内联脚本，上 CSP 时需要 nonce / hash。
 */
const groupDomScript =
  // `all` = 不过滤（与 lib/group-filter.ts 的 resolveGroupFilter 同口径）。
  // 不一致时会把所有 section 都藏起来，而 React 认为它们可见 → 水合后无法恢复的空白墙。
  '(function(){try{var q=new URLSearchParams(location.search).get("group");if(!q||q==="all")return;' +
  'var chips=document.querySelectorAll("[role=radio][data-group-slug]"),hit=false,i;' +
  // 先确认这个 slug 真的存在；无效值交给 React 兜底（它会退回「全部」）
  'for(i=0;i<chips.length;i++){if(chips[i].getAttribute("data-group-slug")===q)hit=true}' +
  "if(!hit)return;" +
  // 选中态也要在绘制前改对，否则会看到「全部」跳成目标分组
  'for(i=0;i<chips.length;i++){var on=chips[i].getAttribute("data-group-slug")===q;' +
  'chips[i].setAttribute("data-state",on?"on":"off");' +
  'chips[i].setAttribute("aria-checked",on?"true":"false");' +
  'chips[i].setAttribute("tabindex",on?"0":"-1")}' +
  'var ns=document.querySelectorAll("section[data-group-slug]");' +
  'for(i=0;i<ns.length;i++){if(ns[i].getAttribute("data-group-slug")!==q)ns[i].classList.add("hidden")}' +
  "}catch(e){}})()";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd()) }}
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: groupDomScript }} />
      </body>
    </html>
  );
}
