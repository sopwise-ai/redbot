# 获取帮助

## 先自查

1. 收录标准、字段规范、配额：[CONTRIBUTING.md](./CONTRIBUTING.md)
2. 本地跑不跑得起来：按 [`.nvmrc`](./.nvmrc) 切到 Node 22 → `npm install` → `npm run verify`
   （报错输出的尾部就是我们需要的信息）

自建部署只支持 `npm run build` 产出的 `out/` 静态目录（见 [README](./README.md) 的本地开发一节）；
托管平台侧的配置问题不在支持范围。

## 我该去哪里提问

Issue 是**唯一**沟通渠道：本仓库没有 Discord / 微信群，也没有开启 Discussions。
请先[搜索已有 Issue](https://github.com/sopwise-ai/redbot/issues?q=is%3Aissue)，再选对应模板
（模板名就是下面括号里的原文，模板会自动带上标签）：

| 需求               | 渠道                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 新增或更正信息源   | [新增或更正信息源](https://github.com/sopwise-ai/redbot/issues/new?template=link-suggestion.yml)                                         |
| 链接失效或指错页   | [链接失效或指错页](https://github.com/sopwise-ai/redbot/issues/new?template=broken-link.yml)                                             |
| 可复现的缺陷       | [缺陷报告](https://github.com/sopwise-ai/redbot/issues/new?template=bug_report.yml)                                                      |
| 功能建议           | [功能建议](https://github.com/sopwise-ai/redbot/issues/new?template=feature_request.yml)                                                 |
| 使用问题、部署疑问 | [开新 Issue](https://github.com/sopwise-ai/redbot/issues/new)（空白模板，请自己加 `question` 标签）                                      |
| 安全漏洞           | 不要开公开 Issue，直接走 [GitHub 私密上报](https://github.com/sopwise-ai/redbot/security/advisories/new)（见 [安全政策](./SECURITY.md)） |
| 参与开发           | 见 [贡献指南](./CONTRIBUTING.md) 与 [行为准则](./CODE_OF_CONDUCT.md)                                                                     |

只想加一个链接？直接提 Pull Request 比开 Issue 更快 —— 流程见
[贡献指南](./CONTRIBUTING.md)，CI 会替你检查格式、重复与配额。

## 我们接受与不接受什么

- **接受**：站点与构建脚本的缺陷、界面与交互改进、数据条目的新增与更正、文档修正
- **也接受（本仓库负责）**：已收录链接打不开、跳到首页、被要求登录、站点易主 —— 这属于收录维护问题，
  走「链接失效或指错页」模板，我们会改指向或下架
- **不接受**：第三方站点的账号、内容质量与访问限制（请报给该平台）；本机环境问题
  （请先按 [`.nvmrc`](./.nvmrc) 切到 Node 22 再试）；要求收录商业推广或需登录才能看的页面；
  索取生产环境访问权

## 响应预期

项目由小团队维护，Issue 通常在 **7 个工作日内**首次回复，不承诺修复时间。提交问题时请附上：

- 站点地址（`redbot.cc` 或你的自建部署）与页脚显示的「更新于」日期；自建部署请附构建对应的提交哈希
- `npm run verify` 的相关输出（若涉及构建或数据校验）
- 涉及界面时附截图或录屏 —— 请避开 `/history/` 页：那是只存在本机的点击足迹，截图会把它带出来，
  其余个人信息也请遮掉

## Support in English

Questions and pull requests are welcome in English or Chinese. Please search the
[existing issues](https://github.com/sopwise-ai/redbot/issues?q=is%3Aissue) first, then open one with
the matching template.

- **First response:** within 7 business days. We do not promise a fix date.
- **Replies** may be written in Chinese; ask if you need an English summary.
- **Security:** use the private channel in [SECURITY.md](./SECURITY.md), never a public issue.
- **Out of scope:** problems with the linked third-party sites themselves, and local environment
  issues (use the Node version in [`.nvmrc`](./.nvmrc)).
- This repository has no Discussions or chat channel; Issues are the only channel.
