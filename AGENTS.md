# RedBot — 给 AI 协作者的项目说明

> 本文件是**给 AI 编码助手看的**：只写「不看就会写错」的约定，不重复 README 的营销文案。
> 人类贡献者请读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 这是什么

中文互联网优质信息源的**极简快捷入口**。一页按钮，点一下直达目标站的榜单 / 列表页。
不做内容聚合、不做阅读器、不做账号、不做推荐算法 —— 这几条是定位红线，不是「暂未实现」。

设计取舍与实测数据见 [docs/DESIGN-LOG.md](./docs/DESIGN-LOG.md)；待人工核验的链接见 [docs/VERIFY.md](./docs/VERIFY.md)。
**本文件只写可执行的约束，理由和过程不在这里展开。**

## 技术栈

- Next.js 16（App Router）+ React 19 + TypeScript 5；Node 26（`.nvmrc` 锁定，CI 用 `node-version-file` 读同一个值）
- Tailwind CSS v4（CSS-first，token 在 `src/app/globals.css` 的 `@theme inline`）
- shadcn/ui（registry 组件，源码在 `src/components/ui/`；新增控件见下文约定 2）
- fuse.js（客户端搜索）、next-themes（浅色 / 深色 / 跟随系统三态，**默认深色**，切换器是 `src/components/theme-toggle.tsx`）、zod（数据契约）
- ESLint 10 + `eslint-config-next` 16（`eslint.config.mjs`，原生 flat config：core-web-vitals 入口 + TypeScript 规则入口，不再用 FlatCompat）
- **`output: "export"` 纯静态**：构建期产出 `out/`，没有服务端运行时、没有 API 路由

## 命令

```bash
npm run dev          # 开发服务器 http://localhost:3000（predev 生成主题入口与搜索语料）
npm run gen          # 由 data/ 生成 src/generated/topics.ts（改完主题文件要重跑，CI 会校验）
npm run corpus       # 由 data/ 生成 public/search-corpus.json（dev 改完数据要重跑）
npm run build        # 生成入口 / 搜索语料 → 校验数据 → 生成 README → 静态导出
npm run verify       # 格式 + Markdown + ESLint + 生成一致性 + 数据 + README + 单测 + 类型
npm run lint         # ESLint（next/core-web-vitals + next/typescript，flat config）
npm run clean        # 删 .next / out / tsbuildinfo
npm run validate     # 只跑数据校验
npm run check:links  # 数据校验 + 逐个探测 URL 可达性（慢，改过 url 才需要）
npm run test         # 单元测试（数据规则、README 渲染）
npm run readme       # 从 data/ 重新生成 README.md
npm run stats        # 数据概览：条数、首页占比、别名覆盖、搜索命中率
npm run format       # prettier 全量格式化（shadcn 覆盖过 ui/ 之后要跑）
```

## 目录

```text
data/topics.json      有序主题清单（slug 数组）—— 顺序即全站顺序
data/topics/<slug>.json  一个主题的全部内容：name / emoji / desc / updated / groups / links
data/topics.schema.jsonc 数据规范（字段、上限、跨文件约束）—— 改规则先改这里
src/app/              layout / page / globals.css / manifest / not-found / icon
                      + topics/（索引与 [slug]）/ search/ / history/ / about/
src/components/       app-shell（状态与布局）、link-card（链接卡，按钮墙 / 搜索 / 足迹共用）、
                      home-hero / home-sections（首页）、app-sidebar、pill-wall（按钮墙）、
                      history-view（足迹）、topics-index、site-footer
src/components/ui/    shadcn 生成物，改样式前先看这里有没有现成变体
src/generated/topics.ts  由脚本生成的主题静态入口（勿手改）
src/lib/schema.ts     zod 契约 + LIMITS（配额、副标签白名单）—— 规范的可执行镜像
src/lib/merge-topics.ts  主题文件 → 运行时模型（纯函数，有单测）
src/lib/catalog.ts    取数与切片（topics 摘要 / getTopic / homeSections / randomPool）
src/lib/corpus.ts     按需拉取 public/search-corpus.json（搜索、足迹、导出共用）
src/lib/history.ts    足迹读写（localStorage: redbot:history）；use-history.ts 是其 React 封装
src/lib/group-filter.ts  分组筛选（URL 解析 / 分组切片，纯函数）
src/lib/use-*.ts      外壳的 React hooks：搜索 / 分组 / 焦点交接 / 快捷键提示
src/lib/search.ts     fuse 索引；src/lib/site.ts 站点元信息（域名、仓库、作者）
scripts/              generate-topics.ts / generate-corpus.ts / validate.ts / generate-readme.ts
scripts/lib/load-topics.ts 读取 data/topics.json + data/topics/*.json（校验与 README 共用）
scripts/lib/checks.ts 校验规则本身（唯一性、配额、标签、https、首页提醒），有单测
scripts/lib/readme.ts README 渲染本身（纯函数），有单测
```

