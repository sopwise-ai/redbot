import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

export default defineConfig({
  // 与 tsconfig 的 paths 对齐：src 下的测试用 @/ 与 @data/ 导入，没有 alias 会直接找不到包。
  // 用正则形式，保证 /^@data\// 先于 /^@\// 匹配（否则 @data/... 会被 @/ 抢先吃掉）。
  resolve: {
    alias: [
      { find: /^@data\//, replacement: `${resolve(root, "data")}/` },
      { find: /^@\//, replacement: `${resolve(root, "src")}/` },
    ],
  },
  test: {
    // scripts/ 与 src/lib/ 的纯逻辑用 node；history.ts 要真 localStorage，逐文件覆盖为 happy-dom
    environment: "node",
    globals: false,
    // 用 Vitest 默认的文件名模式（含 .test.tsx / .spec.ts），且不要收窄到某个目录：
    // 一旦写成 {scripts,src}/**，落到其他目录的测试会被静默漏跑。要挡的是构建产物，交给 exclude。
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    // 显式 exclude 是整体替换（默认只有 node_modules 与 .git），所以默认两条必须抄回来；
    // 其余条目：.next/out/coverage 是构建产物，.worktrees/ 是隔离工作区（每份带完整副本，
    // 放宽 include 后会被扫到并重复跑测试 —— 这是实测过的，不是假设）
    exclude: [
      "**/node_modules/**",
      "**/.git/**",
      ".next/**",
      "out/**",
      "coverage/**",
      ".worktrees/**",
    ],
    // 覆盖率只看有逻辑的模块：React Hook（use-*）、常量表（site）、
    // 纯转发（utils）没有可测行为，纳入只会稀释指标、逼人写形式主义测试。
    // 阈值按当前真实水位（行 96%+）设 90%：留余量，跌破才拦。
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["scripts/lib/**/*.ts", "src/lib/**/*.ts"],
      exclude: [
        "**/*.{test,spec}.?(c|m)[jt]s?(x)",
        "src/lib/use-*.ts",
        "src/lib/site.ts",
        "src/lib/utils.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 80,
      },
    },
  },
});
