# 贡献指南

RedBot 的价值不来自「收得多」，而来自**收得准**。所以门槛是刻意设高的。

参与之前请先读 [行为准则](./CODE_OF_CONDUCT.md)；安全漏洞请走 [安全政策](./SECURITY.md)；
使用类问题见 [获取帮助](./SUPPORT.md)。

## 最快的路径

1. Fork 仓库，改 [`data/topics/<主题>.json`](./data/topics/)（新增主题时才动 `data/topics.json`，再跑一次 `npm run gen`）
2. 本地：`npm install` → `npm run readme` → `npm run verify`
3. 提交 PR，**把 `npm run readme` 重新生成的 `README.md` 一起提交**
4. CI 检查格式、重复、配额、README 一致性；维护者只做价值判断

**不要手改 `README.md`** —— 它由 `npm run readme` 从数据生成。改完数据跑一次生成，把产物一起提交，
否则 CI 的 `README up to date` 会失败。

## 收录标准

### 硬性（任一不满足即拒）

1. **未登录可见** —— 打开就能看到内容。需要登录、需要 App、需要扫码的，不收。
2. **指向具体的页** —— 榜单、快讯流、列表页、广场。**站点首页原则上不接受**（例外：首页本身就是信息流的门户）。
3. **是信息源** —— 用户来这里是为了「看信息」，不是「买东西」或「办公」。电商、网盘、会议工具不属于这里。
4. **可访问** —— https，中文用户能正常打开。

### 软性

更新频率、内容独家性、界面广告密度、是否为该领域的事实标准。

### 配额

**每个主题最多 20 条。** 满了就得先下架一条 —— 约束比自觉更可靠，这条规则是为了防止目录膨胀成 hao123。

## 字段规范

| 字段   | 规则                       | 说明                                                                                                |
| ------ | -------------------------- | --------------------------------------------------------------------------------------------------- |
| `id`   | 小写 kebab-case，全局唯一  | **发布后不可修改**，是统计与去重的锚点                                                              |
| `name` | ≤ 20 字符，优先 ≤ 6 个汉字 | 就是按钮上的字；超过 12 字符只提醒不拦，但长了会在按钮里被截断                                      |
| `url`  | https，指向具体页面        | 见上面的收录标准                                                                                    |
| `tags` | 0–2 个                     | 只写副标签，必须在 `src/lib/schema.ts` 的 `LIMITS.subtags` 白名单里；主分类由链接所在的主题文件决定 |
| `desc` | ≤ 28 字                    | **写推荐理由，不写百科介绍**。「每天更新三次，财经快讯最快」优于「专业的财经资讯平台」              |

改完数据，把**该主题文件顶部的 `updated`** 改成提交当天的日期（`YYYY-MM-DD`）。页头「更新于」取所有主题文件的最大值，不需要维护全局日期。

校验分成两档，别把提醒当通过：

- **拦下**（非 0 退出）：id / URL / 名称重复、主题配额超限、副标签不在白名单、清单与目录对不上、非 https
- **只提醒**：`name` 超过 12 字符、URL 指向站点首页。这两条靠人判断

## 新增主题

主题不是越多越好 —— 上限 20 个（`LIMITS.categories`）。

两步：

1. 新建 `data/topics/<slug>.json`（slug 为小写 kebab-case，同时是 `/topics/<slug>/` 路径）：

   ```json
   {
     "label": "阅读",
     "emoji": "📚",
     "blurb": "书与长文字",
     "updated": "2026-11-02",
     "links": [
       {
         "id": "example-source",
         "name": "示例信息源",
         "url": "https://example.com/hot",
         "tags": ["书评"],
         "desc": "一句话说清它为什么值得点"
       }
     ]
   }
   ```

2. 在 `data/topics.json` 里登记这个 slug，**位置决定它在侧栏、主题索引和 README 里的顺序**。

- `label`：≤ 6 字，同时是该主题下所有链接的主分类
- `emoji`：单个字符，侧栏图标
- `blurb`：≤ 24 字的副标题
- `updated`：最后一次修改日期
- `links`：1–20 条，顺序即优先级

文件名必须与清单里的 slug 一致；两处对不上，`npm run validate` 会直接报错。

另外需要：在 PR 里说明为什么现有主题装不下；至少准备 5 条符合标准的条目（校验器只要求主题非空）。

> 主题顺序还会决定配色（`hueFor(index)`），调换顺序会改变全站色点颜色，属预期行为。

## 本地开发

