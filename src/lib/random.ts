/** 从数组里随机取一个；空数组返回 undefined（调用方负责空态）。 */
export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}
