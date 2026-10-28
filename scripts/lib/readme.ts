import type { Catalog, Category } from "../../src/lib/schema";

export interface ReadmeInput {
  catalog: Catalog;
  categories: Category[];
  site: {
    name: string;
    domain: string;
    url: string;
    license: string;
    author: string;
    repo: string;
  };
  limits: { perCategory: number };
}

const cell = (value: string) => value.replace(/\|/g, "\\|");

/** 从数据渲染 README。纯函数：不读文件、不写文件，便于单测锚点与标题。 */
export function buildReadme({ catalog, categories, site, limits }: ReadmeInput): string {
  const sections = categories.map((category) => {
    const items = catalog.links.filter((link) => link.tags[0] === category.label);
    const rows = items
      .map(
        (link) =>
          `| [${cell(link.name)}](${link.url}) | ${cell(link.desc)} | \`${new URL(link.url).host}\` |`,
      )
      .join("\n");

    // 标题保持纯分类名：README 目录里的锚点是 `#分类名`，
    // 一旦把 blurb 拼进标题，锚点就会变成 `#分类名--blurb`，目录全部失效（MD051 抓到过）。
    return `### ${category.label}

${category.blurb}

| 名称 | 说明 | 域名 |
| --- | --- | --- |
${rows}`;
  });

  // GitHub 的标题锚点会转小写：`### AI` 的锚点是 `#ai`，写成 `#AI` 目录就点不动（MD051 抓到过）
  const toc = categories
    .map((category) => `- [${category.label}](#${category.label.toLowerCase()})`)
    .join("\n");

  return `<!-- 本文件由 scripts/generate-readme.ts 自动生成。请修改 data/links.json，而不是直接编辑这里。 -->

# RedBot

> 一个按钮，直达一个信息源。

[![CI](https://github.com/sopwise-ai/redbot/actions/workflows/ci.yml/badge.svg)](https://github.com/sopwise-ai/redbot/actions/workflows/ci.yml)
[![links](https://img.shields.io/badge/信息源-${catalog.links.length}-c62a2f)](./data/links.json)
[![categories](https://img.shields.io/badge/主题-${categories.length}-555)](./data/categories.json)
[![license](https://img.shields.io/badge/license-${site.license}-555)](./LICENSE)

RedBot 是中文互联网优质信息源的极简入口。页面上只有按钮：点一下，直达该平台**信息密度最高的那个页面** —— 热榜、快讯、榜单、广场，而不是首页。

不是热榜阅读器，不抓取内容，不展示标题，不需要登录。它更像一份**用按钮呈现的 awesome list**。

**在线访问**：[${site.domain}](${site.url})

## 特点

- 🔘 **只有按钮** —— 没有内容聚合、没有摘要流、没有推荐算法
- 🏷️ **按主题过滤** —— ${categories.length} 个主题，随时只看你关心的
- 🔍 **可搜索** —— 关键词实时过滤，支持 \`⌘K\` / \`Ctrl+K\` 聚焦
- 🌱 **社区维护** —— 全部数据都在 [\`data/links.json\`](./data/links.json)，靠 Pull Request 增删

## 目录

${toc}

${sections.join("\n\n")}

## 收录标准

**硬性要求**（任一不满足即拒）

1. **未登录状态**打开就能看到内容 —— 需要登录才可见的页面不收
2. 指向具体的**榜单 / 快讯 / 列表页**，而不是站点首页
3. 是**信息源**，不是交易或工作目的地 —— 电商、网盘、会议工具不属于这里
4. 中文内容优先，域名可访问

**软性参考**：更新频率、内容独家性、界面广告密度、是否为该领域的事实标准。

**配额**：每个主题最多 ${limits.perCategory} 个。想加新的，请先提议下架旧的 —— 这条规则是为了防止目录退化成 hao123。

## 贡献

修改 [\`data/links.json\`](./data/links.json)，提交 Pull Request 即可。CI 会自动检查格式、重复、分类配额和链接可达性。

\`\`\`json
{
  "id": "example-source",
  "name": "示例信息源",
  "url": "https://example.com/hot",
  "tags": ["开发", "热榜"],
  "desc": "一句话说清它为什么值得点"
}
\`\`\`

- \`id\`：小写 kebab-case，**发布后不可更改**
- \`name\`：按钮文案，尽量不超过 6 个汉字
- \`tags\`：第一个是主分类（必须来自 \`data/categories.json\`），其余为副标签（需在白名单内）
- \`desc\`：推荐理由，不超过 28 字；会用于按钮悬停提示与 SEO

详细流程见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 本地开发

\`\`\`bash
npm install
npm run dev          # 本地开发 http://localhost:3000
npm run verify       # 格式 + Markdown + 数据校验 + 单测 + 类型检查
npm run build        # 校验 + 生成 README + 静态导出到 out/
\`\`\`

技术栈：Next.js（App Router，\`output: "export"\` 纯静态）、TypeScript、Tailwind CSS v4、shadcn/ui、Fuse.js。

## 参与贡献

- [贡献指南](./CONTRIBUTING.md) —— 收录标准、字段规范与 PR 流程
- [行为准则](./CODE_OF_CONDUCT.md) —— Contributor Covenant 3.0
- [安全政策](./SECURITY.md) —— 漏洞上报的私密通道
- [获取帮助](./SUPPORT.md) —— 该去哪里提问
- [设计记录](./docs/DESIGN-LOG.md) —— 界面为什么长这样

## License

[${site.license}](./LICENSE) © ${site.author}
`;
}