环境：Node 版本以 [`.nvmrc`](./.nvmrc) 为准（在仓库根目录跑 `nvm use`），包管理器用 npm（有 `package-lock.json`）。
两个版本号是刻意不同的，别「顺手统一」：`.nvmrc`（24）锁定**开发/CI 实际使用的版本**，
`package.json` 的 `engines`（>=22.12.0）是**可运行的最低版本**——前者跟着 LTS 升级，后者只在
用到新 API 时才抬。

```bash
npm install
npm run dev          # http://localhost:3000
npm run verify       # 格式 + Markdown + ESLint + 数据 + README 一致性 + 单测 + 类型（CI 也跑这些）
npm run validate     # 只跑数据校验
npm run check:links  # 数据校验 + 逐个探测 URL 可达性（较慢，改过 url 才需要）
npm run test         # 单元测试（数据规则与 README 渲染）
npm run readme       # 从 data/ 重新生成 README.md
npm run lint         # ESLint（React Hooks 依赖、未使用变量等）
npm run format       # prettier 全量格式化
npm run build        # 校验 + 生成 README + 静态导出到 out/（CI 另跑这一步和 README 一致性检查）
```

涉及界面改动时，请跑 `npm run build && npm run start` 看导出产物（`out/`，4173 端口），
并附桌面 1440、移动 390、深浅色各一的截图。

## 发现问题怎么办

先搜一遍已有 Issue，再选模板。四种模板（新增或更正信息源 / 链接失效或指错页 / 缺陷报告 / 功能建议）
的具体入口见 [SUPPORT.md](./SUPPORT.md) —— 那里是唯一事实源，模板会自动带上 `links` / `bug` /
`enhancement` 标签。

安全漏洞与行为准则问题**不要**开公开 Issue，走 [安全政策](./SECURITY.md) 的私密通道。

## 提交信息

推荐 [Conventional Commits](https://www.conventionalcommits.org/)，便于生成变更说明：

```text
feat: 新增 AI 分类下的三个信息源
fix: 修正抽屉新热榜的域名
chore(deps): 升级 next 到 15.5.28
```

`type` 用 `feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `build` / `ci` / `chore`。
**CI 暂不强制校验提交信息**，但依赖升级由 Dependabot 自动按此格式生成。

提交信息、Issue、PR 用中文或英文都可以。**无需签署 CLA 或 DCO**，提交即表示同意以
[MIT](./LICENSE) 授权。

## 分支与 PR

- 从 `main` 切分支，命名随意（`feat/xxx`、`fix/xxx`、`data/add-xxx`）
- **一个 PR 只做一件事**：一条链接，或同一主题的一组链接。别把「加三个源 + 改样式 + 升依赖」混在一起
- 合并用 squash，合并后维护者删分支
- 数据 PR 的正文按 [PR 模板](.github/PULL_REQUEST_TEMPLATE.md) 填表即可

## 常见 CI 失败

| 报错                   | 处理                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `Format check` 挂      | 跑 `npm run format` 再提交                                  |
| `Markdown lint` 挂     | 看输出的规则号与文件行号；行宽（MD013）已关，其余都是真问题 |
| `README up to date` 挂 | 跑 `npm run readme`，把生成的 `README.md` 一起提交          |
| `Validate data` 挂     | 输出会指明具体规则（重复 / 配额 / 标签 / https），按提示改  |
| `Unit tests` 挂        | 跑 `npm test` 看断言；数据规则改动才会影响它                |

## 标签

不需要自己打标签：Issue 模板会自动带上 `links` / `bug` / `enhancement`，Dependabot 会带
`dependencies` / `ci`。PR 由维护者在合并前补标，标签只用于生成 Release Notes（见
[`.github/release.yml`](./.github/release.yml)）。

## 审核节奏

维护者会在 **7 个工作日内**给出第一次回应：合并、要求修改，或说明拒绝理由。
被拒不代表源不好，可能只是分类已满或定位不符。

## 维护者备忘

贡献者可以跳过这一节。首次启用仓库 / 每次发版时要做的事：

- [ ] 在 GitHub 上创建标签 `bug` / `links` / `enhancement` / `dependencies` / `ci` / `documentation`
- [ ] Settings → Code security 里开启 **Private vulnerability reporting**
      （`SECURITY.md` 与 `CODE_OF_CONDUCT.md` 的私密通道都依赖它）
- [ ] 开启分支保护：`main` 需要 `ci` 检查通过才能合并
- [ ] 发版：改 `package.json` 与 `package-lock.json` 的版本号 → 把 `## [Unreleased]` 落成
      `## [x.y.z] - YYYY-MM-DD` → 打 `vX.Y.Z` tag → 按 `.github/release.yml` 生成 Release Notes
