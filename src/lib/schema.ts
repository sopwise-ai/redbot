import { z } from "zod";

import { normalizeKeyword } from "@/lib/keyword";

/**
 * 唯一数据契约（规范见 data/topics.schema.jsonc）。
 * 站点渲染、构建校验、README 生成、CI 全部复用这一份 schema，
 * 避免「数据规范」散落在多个脚本里各自实现一遍。
 */

/** 全局约束，校验脚本与文档共用。 */
export const LIMITS = {
  /** 单个主题的条目上限：想加新的，先下架旧的。 */
  perCategory: 20,
  /** 主题总数上限，超过则过滤栏会失控。 */
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

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "必须是小写 kebab-case（同时是文件名与 URL 路径）");

/** 真实存在的日历日期：2026-02-30 / 2026-13-40 这类形状合法但不存在的日期要拒绝。 */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "updated 必须是 YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "updated 不是真实存在的日期");

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

/** 单个字形：⌨️（含变体选择符）、👨‍👩‍👧‍👦、🇨🇳 都算一个，普通多字符文案会被拒绝。 */
const emojiSchema = z
  .string()
  .min(1, "emoji 不能为空")
  .refine((value) => [...segmenter.segment(value)].length === 1, "emoji 必须是单个字符");

/**
 * 主题文件里的条目：主分类由所在文件决定，`tags` 只写 0–2 个副标签。
 * 合并进 catalog 时会被补上主分类（见 mergeTopics）。
 */
export const topicLinkSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id 必须是小写 kebab-case，且发布后不可修改"),
  name: z.string().min(1).max(20, "name 最多 20 个字符"),
  // 只接受 https：让契约本身成立，dev 与裸 `next build`（跳过 scripts/validate）也拦得住
  url: z.url({ protocol: /^https$/, error: "url 必须是 https 地址" }),
  tags: z
    .array(z.string().min(1))
    .max(2, "副标签最多 2 个")
    .refine((tags) => new Set(tags).size === tags.length, "副标签不能重复")
    .default([]),
  /** 用户会打、但名字里没有的写法：英文名、拼音首字母、旧名、同义说法。只用于搜索召回。 */
  aliases: z
    .array(z.string().min(1).max(20, "别名最多 20 个字符"))
    .max(5, "别名最多 5 个")
    .refine(
      (aliases) => new Set(aliases.map(normalizeKeyword)).size === aliases.length,
      "别名不能重复",
    )
    .default([]),
  desc: z.string().min(1).max(28, "desc 最多 28 个字"),
});

/** 一个主题文件：data/topics/<slug>.json，slug 由文件名决定，不写在文件里。 */
export const topicFileSchema = z.strictObject({
  name: z.string().min(1).max(6, "name 最多 6 个字"),
  /** 侧栏与主题索引用的 emoji 图标，必须是一个字形 */
  emoji: emojiSchema,
  desc: z.string().min(1).max(24, "desc 最多 24 个字"),
  updated: isoDateSchema,
  links: z
    .array(topicLinkSchema)
    .min(1, "每个主题至少 1 条链接")
    .max(LIMITS.perCategory, `每个主题最多 ${LIMITS.perCategory} 条链接`),
});

/** data/topics.json：有序主题清单，顺序即全站顺序。 */
export const topicsManifestSchema = z
  .array(slugSchema)
  .min(1, "至少登记 1 个主题")
  .max(LIMITS.categories, `主题最多 ${LIMITS.categories} 个`);

export type TopicLink = z.infer<typeof topicLinkSchema>;
export type TopicFile = z.infer<typeof topicFileSchema>;

/** 合并后的展示模型（运行时不再有 zod 校验：数据在构建期已按主题校验过）。 */
export interface LinkItem {
  id: string;
  name: string;
  url: string;
  /** 全部标签：`tags[0]` 是主分类（由所在主题文件补上），其余是副标签 */
  tags: string[];
  /** 搜索别名（可选；为空时不下发） */
  aliases?: string[];
  desc: string;
}

export interface Catalog {
  /** 全站「更新于」：所有主题文件 updated 的最大值 */
  updated: string;
  links: LinkItem[];
}

export interface Category {
  slug: string;
  name: string;
  emoji: string;
  desc: string;
}

/** 一组链接的展示模型：分类元信息 + 属于它的条目（顺序即优先级）。 */
export interface CategoryGroup extends Category {
  items: LinkItem[];
}
