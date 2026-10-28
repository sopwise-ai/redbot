# RedBot — 给 AI 协作者的项目说明

> 本文件是**给 AI 编码助手看的**：只写「不看就会写错」的约定，不重复 README 的营销文案。
> 人类贡献者请读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 这是什么

中文互联网优质信息源的**极简快捷入口**。一页按钮，点一下直达目标站的榜单 / 列表页。
不做内容聚合、不做阅读器、不做账号、不做推荐算法 —— 这几条是定位红线，不是「暂未实现」。

## 技术栈

- Next.js 15（App Router）+ React 19 + TypeScript 5
- Tailwind CSS v4（CSS-first，token 在 `src/app/globals.css` 的 `@theme inline`）
- shadcn/ui（registry 组件，源码在 `src/components/ui/`，**不要手写等价控件**）
- fuse.js（客户端搜索）、next-themes（浅色 / 深色 / 跟随系统三态，切换器是 `src/components/theme-toggle.tsx`）、zod（数据契约）
- **`output: "export"` 纯静态**：构建期产出 `out/`，没有服务端运行时、没有 API 路由

## 命令

```bash
npm run dev          # 开发服务器 http://localhost:3000
npm run build        # 校验数据 → 生成 README → 静态导出
npm run verify       # 格式 + Markdown + 数据 + 类型（提交前跑这个）
npm run validate     # 只跑数据校验
npm run check:links  # 数据校验 + 逐个探测 URL 可达性（慢）
npm run test         # 单元测试（数据规则、README 渲染）
npm run readme       # 从 data/ 重新生成 README.md
```

## 目录

```text
data/                 links.json + categories.json —— 唯一内容源，PR 只改这里
src/app/              layout / page / globals.css / manifest / not-found / icon
src/components/       app-shell（状态与布局）、app-sidebar、pill-wall（按钮墙）、site-footer
src/components/ui/    shadcn 生成物，改样式前先看这里有没有现成变体
src/lib/schema.ts     zod 契约 + LIMITS（配额、副标签白名单）—— 规则的唯一事实源
src/lib/catalog.ts    取数与分组（构建期 parse，数据不合法直接构建失败）
scripts/validate.ts   校验器：唯一性、配额、标签白名单、可达性
scripts/generate-readme.ts  README 生成器
```

## 数据契约（改错这里最容易出事）

`data/links.json`：

```json
{ "id": "weibo-hot", "name": "微博热搜", "url": "https://s.weibo.com/top/summary", "tags": ["新闻", "热榜"], "desc": "十分钟前的全网议题" }
```

- `id`：kebab-case，**发布后不可修改**（统计与去重锚点）
- `name`：按钮文案，≤12 字符，优先 ≤6 汉字
- `url`：必须 https，指向具体页面而非站点首页
- `tags[0]`：主分类，必须存在于 `data/categories.json`
- `tags[1..]`：副标签，必须在 `src/lib/schema.ts` 的 `LIMITS.subtags` 白名单内
- `desc`：≤28 字，写「推荐理由」而不是百科介绍

`LIMITS`：单分类 ≤20 条、分类 ≤20 个。**加条目之前先看配额**，满了要先下架。

## 关键约定

1. **只改数据，不改 README**。`README.md` 由 `scripts/generate-readme.ts` 生成，CI 会校验它与数据一致。
2. **不写自定义控件**。需要按钮 / 输入框 / 徽章 / 空状态，先用 `src/components/ui/` 里已有的；
   缺组件就 `npx shadcn@latest add <name>`，不要手搓 `inline-flex h-9 rounded-md border` 这类变体等价物。
3. **不引入运行时外部请求**。没有第三方脚本、没有外部字体、没有统计代码；字体走系统栈。
4. **状态用 URL 表达**。`?tag=` 与 `?q=` 是筛选的唯一来源，用 `history.replaceState` 写回，不要用路由跳转。
5. **动效要尊重 `prefers-reduced-motion`**。分类切换用 View Transitions（`switchCategory`），
   不支持或减弱动效时直接切换；CSS 里已有全局兜底。
6. **构建期失败优先于运行时兜底**。数据不合法就让 `npm run build` 挂掉，不要写运行期容错。

## 界面结构（改样式前先读）

页面**没有分区标题**：分类由「左侧色点同色成段 + 段间距」表达，而不是小标题。

- `PillWall` 用 `flex-wrap` + 内容自适应宽度，整块左对齐（块间用间距分段，不合并成一个大 flex-wrap）；**不要给按钮写死宽度**，
  也不要用 `grid` 固定列数 —— 长度不一的名称会撑出不均匀的空格。
- 色点色相来自 `hueFor(index)`（8 个色相 × 3 档明度），`index` 是分类在
  `data/categories.json` 里的顺序。**调整分类顺序会改变全站配色**，这不是 bug。
- 深色模式色点走单独的 `dark:` 分支（固定 L=0.76），不要直接复用浅色的明度。

## 容易踩的坑

- **`scrollTo(0)` 必须在 `startViewTransition` 之前**，否则两张快照位置不同，过渡会位移。
- **README 目录锚点会被 GitHub 转小写**（`### AI` → `#ai`），生成器里已 `toLowerCase()`，别改回去。
- **`src/components/ui/` 里的文件格式化后与 registry 原文不同**，再 `shadcn add` 覆盖同名文件会回到未格式化版本，
  跑一次 `npm run format` 即可。
- **`docs/screenshots/` 是二进制资源**，已在 `.prettierignore` 里排除。

## 验证方式

改动后至少要跑：

```bash
npm run verify   # 格式 / Markdown / 数据 / 类型
npm run build    # 静态导出 + README 一致性
```

涉及界面的改动，另需用浏览器实际看一眼（桌面 1440、移动 390、深浅色各一），
不要只依赖类型检查和构建通过。
