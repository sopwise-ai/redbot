# RedBot — 给 AI 协作者的项目说明

> 本文件是**给 AI 编码助手看的**：只写「不看就会写错」的约定，不重复 README 的营销文案。
> 人类贡献者请读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 这是什么

中文互联网优质信息源的**极简快捷入口**。一页按钮，点一下直达目标站的榜单 / 列表页。
不做内容聚合、不做阅读器、不做账号、不做推荐算法 —— 这几条是定位红线，不是「暂未实现」。

设计取舍与实测数据见 [docs/DESIGN-LOG.md](./docs/DESIGN-LOG.md)；待人工核验的链接见 [docs/VERIFY.md](./docs/VERIFY.md)。
**本文件只写可执行的约束，理由和过程不在这里展开。**

## 技术栈

- Next.js 15（App Router）+ React 19 + TypeScript 5
- Tailwind CSS v4（CSS-first，token 在 `src/app/globals.css` 的 `@theme inline`）
- shadcn/ui（registry 组件，源码在 `src/components/ui/`；新增控件见下文约定 2）
- fuse.js（客户端搜索）、next-themes（浅色 / 深色 / 跟随系统三态，切换器是 `src/components/theme-toggle.tsx`）、zod（数据契约）
- ESLint 9 + `eslint-config-next`（`eslint.config.mjs`，用 FlatCompat 桥接 15.x 的 eslintrc 配置；等 Next 16 再简化）
- **`output: "export"` 纯静态**：构建期产出 `out/`，没有服务端运行时、没有 API 路由

## 命令

```bash
npm run dev          # 开发服务器 http://localhost:3000
npm run build        # 校验数据 → 生成 README → 静态导出
npm run verify       # 格式 + Markdown + ESLint + 数据 + README 一致性 + 单测 + 类型（提交前跑这个）
npm run lint         # ESLint（next/core-web-vitals + next/typescript，flat config）
npm run clean        # 删 .next / out / tsbuildinfo
npm run validate     # 只跑数据校验
npm run check:links  # 数据校验 + 逐个探测 URL 可达性（慢，改过 url 才需要）
npm run test         # 单元测试（数据规则、README 渲染）
npm run readme       # 从 data/ 重新生成 README.md
npm run format       # prettier 全量格式化（shadcn 覆盖过 ui/ 之后要跑）
```

## 目录

```text
data/                 links.json + categories.json —— 唯一内容源，PR 只改这里
src/app/              layout / page / globals.css / manifest / not-found / icon
                      + topics/（索引与 [slug]）/ search/ / history/ 三个路由
src/components/       app-shell（状态与布局）、app-sidebar、pill-wall（按钮墙）、
                      history-view（足迹）、topics-index、site-footer
src/components/ui/    shadcn 生成物，改样式前先看这里有没有现成变体
src/lib/schema.ts     zod 契约 + LIMITS（配额、副标签白名单）—— 规则的唯一事实源
src/lib/catalog.ts    取数与分组（构建期 parse，数据不合法直接构建失败）
src/lib/history.ts    足迹读写（localStorage: redbot:history）；use-history.ts 是其 React 封装
src/lib/search.ts     fuse 索引；src/lib/site.ts 站点元信息（域名、仓库、作者）
scripts/              validate.ts / generate-readme.ts —— 只负责读写与打印
scripts/lib/checks.ts 校验规则本身（唯一性、配额、标签、https、首页提醒），有单测
scripts/lib/readme.ts README 渲染本身（纯函数），有单测
```

## 数据契约（改错这里最容易出事）

`data/links.json`：

```json
{ "id": "weibo-hot", "name": "微博热搜", "url": "https://s.weibo.com/top/summary", "tags": ["新闻", "热榜"], "desc": "十分钟前的全网议题" }
```

