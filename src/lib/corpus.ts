import type { LinkItem } from "@/lib/schema";

let cached: Promise<LinkItem[]> | null = null;

/** 构建期生成的搜索/足迹语料；首次调用拉一次，之后复用同一个 Promise。 */
export function loadCorpus(): Promise<LinkItem[]> {
  if (!cached) {
    cached = fetch("/search-corpus.json", { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`搜索语料加载失败：${response.status}`);
        return response.json() as Promise<LinkItem[]>;
      })
      .catch((error) => {
        cached = null;
        throw error;
      });
  }
  return cached;
}

/** 空闲时预热，不影响首屏。 */
export function prefetchCorpus() {
  void loadCorpus().catch(() => {});
}
