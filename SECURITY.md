# 安全政策

## 上报漏洞

请**不要**公开提交 Issue 报告安全漏洞。请使用 GitHub 的私密上报通道：

<https://github.com/sopwise-ai/redbot/security/advisories/new>

（仓库 **Security → Report a vulnerability**。该通道需要仓库在
Settings → Code security 中开启 **Private vulnerability reporting**；若入口返回 404，
说明开关被关掉了，请开一个**不含任何细节**的 Issue 提醒维护者。）

报告中请尽量包含：

- 受影响的文件、组件或数据条目
- 复现步骤或最小复现样例
- 影响范围（能否影响线上站点、能否影响其他访客）
- 你建议的修复方式（可选）

不要在报告中附带真实凭据或个人数据，演示请使用本地环境。

本项目只提供这一条私密渠道，不提供 PGP 或安全邮箱。

We welcome reports in English. Please use the private channel above instead of a public issue.
We acknowledge within **7 business days** and follow a **90-day** coordinated disclosure window.

时间线：确认收到后每 **14 天**在 Advisory 里同步一次进展；判定为超范围或不予修复的，会在 7 个工作日内
说明理由并请你同意公开。涉及 `data/topics/` 的恶意外链属于紧急项，确认后 **72 小时**内下线并重新部署，
不受 90 天窗口约束。

## 项目构成

RedBot 是**纯静态站点**，这决定了安全边界：

| 组件     | 说明                                                                              |
| -------- | --------------------------------------------------------------------------------- |
| 站点     | Next.js（App Router，`output: "export"`），构建期生成 HTML，无服务端运行时        |
| 数据     | `data/topics.json` + `data/topics/*.json`，构建期完成校验与渲染                   |
| 构建脚本 | `scripts/generate-topics.ts`、`scripts/validate.ts`、`scripts/generate-readme.ts` |

**没有**后端服务、数据库、账号体系、Cookie、第三方统计脚本或外部字体请求。

## 支持的版本

| 版本                                | 支持状态          |
| ----------------------------------- | ----------------- |
| `main` 分支最新提交                 | ✅ 接受报告并修复 |
| 当前线上部署（<https://redbot.cc>） | ✅ 接受报告并修复 |
| 历史提交 / 已归档分支 / 第三方部署  | ❌ 不提供安全补丁 |

## 范围内（示例，非穷尽）

- **外链投毒 / 仿冒**：把已收录条目的 `url` 改到钓鱼或仿冒站点，包括域名近似
  （`weibo.com.evil.tld`）、IDN 同形字、跳转到安装包、「以 https 伪装」的恶意页面。
  判断标准是「用户以为自己在点 X」—— 这属于安全问题，不是数据争议
- **数据层注入**：能让 `data/topics/*.json` 通过校验、但生成 `javascript:` / `data:` / `vbscript:`
  URL 或畸形标签的路径
- **前端**：XSS（例如 `title` / `aria-label` 等属性拼接）、依赖引入的客户端漏洞、
  元数据注入（`metadataBase` / OG）
- **供应链**：npm 依赖、GitHub Actions 引用
- **构建脚本**：`scripts/` 在处理数据时的路径穿越或任意文件写入

## 范围外

- 本站外链指向的第三方站点（微博、知乎等）自身的安全问题 —— 请报给对应平台
- 条目排序、收录偏好与内容质量之争 —— 不是安全问题，走 [SUPPORT.md](./SUPPORT.md)
- 纯静态站点的流量型 DoS —— 由托管与 CDN 层负责
- 社会工程、物理访问、要求提供生产环境访问权

## 已有的防线

- 数据契约本身只接受 https（`src/lib/schema.ts` 的 `z.url({ protocol: /^https$/ })`），
  构建脚本另做 id / URL / 名称唯一、分类配额、标签白名单校验
- **构建失败即阻断部署**：`npm run build` 的第一步就是数据校验，数据不合法不会产出 `out/`。
  注意前提——若托管平台把构建命令改成裸 `next build`，或手动上传产物，这条门禁不生效
- 站点不加载任何第三方脚本、外部字体与统计代码；`target="_blank"` 一律带
  `rel="noopener noreferrer"`（CI 会在导出产物里断言）
- **没有设置任何 CSP 响应头**（`output: "export"` 下 `next.config` 的 `headers()` 也不生效）。
  需要 CSP 的部署方应在托管层自行加，例如
  `default-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'`。
  其中 `connect-src 'self'` 的价值最大：它能阻断把 `localStorage` 里的 `redbot:history` 外传
- 依赖与 Actions 的版本更新由 Dependabot 每周提出 PR（`.github/dependabot.yml`）。
  仓库**尚未**接入自动漏洞扫描，`npm audit` 需要手动执行；已知的告警会在对应 PR 里一并处理
- 修复会在 [CHANGELOG.md](./CHANGELOG.md) 的版本条目里记一条（`### 安全`），便于部署方核对
