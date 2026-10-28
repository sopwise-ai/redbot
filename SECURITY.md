# 安全政策

## 上报漏洞

请**不要**公开提交 Issue 报告安全漏洞。请使用 GitHub 的私密上报通道：

<https://github.com/sopwise-ai/redbot/security/advisories/new>

（仓库 **Security → Report a vulnerability**。）

报告中请尽量包含：

- 受影响的文件、组件或数据条目
- 复现步骤或最小复现样例
- 影响范围（能否影响线上站点、能否影响其他访客）
- 你建议的修复方式（可选）

不要在报告中附带真实凭据或个人数据，演示请使用本地环境。

We welcome reports in English. Please use the private channel above instead of a public issue.
We acknowledge within **7 business days** and follow a **90-day** coordinated disclosure window.

## 项目构成

RedBot 是**纯静态站点**，这决定了安全边界：

| 组件     | 说明                                                                       |
| -------- | -------------------------------------------------------------------------- |
| 站点     | Next.js（App Router，`output: "export"`），构建期生成 HTML，无服务端运行时 |
| 数据     | `data/links.json` + `data/categories.json`，构建期完成校验与渲染           |
| 构建脚本 | `scripts/validate.ts`、`scripts/generate-readme.ts`                        |

**没有**后端服务、数据库、账号体系、Cookie、第三方统计脚本或外部字体请求。

## 支持的版本

| 版本                                | 支持状态          |
| ----------------------------------- | ----------------- |
| `main` 分支最新提交                 | ✅ 接受报告并修复 |
| 当前线上部署（<https://redbot.cc>） | ✅ 接受报告并修复 |
| 历史提交 / 已归档分支 / 第三方部署  | ❌ 不提供安全补丁 |

## 范围内（示例，非穷尽）

- **数据层注入**：能让 `data/links.json` 通过校验、但生成 `javascript:` / `data:` / `vbscript:`
  URL 或畸形标签的路径（当前校验只接受 https 且要求字段符合 zod schema）
- **前端**：XSS（例如 `title` / `aria-label` 等属性拼接）、依赖引入的客户端漏洞、
  元数据注入（`metadataBase` / OG）
- **供应链**：npm 依赖、GitHub Actions 引用
- **构建脚本**：`scripts/` 在处理数据时的路径穿越或任意文件写入

## 范围外

- 本站外链指向的第三方站点（微博、知乎等）自身的安全问题 —— 请报给对应平台
- 纯静态站点的流量型 DoS —— 由托管与 CDN 层负责
- 社会工程、物理访问、要求提供生产环境访问权

## 已有的防线

- 数据在构建期用 zod 校验：字段长度、`id` 唯一、URL 唯一、**只允许 https**、分类配额
- 站点不加载任何第三方脚本，CSP 面极小；`target="_blank"` 一律带 `rel="noopener noreferrer"`
- 依赖与 Actions 的更新由 Dependabot 持续提出 PR
- 构建失败即阻断部署：数据不合法时 `npm run build` 直接退出，不会产出坏页面
