/** 搜索与数据校验共用的关键词归一化：大小写、空格、点号差异不影响命中。 */
export function normalizeKeyword(value: string) {
  return value.toLowerCase().replace(/[\s.·]/g, "");
}
