import { describe, expect, it } from "vitest";

import { site } from "@/lib/site";
import { serializeJsonLd, topicJsonLd, websiteJsonLd } from "@/lib/structured-data";

describe("websiteJsonLd", () => {
  it("包含站点信息与搜索入口", () => {
    const data = websiteJsonLd();
    expect(data["@type"]).toBe("WebSite");
    expect(data.name).toBe(site.name);
    expect(data.url).toBe(site.url);
    expect(data.potentialAction.target.urlTemplate).toBe(
      `${site.url}/search/?q={search_term_string}`,
    );
  });
});

describe("topicJsonLd", () => {
  it("按顺序生成 ItemList", () => {
    const data = topicJsonLd(
      { slug: "news", name: "新闻", emoji: "📰", desc: "今天发生了什么", groups: [] },
      [
        {
          id: "a",
          name: "微博热搜",
          url: "https://s.weibo.com/top/summary",
          tags: ["新闻"],
          desc: "十分钟前",
        },
        {
          id: "b",
          name: "知乎热榜",
          url: "https://www.zhihu.com/hot",
          tags: ["新闻"],
          desc: "讨论",
        },
      ],
    );
    expect(data["@type"]).toBe("ItemList");
    expect(data.numberOfItems).toBe(2);
    expect(data.itemListElement[0]).toMatchObject({ position: 1, name: "微博热搜" });
    expect(data.itemListElement[1].position).toBe(2);
  });
});

describe("serializeJsonLd", () => {
  it("转义小于号，防止提前闭合 script", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(json).not.toContain("</script>");
    expect(json).toContain("\\u003c/script");
  });
});
