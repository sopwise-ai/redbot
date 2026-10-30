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
    // 测试只覆盖纯逻辑（数据规则、README 渲染），不需要 DOM 环境
    environment: "node",
    globals: false,
    // 与 Vitest 默认的 include 对齐：否则新增 .test.tsx / .spec.ts 会被静默漏跑
    include: ["{scripts,src}/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    // 显式 exclude 是整体替换（默认只有 node_modules 与 .git），
    // 防止把 .next/、out/ 里的同名文件当测试跑
    exclude: ["**/node_modules/**", "**/.git/**", ".next/**", "out/**", "coverage/**"],
  },
});
