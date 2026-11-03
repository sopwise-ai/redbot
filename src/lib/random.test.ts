import { describe, expect, it, vi } from "vitest";

import { pickRandom } from "@/lib/random";

describe("pickRandom", () => {
  it("空数组返回 undefined", () => {
    expect(pickRandom([])).toBeUndefined();
  });

  it("按 Math.random 取数组里的元素", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(pickRandom(["a", "b", "c"])).toBe("b");
    vi.restoreAllMocks();
  });
});
