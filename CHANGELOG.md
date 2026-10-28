# 变更日志

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 计划中

- 为条目补充图标（当前用分类色点占位）
- 收敛 `desc` 文案，去掉百科腔
- 深色模式下的 OG 分享图

## [0.1.0] - 未发布

首个公开版本，尚未打 tag。

### 新增

- 189 条中文互联网信息源，分 17 个主题；单分类配额 20 条
- 纯静态单页：构建期把全部按钮渲染进 HTML，无运行时请求
- 按主题筛选（`?tag=`）与关键词搜索（`?q=`，fuse.js），状态可分享、可前进后退
- 深色模式跟随系统；`⌘K` / `Ctrl+K` 聚焦搜索，`Esc` 清空
- 分类切换使用 View Transitions，尊重 `prefers-reduced-motion`
- 自定义 404 页与 1200×630 分享图
- 数据校验：zod 契约、id/URL/名称唯一、分类配额、副标签白名单、只允许 https
- README 由 `data/` 自动生成，CI 校验其与数据一致

### 工程

- Next.js 15 App Router + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- `output: "export"` 静态导出，产物可直接部署到任意静态托管
- Prettier + markdownlint-cli2，CI 强制格式与文档规范
- Vitest 单元测试 19 例：数据规则（去重 / 配额 / 标签 / https）与 README 渲染（锚点大小写、标题唯一、竖线转义）
- GitHub Actions：PR 检查（格式 / 文档 / 数据 / 单测 / 类型 / 构建 / 产物）与每周链接巡检
- Release Notes 分组规则（`.github/release.yml`）与 Keep a Changelog 格式的变更日志
- Dependabot 按运行时 / 工具链 / Actions 分组升级
