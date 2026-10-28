import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["scripts/**/*.test.ts", "src/**/*.test.ts"],
    // 测试只覆盖纯逻辑（数据规则、README 渲染），不需要 DOM 环境
    globals: false,
  },
});