## 数据契约（改错这里最容易出事）

规范文件是 `data/topics.schema.jsonc`；下面只写最容易踩的部分。

```text
data/topics.json           ["news", "tech", "ai", …]        有序清单
data/topics/ai.json        { name, emoji, desc, updated, links: […] }   一个主题
```

主题文件：

- `name`：主题名，≤6 字；**同时是该主题下所有链接的主分类**，全局唯一
- `emoji`：单个 emoji，移动端抽屉与主题索引用
- `desc`：≤24 字，主题卡片与主题页副标题
- `updated`：`YYYY-MM-DD`，改这个文件时改成当天；全站「更新于」取所有主题的最大值，**没有全局日期字段**
- `groups`：可选的主题内分组（`slug` / `name` / 可选 `desc`），数组顺序即展示顺序；不分组就省略或写 `[]`
- `links`：1–500 条，顺序即优先级

链接（写在主题文件里）：

```json
{ "id": "weibo-hot", "name": "微博热搜", "url": "https://s.weibo.com/top/summary", "tags": ["热榜"], "desc": "十分钟前的全网议题" }
```

- `id`：kebab-case，**发布后不可修改**（统计与去重锚点）；与 URL、名称跨全部主题文件唯一
- `name`：按钮文案，硬上限 20 字符；超过 12 只在 `npm run validate` 里出「会被截断」的提醒，不阻断
- `url`：必须 https。指向榜单 / 快讯 / 列表页；首页只在「首页本身就是信息流」时接受
- `tags`：**0–2 个副标签**，必须在 `LIMITS.subtags` 白名单内；主分类由所在文件决定，这里不写
- `group`：可选，引用本主题 `groups` 里的 slug；不写 = 未分组，渲染在最后
- `aliases`：可选 0–5 个，写用户会打但名字里没有的写法（英文名 / 拼音首字母 / 旧名）；只影响搜索召回，不展示；必须全局唯一，且不能与任何站点的名称相同
- `desc`：≤28 字，写「推荐理由」而不是百科介绍

跨文件规则（`npm run validate` 强制）：清单 ↔ 目录双向一一对应、文件名 = slug、每条链接归入且只归入所在主题、链接的 id/url/name 全局唯一、每主题 1–500 条、每分组 1–100 条、主题 ≤20 个。分组引用必须存在，空分组报错；`all` / `ungrouped` 是 URL 保留字。**发布后 slug 与 id 都不可改**（slug 决定 URL 与文件路径）。

新增主题 = 新建 `data/topics/<slug>.json` + 在 `data/topics.json` 登记一行；两处不一致会直接报错。

## 关键约定

1. **只改数据，不改 README**。`README.md` 由 `scripts/generate-readme.ts` 生成，CI 会校验它与数据一致。
2. **不写自定义控件**。需要按钮 / 输入框 / 徽章 / 空状态，先用 `src/components/ui/` 里已有的；
   缺组件就 `npx shadcn@latest add <name>`，不要手搓 `inline-flex h-9 rounded-md border` 这类变体等价物。
3. **不引入运行时外部请求**。没有第三方脚本、没有外部字体、没有统计代码；字体走系统栈。
4. **足迹只存本地**。`/history/` 记录用户点过的链接（`localStorage` 的 `redbot:history`，含时间与次数），
   **不引入后端、不上传**；点击由 `LinkCard` 的 onClick 调用 `recordVisit`。管理（单条删除 / 批量 / 清空）都在页面内完成，
   清空走 `AlertDialog` 二次确认，避免误触。
