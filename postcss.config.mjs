// Tailwind v4 内置 lightningcss，按目标浏览器自动加前缀，不需要 autoprefixer。
// 另注意：存在自定义 PostCSS 配置时，Next 不再注入自带的 postcss-preset-env。
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
