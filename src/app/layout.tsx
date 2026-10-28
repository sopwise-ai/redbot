import type { Metadata, Viewport } from "next";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/lib/site";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