5. **数据按路由切片，任何一页都不拿全量**。首页只带每个主题前 6 条（`homeSections`）；
   主题页只带当前主题（`getTopic`）；`/topics/`、`/search/`、`/history/` 只带 20 来个摘要；
   搜索 / 足迹 / 书签导出首次使用时按需拉 `public/search-corpus.json`；
   dev 下改完 `data/` 要重跑 `npm run gen`（主题入口）和 `npm run corpus`（搜索语料），否则页面/搜索会读到旧数据。
   **不要把 `getGroups()` 再传进 `AppShell`**——那等于把全站数据塞回每一页。
6. **分类在路径里，搜索是状态**。`/topics/<slug>/` 是静态页；切主题是 `router.push` / `<Link>` 导航，
   不再用 `setActive` + `history.replaceState`，也不套 View Transition。
   搜索仍是顶栏即搜即显、全站范围；先名称/别名（精确 → 前缀），再 Fuse 模糊；0 结果给「你是不是想找」与主题建议；
   地址栏 `/search/?q=`，清空或 Esc 回到来源页（`originPath`）。
7. **动效要尊重 `prefers-reduced-motion`**。没有分类切换动画；其他过渡保持 CSS 兜底。
8. **构建期失败优先于运行时兜底**。数据不合法就让 `npm run build` 挂掉，不要写运行期容错。

## 文案三层（改界面文案前先读）

品牌文案只有一个来源：`src/lib/site.ts`。三层各管一件事，**不要临时造新的卖点句**：

| 字段       | 内容                                     | 用在哪                                    |
| ---------- | ---------------------------------------- | ----------------------------------------- |
| `tagline`  | 中文网站精选清单                         | 首页 H1、浏览器标题、manifest、顶栏、页脚 |
| `subtitle` | 上网，一站就够了                         | 首页副行、README 引用行                   |
| `trust`    | 免费 · 开源 · 无广告 · 无追踪 · 不用注册 | 首页副行下的信任行、README、分享文案      |

- `tagline` 是**名词短语**，不是句子。改成「一个按钮直达…」这类句子会让品类消失，回到「看不出这是什么站」。
- 分类页 H1 用分类名、副行用 `desc`；品牌三层**只在首页**出现（`isHome`）。
- 首页 H1 是 8 个字，移动端 `text-4xl`（36px）、平板 `text-6xl`（60px）、桌面 `text-7xl`（72px，**无衬线 600**）；再加长要先量 390px。
  hero 是 **Linear 式排印**：无卡片、无产品截图，靠字号对比（72px 标题 / 12px 眉标）+ 标题后方一层极淡红晕建立层级。
- 条目 `desc` 写使用时机（「查公司股权和诉讼，先看这里」），不写公司简介。

## 设计 token（改样式前先读）

- **颜色**：**深色优先**（默认 `dark`）：近黑画布 `oklch(0.145 0.004 264)` + 略亮一档的面板
  （card `0.185` / sidebar `0.165`），靠 8% 白线分层。浅色是冷白 `0.98` + 纯白卡片，移动端抽屉 `0.965`。
  **不要引入暖黄/米色**：那会把站点拉回「纸上杂志」，和 Linear 那一路相冲。
  `--border` 只用于必须的边界。
  **红色只用于品牌标识、主 CTA、移动端抽屉当前位置与 hover**；筛选 chip 的选中态用前景/背景黑白反转，
  不要用红色，也不要用它装饰计数、徽章。
  **焦点环用中性灰**（`--ring`），不是品牌红：红色焦点环在图标按钮上会被误读成「错误」。
- **字号**：直接用 Tailwind 默认阶梯（`text-xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24 / 3xl 30 /
4xl 36 / 5xl 48 / 6xl 60 / 7xl 72`）。
  13px 那一档已经删掉，**不要再写 `text-[13px]`、`text-2xs`、`text-md`**。
- **字体**：全站**只有无衬线**（`--font-sans`）+ 等宽（`--font-mono`，只给代码/Kbd）。
  标题也用 sans：weight 600、`tracking-[-0.02em]`，不要引入衬线，也不要第三套字体。
  `font-synthesis: none` —— 没有的权重宁可落回最近的真实字重，也不要浏览器合成的假粗。
- **标题**：H1 36 / 60 / 72（weight 600）；首页主题 h2 18（weight 600）；卡片标题 14；元信息 12。
- **阴影**：默认**不用阴影**，靠 1px 线与底色差分层；只有 Popover / Dialog / 浮层（skip link）用 `shadow-lg`。
- **圆角**：`--radius` **8px**；卡片与按钮用 `rounded-lg` / `rounded-xl`（同为 8px），
  `rounded-full` 只保留给筛选 chip 与状态点。