- `id`：kebab-case，**发布后不可修改**（统计与去重锚点）；与 URL、名称三者任一重复，校验直接失败
- `name`：按钮文案，硬上限 20 字符；超过 12 只会在 `npm run validate` 里出「会被截断」的提醒，不阻断
  （现有 10 条外文站名已超）。中文名优先 ≤6 字
- `url`：必须 https（非 https 直接报错）。新增指向榜单 / 快讯 / 列表页；站点首页只在「首页本身就是信息流」时接受，
  校验器对首页只统计不拦截（现有 164 条门户首页属于这一档，见 docs/VERIFY.md）
- `tags`：1–3 个。`tags[0]` 是主分类，必须存在于 `data/categories.json`；
  `tags[1..]` 是副标签，必须在 `LIMITS.subtags` 白名单内；第 4 个会让校验失败
- `desc`：≤28 字，写「推荐理由」而不是百科介绍
- 顶层还有 `version`（正整数）与 `updated`（YYYY-MM-DD）：页头「更新于」直接读 `updated`，改数据时改成当天日期

`LIMITS`：单分类 ≤20 条、分类 ≤20 个。**加条目之前先看配额**，满了要先下架。

新增分类要一次把 `data/categories.json` 的五个字段写全（少一个就解析失败）：
`slug`（同时是 `/topics/<slug>/` 路径）、`label`（≤6 字，`tags[0]` 引用的就是它）、
`group`（只能是资讯 / 技术 / 生活 / 社区与工具）、`emoji`（单个字符）、`blurb`（≤24 字）。

## 关键约定

1. **只改数据，不改 README**。`README.md` 由 `scripts/generate-readme.ts` 生成，CI 会校验它与数据一致。
2. **不写自定义控件**。需要按钮 / 输入框 / 徽章 / 空状态，先用 `src/components/ui/` 里已有的；
   缺组件就 `npx shadcn@latest add <name>`，不要手搓 `inline-flex h-9 rounded-md border` 这类变体等价物。
3. **不引入运行时外部请求**。没有第三方脚本、没有外部字体、没有统计代码；字体走系统栈。
4. **足迹只存本地**。`/history/` 记录用户点过的链接（`localStorage` 的 `redbot:history`，含时间与次数），
   **不引入后端、不上传**；点击由 `LinkPill` 的 onClick 调用 `recordVisit`。管理（单条删除 / 批量 / 清空）都在页面内完成，
   清空是两步确认，避免误触。
5. **分类在路径里，搜索是状态**。`/topics/<slug>/`（按 categories.json 逐个预生成）是分类页，`/` 是全部，
   `/topics/` 是主题索引，`/search/` 是搜索页——**后两者都渲染在同一个外壳里**（侧栏 + 顶栏 + 主区域），
   不要给它们做独立版式。
   搜索：顶栏输入框即搜即显，范围是**全站**（不按当前分类过滤）；第一次输入时记下来源路径，
   地址栏换成 `/search/?q=`，**清空或按 Esc 即回到来源页**（见 `originPath`）。
   分类切换是 `setActive` + `history.replaceState`（不触发路由请求），刷新由服务端渲染正确分类——
   **不要退回 `?tag=`**，那会让首屏渲染「全部」再纠正。
6. **动效要尊重 `prefers-reduced-motion`**。分类切换用 View Transitions（`switchCategory`），
   不支持或减弱动效时直接切换；CSS 里已有全局兜底。
7. **构建期失败优先于运行时兜底**。数据不合法就让 `npm run build` 挂掉，不要写运行期容错。

## 设计 token（改样式前先读）

- **颜色**：`--background` 是画布，`--card` 是浮起表面，两者只差明度；`--border` 只用于必须的边界。
  **红色只出现在「当前分类」和 hover 强调上**，不要用它装饰计数、徽章。
- **字号**：只用 `text-2xs / xs / sm / base / md / lg / xl / 2xl / 3xl`（11/12/13/14/15/18/22/28/32），
  行高已绑在 token 上。**不要再写 `text-[13px]` 这类任意值**。
