import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16.x 起提供原生 flat config（core-web-vitals / typescript 两个入口），
// 不再需要 FlatCompat 桥接；对应的规则集要求 ESLint >= 9，本仓库用 10.x。
const config = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "next-env.d.ts",
    "**/*.tsbuildinfo",
    "coverage/**",
    ".worktrees/**",
  ]),
  ...nextVitals,
  ...nextTs,
  {
    // shadcn registry 代码：`npx shadcn add` 会整文件覆盖，改在这里的写法留不住。
    // 目前唯一触发的是 sidebar 骨架屏用 Math.random() 生成随机宽度（刻意的视觉抖动）。
    files: ["src/components/ui/**"],
    rules: {
      "react-hooks/purity": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
]);

export default config;
