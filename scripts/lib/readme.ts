import type { Catalog, Category } from "../../src/lib/schema";

export interface ReadmeInput {
  catalog: Catalog;
  categories: Category[];
  site: {
    name: string;
    domain: string;
    url: string;
    /** L1 标语 */
    tagline: string;
    /** L2 副标语 */
    subtitle: string;
    /** L3 信任行 */
    trust: string;
    license: string;
    author: string;
    repo: string;
  };
  limits: { perCategory: number };
}

const cell = (value: string) => value.replace(/\|/g, "\\|");

/** 从数据渲染 README。纯函数：不读文件、不写文件，便于单测锚点与标题。 */
export function buildReadme({ catalog, categories, site, limits }: ReadmeInput): string {
  const table = (items: typeof catalog.links) => {
    const rows = items
      .map(
        (link) =>
          `| [${cell(link.name)}](${link.url}) | ${cell(link.desc)} | \`${new URL(link.url).host}\` |`,
      )
      .join("\n");
    return `| 名称 | 说明 | 域名 |
| --- | --- | --- |
${rows}`;
  };

  const sections = categories.map((category) => {
    const items = catalog.links.filter((link) => link.tags[0] === category.name);

    // 标题保持纯分类名：README 目录里的锚点是 `#分类名`，
    // 一旦把 desc 拼进标题，锚点就会变成 `#分类名--desc`，目录全部失效（MD051 抓到过）。
    if (category.groups.length === 0) {
      return `### ${category.name}

${category.desc}

${table(items)}`;
    }

    const blocks = category.groups.map((group) => {
      const groupItems = items.filter((link) => link.group?.slug === group.slug);
      return `#### ${group.name}

${table(groupItems)}`;
    });
    const ungrouped = items.filter((link) => !link.group);
    if (ungrouped.length > 0) blocks.push(`#### 未分组\n\n${table(ungrouped)}`);

    return `### ${category.name}

${category.desc}

${blocks.join("\n\n")}`;
  });

  // GitHub 的标题锚点会转小写：`### AI` 的锚点是 `#ai`，写成 `#AI` 目录就点不动（MD051 抓到过）
  const tocCategories = categories
    .map((category) => `  - [${category.name}](#${category.name.toLowerCase()})`)
    .join("\n");

  const toc = [
    "- [特点](#特点)",
    "- [它不做什么](#它不做什么)",
    "- [目录](#目录)",
    "- [全部信息源](#全部信息源)",
    tocCategories,
    "- [收录标准](#收录标准)",
    "- [贡献](#贡献)",
    "- [本地开发](#本地开发)",
    "- [文档](#文档)",
    "- [License](#license)",
  ].join("\n");

  return `<!-- 本文件由 scripts/generate-readme.ts 自动生成。请修改 data/topics/<slug>.json，而不是直接编辑这里。 -->

# RedBot

> ${site.tagline}
>
> ${site.subtitle}

${site.trust}

[![CI](https://github.com/sopwise-ai/redbot/actions/workflows/ci.yml/badge.svg)](https://github.com/sopwise-ai/redbot/actions/workflows/ci.yml)
[![links](https://img.shields.io/badge/信息源-${catalog.links.length}-c62a2f)](./data/topics/)
[![categories](https://img.shields.io/badge/主题-${categories.length}-555)](./data/topics.json)
[![license](https://img.shields.io/badge/license-${site.license}-555)](./LICENSE)

RedBot 是一份**能点的网站清单**：每个主题只留最值得去的几个站，分好类、写着「什么时候该用它」，
点一下直达该站**信息密度最高的那个页面** —— 热榜、快讯、榜单、广场；首页本身就是信息流的门户，就直达首页。

![RedBot 首页：中文网站精选清单](./docs/screenshots/home.png)

**在线访问**：[${site.domain}](${site.url})　｜　本地预览：\`npm run build && npm run start\` → <http://localhost:4173>

深色、移动端、主题菜单、足迹与搜索态等截图见 [docs/screenshots/](./docs/screenshots/)。

## 特点

- 🔘 **只有按钮** —— 没有内容聚合、没有摘要流、没有推荐算法，也没有第三方脚本与统计；只写一个记录侧栏开合的 Cookie
- 🏷️ **按主题过滤** —— ${categories.length} 个主题，随时只看你关心的；分类有自己的地址（\`/topics/dev/\`）
- 🔍 **全站搜索** —— 顶栏即搜即显，\`⌘K\` / \`Ctrl+K\` 聚焦，\`Esc\` 回到来源页；搜索状态可分享（\`/search/?q=播客\`）
- 🕘 **足迹** —— 点过的都记在本地 \`localStorage\`，可回看、可清理，不上传
- 🌗 **三态主题** —— 浅色 / 深色 / 跟随系统，首帧不闪
- 🌱 **社区维护** —— 全部数据都在 [\`data/topics/\`](./data/topics/)，一个主题一个文件，靠 Pull Request 增删

## 它不做什么

这是定位红线，不是「暂未实现」：不做内容聚合与摘要、不做阅读器、不做账号与跨设备同步、不引入第三方脚本与统计。

## 目录

${toc}

## 全部信息源

${sections.join("\n\n")}

## 收录标准

**硬性要求**（任一不满足即拒）

1. **未登录能读到主要内容** —— 需要登录、需要扫码进 App 的不收；付费墙站点按例外逐条收录，记在 [docs/VERIFY.md](./docs/VERIFY.md)
2. 指向具体的**页** —— 榜单、快讯流、列表页、广场。**站点首页原则上不接受**（例外：首页本身就是信息流的门户）
3. 是**信息源**，不是交易或工作目的地 —— 电商、网盘、会议工具不属于这里
4. 中文内容优先，域名可访问

校验器对「指向首页」只统计、不拦截；当前有 164 条属于上面第 2 条的例外，清单见 [docs/VERIFY.md](./docs/VERIFY.md)。

**软性参考**：更新频率、内容独家性、界面广告密度、是否为该领域的事实标准。

**配额**：每个主题最多 ${limits.perCategory} 个。想加新的，请先提议下架旧的 —— 这条规则是为了防止目录退化成 hao123。

## 贡献

1. 改 [\`data/topics/<主题>.json\`](./data/topics/)（新增主题时同时在 \`data/topics.json\` 登记一行）
2. 跑 \`npm run readme\` 重新生成 README.md，**与数据一起提交**
3. 提 Pull Request

CI 会检查格式、重复、分类配额与 README 一致性；链接可达性由每周运行一次的 Link Check 工作流巡检，
新加链接前请本地先跑 \`npm run check:links\`。不想开 PR 也可以直接用
[Issue 模板](https://github.com/sopwise-ai/redbot/issues/new/choose) 推荐或报错。

\`\`\`json
{
  "id": "example-source",
  "name": "示例信息源",
  "url": "https://example.com/hot",
  "tags": ["热榜"],
  "aliases": ["example"],
  "desc": "一句话说清它为什么值得点"
}
\`\`\`

- \`id\`：小写 kebab-case，**发布后不可更改**
- \`name\`：按钮文案，硬上限 20 字符，中文名优先 ≤ 6 字；超过 12 字符会出提示，且按钮里会被截断（靠 \`title\` 兜底）
- \`tags\`：0–2 个副标签（需在 \`LIMITS.subtags\` 白名单内）；主分类由链接所在的主题文件决定，不用写
- \`aliases\`：可选 0–5 个，写用户会打但名字里没有的写法（英文名 / 拼音首字母 / 旧名）；只影响搜索
- \`desc\`：推荐理由，不超过 28 字；会用于按钮悬停提示与 SEO

详细流程、收录标准与常见 CI 失败见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 本地开发

\`\`\`bash
nvm use              # Node 版本见 .nvmrc
npm install
npm run dev          # 开发服务器 http://localhost:3000
npm run build        # 校验 + 生成 README + 静态导出到 out/
npm run start        # 预览导出产物 http://localhost:4173
npm run readme       # 从 data/ 重新生成 README.md
npm run test         # 单测：数据规则与 README 渲染
npm run verify       # 格式 + Markdown + 数据 + 单测 + 类型（提交前跑这个）
\`\`\`

技术栈：Next.js 16（App Router，\`output: "export"\` 纯静态，构建期把全部按钮渲染进 HTML）、React 19、
TypeScript 5、Tailwind CSS v4、shadcn/ui、Fuse.js、zod。

## 文档

- [贡献指南](./CONTRIBUTING.md) —— 收录标准、字段规范与 PR 流程
- [变更日志](./CHANGELOG.md) —— 每个版本改了什么
- [行为准则](./CODE_OF_CONDUCT.md) —— Contributor Covenant 3.0
- [安全政策](./SECURITY.md) —— 漏洞上报的私密通道
- [获取帮助](./SUPPORT.md) —— 该去哪里提问
- [设计记录](./docs/DESIGN-LOG.md) —— 界面为什么长这样
- [已知欠账](./docs/VERIFY.md) —— 待人工核验的链接

## 致谢

感谢 [shadcn/ui](https://ui.shadcn.com) 的组件与 [Next.js](https://nextjs.org) 的静态导出，
以及所有通过 Pull Request 提交与订正链接的贡献者。

## License

[${site.license}](./LICENSE) © ${site.author}
`;
}
