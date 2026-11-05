import Link from "next/link";
import { CheckIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { site } from "@/lib/site";

const sectionClass = "flex flex-col gap-3";
const headingClass = "text-lg font-semibold tracking-tight";
const bodyClass = "text-sm leading-7 text-muted-foreground";
const linkClass =
  "text-foreground underline underline-offset-4 transition-colors hover:text-primary";

/** 关于页：这是什么 / 收录标准 / FAQ / 隐私 / 条款 / 许可，单页分段。 */
const toc = [
  { id: "what", label: "这是什么" },
  { id: "criteria", label: "收录标准" },
  { id: "faq", label: "常见问题" },
  { id: "privacy", label: "隐私" },
  { id: "terms", label: "使用条款" },
  { id: "license", label: "许可与联系" },
];

export function AboutView() {
  return (
    <div className="flex items-start gap-12">
      <div className="flex max-w-3xl min-w-0 flex-1 flex-col gap-8">
        <section id="what" className={sectionClass}>
          <h2 className={headingClass}>这是什么</h2>
          <p className={bodyClass}>
            {site.name} 是一个{site.tagline}
            。人工挑站、按主题分好，点一下直达该站信息密度最高的页面——热榜、快讯、榜单或列表页，而不是先落在首页再找一次。
          </p>
          <p className={bodyClass}>
            它只做一件事：把「今天该去哪看」变成一次点击。不做内容聚合、不做阅读器、不做账号、不做推荐算法；没有广告，也没有统计脚本。
          </p>
        </section>

        <Separator />

        <section id="criteria" className={sectionClass}>
          <h2 className={headingClass}>收录标准</h2>
          <ul className="flex flex-col gap-2.5">
            {[
              "未登录能读到主要内容；需要登录、扫码进 App 的不收。",
              "指向具体的页：榜单、快讯流、列表页、广场；首页只在本身是信息流时接受。",
              "是信息源，不是交易或办公工具：电商、网盘、会议工具不属于这里。",
              "https，中文内容优先，能正常访问。",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm leading-6">
                <CheckIcon aria-hidden className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{line}</span>
              </li>
            ))}
          </ul>
          <p className={bodyClass}>
            不收博彩、灰产、盗版、纯营销与已停更的站。每个主题 1–500 条，满了先下架旧的；完整规则见{" "}
            <a
              className={linkClass}
              href={`${site.repo}/blob/main/CONTRIBUTING.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              贡献指南
            </a>
            。
          </p>
        </section>

        <Separator />

        <section id="faq" className={sectionClass}>
          <h2 className={headingClass}>常见问题</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="submit">
              <AccordionTrigger>怎么推荐一个网站？</AccordionTrigger>
              <AccordionContent className={bodyClass}>
                在{" "}
                <a
                  className={linkClass}
                  href={`${site.repo}/issues/new/choose`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Issues
                </a>{" "}
                选对应模板，或直接修改{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">data/topics/</code>{" "}
                下的主题文件提 PR。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="rejected">
              <AccordionTrigger>为什么我的网站没被收录？</AccordionTrigger>
              <AccordionContent className={bodyClass}>
                先对照上面的收录标准；符合也可能因为主题配额、内容重叠或人工取舍没进。收录不收费，也不接受付费位置。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="broken">
              <AccordionTrigger>链接失效了怎么办？</AccordionTrigger>
              <AccordionContent className={bodyClass}>
                在{" "}
                <a
                  className={linkClass}
                  href={`${site.repo}/issues/new/choose`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Issues
                </a>{" "}
                选「链接失效或指错页」，写上按钮名或 id，我们会在下一次数据更新时修。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cost">
              <AccordionTrigger>靠什么维持？</AccordionTrigger>
              <AccordionContent className={bodyClass}>
                没有广告、赞助或付费收录。纯静态站点的托管成本很低，维护靠开源协作。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="reuse">
              <AccordionTrigger>数据能复用吗？</AccordionTrigger>
              <AccordionContent className={bodyClass}>
                可以，代码与数据都是 MIT；转载或二次整理请注明来源。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <Separator />

        <section id="privacy" className={sectionClass}>
          <h2 className={headingClass}>隐私</h2>
          <p className={bodyClass}>
            本站不注册、不登录，不收集姓名、邮箱等身份信息；不使用
            Cookie、像素、指纹或任何统计脚本。
          </p>
          <p className={bodyClass}>
            主题偏好与足迹保存在你的浏览器 localStorage：前者只记录浅色 / 深色 /
            跟随系统，后者记录你点过的站、时间与次数。它们不出本机、不上传，可在{" "}
            <Link className={linkClass} href="/history/">
              足迹
            </Link>{" "}
            页删除或清空。
          </p>
          <p className={bodyClass}>
            本站是纯静态站点，由第三方静态托管。托管商可能按行业惯例记录基础访问日志（如
            IP、User-Agent），本站不读取、不分析这些日志。
          </p>
          <p className={bodyClass}>
            跳到第三方网站后，其内容、服务、安全与隐私政策由该站运营方独立负责。
          </p>
        </section>

        <Separator />

        <section id="terms" className={sectionClass}>
          <h2 className={headingClass}>使用条款与免责</h2>
          <p className={bodyClass}>本站按「现状」提供，不保证服务的连续性、准确性或完整性。</p>
          <p className={bodyClass}>
            所有链接来自人工筛选与公开信息整理。我们会尽量检查有效性，但无法保证长期可用或内容完全准确；收录不代表推荐或背书。
          </p>
          <p className={bodyClass}>
            请勿对本站进行恶意爬取、攻击或干扰正常运行。因访问第三方网站导致的数据泄露、财产损失或其他问题，由用户与该第三方自行处理；在法律允许的范围内，本站不承担赔偿或连带责任。
          </p>
          <p className={bodyClass}>本站可能随时调整内容或停止服务，重大变化会更新本页。</p>
        </section>

        <Separator />

        <section id="license" className={sectionClass}>
          <h2 className={headingClass}>许可与联系</h2>
          <p className={bodyClass}>
            代码与数据以{" "}
            <a
              className={linkClass}
              href={`${site.repo}/blob/main/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
            >
              MIT
            </a>{" "}
            许可发布；名称与标识除外。
          </p>
          <p className={bodyClass}>
            由 {site.author} 维护。问题、建议或失效链接，请开{" "}
            <a
              className={linkClass}
              href={`${site.repo}/issues`}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Issue
            </a>
            。
          </p>
          <p className="text-xs text-muted-foreground">最后更新：{site.legalUpdated}</p>
        </section>
      </div>

      <nav
        aria-label="本页目录"
        className="sticky top-32 hidden w-40 shrink-0 flex-col gap-3 xl:flex"
      >
        <p className="text-xs font-medium tracking-wide text-muted-foreground">本页目录</p>
        <ul className="flex flex-col gap-1 border-l border-border">
          {toc.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="-ml-px block border-l border-transparent py-1 pl-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