- **阴影**：`shadow-xs`（静止）、`shadow-sm`（悬停）；不要自造 box-shadow。
- **圆角**：`--radius` 10px，`rounded-lg` 用于按钮/列表项，`rounded-full` 只用于搜索框与筛选 chip。

## 界面结构（改样式前先读）

页面**没有分区标题**：分类由「左侧色点成段 + 段间距」表达，而不是小标题。

- `PillWall` 桌面端是**等宽网格**：`lg:grid lg:grid-cols-[repeat(auto-fill,minmax(172px,1fr))]`，
  列宽自动均分、右缘齐边；移动端退回 `flex-wrap` 的内容宽度（小屏等宽会把中文名截断）。
  块间用 `gap-8` 分段，**不要合并成一个大容器**。
  代价是行数变多、长站名会被截断（靠 `title` 兜底）——这是刻意的取舍，不要为了密度改回可变宽度。
- 按钮是 `h-9` + `rounded-lg` + `border` + `shadow-xs`，hover 只换底色/边框并升到 `shadow-sm`（不做位移）。
  内部是 `justify-between`：色点与文字贴左、箭头钉在右缘，**不要改回居中**——居中会让箭头连不成竖线。
- 侧栏：品牌行 + 折叠按钮 → 「随机一个」→ 足迹/全部 → 吸顶的「主题」标题 → 4 组分类 → 页脚。
  桌面可折叠成 48px 图标轨（`collapsible="icon"`）。分组来自 `data/categories.json` 的 `group`（只影响展示，
  不影响数据归属），组内图标来自同文件的 `emoji`（14px，固定 18px 宽）。
- 色点色相来自 `hueFor(index)`（8 个色相循环，index 是分类顺序）——
  **调整分类顺序会改变全站配色**，这不是 bug。深色模式走单独的 `dark:` 分支（L=0.75），不要复用浅色明度。
- 报头是「图标锚点 + 标题 + 右侧统计」：`pt-10 pb-6` + 底部 1px 细线，左侧 44px 圆角方块放分类 emoji，
  右侧只放「N 个主题 / 更新于」——**不要把这个计数再写一遍**。页头 `h-14`（移动）/ `h-16`（桌面）。

## 容易踩的坑

- **`scrollTo(0)` 必须在 `startViewTransition` 之前**，否则两张快照位置不同，过渡会位移。
- **skip link 必须「按需挂载」**：它平时不进 DOM，只在「焦点在 body 上按下第一次 Tab」时插入并聚焦。
  常驻 DOM 的话，路由切换后焦点会落到它身上，被 `:focus-visible` 点亮成一个盖在顶栏的按钮。
  另外路由变化时仍会把焦点交给 `#content`（`main.focus()`），作为第二道保险。
- **README 目录锚点会被 GitHub 转小写**（`### AI` → `#ai`），生成器里已 `toLowerCase()`，别改回去。
- **`src/components/ui/` 里的文件格式化后与 registry 原文不同**，再 `shadcn add` 覆盖同名文件会回到未格式化版本，
  跑一次 `npm run format` 即可。
- **`docs/screenshots/` 是二进制资源**，已在 `.prettierignore` 里排除。

## 验证方式

改动后至少要跑：

```bash
npm run verify      # 格式 + Markdown + ESLint + 数据 + README 一致性 + 单测 + 类型
npm run build       # 生成 README + 静态导出（CI 随后断言 out/index.html 里有 ≥100 个 target="_blank"）
git diff --exit-code -- README.md   # CI 会做：忘了重新生成 README 就挂
```

- **改过 `url` 就加跑 `npm run check:links`**：CI 的链接巡检每周只跑一次，这是当场发现死链的唯一机会。
- 涉及界面的改动，用 `npm run build && npm run start` 看导出产物（`out/`，4173 端口），
  桌面 1440、移动 390、深浅色各看一遍，不要只依赖类型检查和构建通过。
