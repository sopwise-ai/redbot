# 变更日志

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

本文件手动维护，是版本的唯一事实源；GitHub Release 的自动分组（`.github/release.yml`）只负责发布公告。

站点没有 npm API，**兼容面只有三样东西**：已发布条目的 `id`、`/topics/<slug>/` 路径、`localStorage` 里
`redbot:history` 的结构。删改这三者算 MAJOR，其余一律 MINOR / PATCH。

## [Unreleased]

<!-- 下个版本已合并但未发布的内容写在这里。首次发版时把这一段整体落成 ## [0.1.0] - YYYY-MM-DD -->

### 新增

- 189 条中文互联网信息源，分 17 个主题；单分类配额 20 条
- 纯静态站点：6 个路由（`/`、`/topics/`、`/topics/<slug>/`、`/search/`、`/history/`、404）在构建期全部渲染成
  HTML，无运行时请求
- 按主题筛选（`/topics/<slug>/`）与全站关键词搜索（`/search/?q=`，fuse.js），状态可分享、可直达
- 主题三态：浅色 / 深色 / 跟随系统（默认跟随系统），首帧无闪烁
- 足迹：点过的条目记在 `localStorage` 的 `redbot:history`（含时间与次数），`/history/` 按最近使用排序，
  支持单条删除与两步确认清空，不上传
- `/topics/` 主题索引页；侧栏按资讯 / 技术 / 生活 / 社区与工具 4 组归类，桌面可折叠成 48px 图标轨
- `⌘K` / `Ctrl+K` 聚焦搜索；清空或 `Esc` 回到来源页
- 分类切换使用 View Transitions，尊重 `prefers-reduced-motion`
- 自定义 404 页与 1200×630 分享图
- 数据校验：zod 契约、id/URL/名称唯一、分类配额、副标签白名单、只允许 https
- README 由 `data/` 自动生成，CI 校验其与数据一致

### 工程

- Next.js 15 App Router + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- `output: "export"` 静态导出，产物可部署到任意**根路径**静态托管（Nginx / Cloudflare Pages / Vercel）
- Prettier + markdownlint-cli2，CI 强制格式与文档规范
- Vitest 单元测试 19 例：数据规则（去重 / 配额 / 标签 / https）与 README 渲染（锚点大小写、标题唯一、竖线转义）
- GitHub Actions：PR 检查（格式 / 文档 / 数据 / 单测 / 类型 / 构建 / 产物）与每周链接巡检
- Release Notes 分组规则（`.github/release.yml`）与 Keep a Changelog 格式的变更日志
- Dependabot 按运行时 / 工具链 / Actions 分组升级
