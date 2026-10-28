import { z } from "zod";

/**
 * 唯一数据契约。
 * 站点渲染、构建校验、README 生成、CI 全部复用这一份 schema，
 * 避免「数据规范」散落在多个脚本里各自实现一遍。
 */

export const linkSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id 必须是小写 kebab-case，且发布后不可修改"),
  name: z.string().min(1).max(20),
  url: z.url(),
  tags: z.array(z.string().min(1)).min(1).max(3),
  desc: z.string().min(1).max(28),
});

export const catalogSchema = z.strictObject({
  version: z.number().int().positive(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "updated 必须是 YYYY-MM-DD"),
  links: z.array(linkSchema).min(1),
});

export const categorySchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  label: z.string().min(1).max(6),
  blurb: z.string().min(1).max(24),
});

export const categoriesSchema = z.array(categorySchema).min(1);

export type LinkItem = z.infer<typeof linkSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type Category = z.infer<typeof categorySchema>;

/** 一组链接的展示模型：分类元信息 + 属于它的条目（顺序即优先级）。 */
export interface CategoryGroup extends Category {
  items: LinkItem[];
}

/** 全局约束，校验脚本与文档共用。 */
export const LIMITS = {
  /** 单个分类的条目上限：想加新的，先下架旧的。 */
  perCategory: 20,
  /** 分类总数上限，超过则过滤栏会失控。 */
  categories: 20,
  /** 副标签白名单，防止标签野蛮生长。 */
  subtags: [
    "热榜",
    "深度",
    "快讯",
    "国际",
    "数码",
    "硬件",
    "评测",
    "效率",
    "商业",
    "创业",
    "投资",
    "市场",
    "开源",
    "周刊",
    "问答",
    "云原生",
    "前端",
    "灵感",
    "作品集",
    "资源",
    "科普",
    "论文",
    "视频",
    "直播",
    "生活",
    "榜单",
    "影评",
    "游戏",
    "文化",
    "主机",
    "手游",
    "社区",
    "平台",
    "播客",
    "书评",
    "网文",
    "篮球",
    "足球",
    "课程",
    "语言",
    "软件",
    "搜索",
    "数据",
    "职场",
    "兴趣",
    "消费",
    "新能源",
    "产业",
    "资讯",
    "产品",
    "模型",
  ],
} as const;
