import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadTopics } from "./load-topics";

const dirs: string[] = [];

const topic = (over: Record<string, unknown> = {}) => ({
  label: "AI",
  emoji: "🤖",
  blurb: "模型、论文与新工具",
  updated: "2026-10-28",
  links: [
    {
      id: "qbitai",
      name: "量子位",
      url: "https://www.qbitai.com/",
      tags: ["快讯"],
      desc: "AI 进展的日常追踪",
    },
  ],
  ...over,
});

/** 造一个临时的 data/ 目录；topics 传原始字符串可以模拟坏 JSON。 */
function makeData(
  manifest: unknown,
  topics: Record<string, unknown>,
  { withDir = true, rawTopics = false } = {},
) {
  const dir = mkdtempSync(join(tmpdir(), "redbot-topics-"));
  dirs.push(dir);
  writeFileSync(join(dir, "topics.json"), JSON.stringify(manifest));
  if (withDir) mkdirSync(join(dir, "topics"), { recursive: true });
  for (const [slug, data] of Object.entries(topics)) {
    writeFileSync(
      join(dir, "topics", `${slug}.json`),
      rawTopics && typeof data === "string" ? data : JSON.stringify(data),
    );
  }
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("loadTopics", () => {
  it("按清单顺序读取主题，并原样返回解析结果", () => {
    const dir = makeData(["ai", "news"], {
      ai: topic(),
      news: topic({ label: "新闻", emoji: "📰", blurb: "今天发生了什么" }),
    });

    const { entries, errors } = loadTopics(dir);
    expect(errors).toEqual([]);
    expect(entries.map((entry) => entry.slug)).toEqual(["ai", "news"]);
    expect(entries[0].file.label).toBe("AI");
    expect(entries[1].file.links[0].id).toBe("qbitai");
  });

  it("清单里有、文件没有 → 报错并跳过该主题", () => {
    const dir = makeData(["ai", "news"], { ai: topic() });

    const { entries, errors } = loadTopics(dir);
    expect(entries.map((entry) => entry.slug)).toEqual(["ai"]);
    expect(errors).toContain("清单里有「news」，但 data/topics/news.json 不存在");
  });

  it("文件有、清单没有 → 报错", () => {
    const dir = makeData(["ai"], { ai: topic(), news: topic() });

    expect(loadTopics(dir).errors).toContain(
      "data/topics/news.json 没有登记在 data/topics.json 里",
    );
  });

  it("主题 JSON 语法错误 → 报错但继续读其余文件", () => {
    const dir = makeData(["ai", "news"], { ai: "{ 坏 JSON", news: topic() }, { rawTopics: true });

    const { entries, errors } = loadTopics(dir);
    expect(errors.some((error) => error.startsWith("data/topics/ai.json 读取失败"))).toBe(true);
    expect(entries.map((entry) => entry.slug)).toEqual(["news"]);
  });

  it("主题不符合 schema → 报错里带文件路径与字段路径", () => {
    const dir = makeData(["ai"], { ai: topic({ label: "这个主题名字太长了" }) });

    const { entries, errors } = loadTopics(dir);
    expect(entries).toEqual([]);
    expect(errors.some((error) => error.startsWith("data/topics/ai.json → label："))).toBe(true);
  });

  it("目录里有不合规文件名 → 明确报错，而不是静默忽略", () => {
    const dir = makeData(["ai"], { ai: topic() });
    // 不用 AI.JSON：macOS 默认大小写不敏感，会直接覆盖 ai.json，测不到「文件名不合规」
    writeFileSync(join(dir, "topics", "AI_backup.json"), "{}");
    writeFileSync(join(dir, "topics", "notes.txt"), "{}");

    const { errors } = loadTopics(dir);
    expect(errors).toContain(
      "data/topics/AI_backup.json 文件名不合规：必须是小写 kebab-case 的 .json",
    );
    expect(errors).toContain("data/topics/notes.txt 文件名不合规：必须是小写 kebab-case 的 .json");
  });

  it("topics.json 不存在 → 报错", () => {
    const dir = mkdtempSync(join(tmpdir(), "redbot-topics-"));
    dirs.push(dir);

    expect(loadTopics(dir).errors[0]).toMatch(/^data\/topics\.json 读取失败：/);
  });

  it("topics.json 不是合法清单 → 报错带字段路径", () => {
    const dir = makeData(["AI 大写不行"], {});

    expect(loadTopics(dir).errors.some((error) => error.startsWith("data/topics.json → 0："))).toBe(
      true,
    );
  });

  it("topics/ 目录不存在 → 报错", () => {
    const dir = makeData(["ai"], {}, { withDir: false });

    expect(loadTopics(dir).errors[0]).toMatch(/^data\/topics\/ 目录读取失败：/);
  });
});