- **主题色块**：主题 emoji 坐在 `oklch(0.965 0.022 <hue>)` 的淡色方块里（深色 `0.27 0.02`），
  色相来自 `hueFor(主题在 topics.json 里的下标)`；卡片内的色点用 `oklch(0.62 0.12 <hue>)`（深色 `0.72 0.10`），
  保证「一个主题一种颜色」。彩度不要加回去：近黑底上高饱和会变成玩具感。

## 界面结构（改样式前先读）

首页 = `HomeHero`（品牌三层 + 两个动作）+ 17 个主题预览（每个 6 条）+ 收尾卡片；
主题页 = 报头 + 分组筛选 + 卡片墙 + 前后翻页；其余视图共用 `ShellHeader` + 内容区。

- **能用 shadcn 就不要手写**：链接卡是 `Item asChild`（`ItemMedia` 放色点、`ItemTitle` 放名称、
  `ItemDescription` 放推荐理由 / 足迹元信息、`ItemActions` 放箭头）；搜索框是 `InputGroup`
  （`InputGroupAddon` + `InputGroupInput` + `InputGroupButton`）；空状态是 `Empty`；
  加载占位是 `Skeleton`；清空足迹用 `AlertDialog`；FAQ 用 `Accordion`；分组筛选用 `ToggleGroup`。
  **不要退回到 `inline-flex h-9 rounded-md border px-3` 这类手写变体。**
- **按钮墙**是 `grid gap-2 sm:grid-cols-2 xl:grid-cols-3` 的等宽网格，不再是可变宽度的 flex-wrap：
  三列在 1200px 容器里刚好 373px 一列，中文名不会截断，右缘自然齐边。
  行高 48px（含说明 62px），hover 只换底色 / 边框，**不加阴影、不做位移**。
- **每张卡内部是 `justify-between` 的两端结构**：色点与文字贴左、箭头钉在右缘，不要改回居中。
- **顶部导航（桌面）**：两行吸顶，总高 108px。
  第一行 `h-16`：品牌 + 居中搜索 + 「随机一个」（ghost，**不要再用红色**）+ 主题 / GitHub；
  第二行 `h-11`：首页 / 足迹 / 全部主题（固定）+ 可横滑的分类条 + 右端「全部分类」面板。
  分类条**不带计数**（17 个名字在 1200 容器里刚好排下），计数只在面板里；
  当前项用 2px 红色下划线，不用红色底纹。**桌面不再有侧栏。**
- **移动端**：只保留 64px 顶栏（菜单 + 品牌点 + 搜索 + 主题）+ 抽屉；抽屉里是品牌、
  「随机一个」、页面入口与 17 个主题，当前项左侧 3px 红色竖条。
  主题顺序即 `data/topics.json` 的顺序，**调整顺序会改变全站配色**，这不是 bug。
- **报头**：淡色 emoji 方块（44/48px，色相跟随主题）+ H1（无衬线 600）+ 计数 `Badge` + 副标题；
  右侧只放「分享 / 在 GitHub 编辑」。**不要重复写「N 个主题 / 更新于」**——hero 刊头行（左总条数、右日期）与页脚各一处。
- **主题页底部**有「上一个 / 下一个主题」两个等宽按钮卡，顺序即 `data/topics.json`；
  关于页在 `xl` 以上有 sticky 目录，两者都是为了让长页面有出口，不要删。

## 容易踩的坑

- **dev 下不启用 `output: "export"`**（见 `next.config.ts`）：否则访问已删除或未知的主题会抛
  「missing param in generateStaticParams」，而不是 404。构建时仍按纯静态导出。
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
npm run build       # 生成语料/README + 静态导出（CI 断言首页有 ≥80 个 target="_blank"）
git diff --exit-code -- README.md   # CI 会做：忘了重新生成 README 就挂
```

- **改过 `url` 就加跑 `npm run check:links`**：CI 的链接巡检每周只跑一次，这是当场发现死链的唯一机会。
- 涉及界面的改动，用 `npm run build && npm run start` 看导出产物（`out/`，4173 端口），
  桌面 1440、移动 390、深浅色各看一遍，不要只依赖类型检查和构建通过。
