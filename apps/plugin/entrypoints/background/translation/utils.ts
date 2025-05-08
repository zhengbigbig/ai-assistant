/**
 * 工具函数
 */

/**
 * 替换HTML特殊字符为转义字符
 * @param unsafe 不安全的字符串
 * @returns 转义后的字符串
 */
export function escapeHTML(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 替换转义字符为HTML特殊字符
 * @param unsafe 包含转义字符的字符串
 * @returns 还原后的字符串
 */
export function unescapeHTML(unsafe: string): string {
  return unsafe
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * 修复字符串中的零宽空格问题
 * @param str 原始字符串
 * @returns 修复后的字符串
 */
export function fixString(str: string): string {
  return str.replace(/\u200b/g, ' ');
}

/**
 * 创建一个可解析的Promise
 * @returns Promise和解析函数
 */
export function createResolvablePromise<T>(): [Promise<T>, (value: T) => void] {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return [promise, resolve];
}
