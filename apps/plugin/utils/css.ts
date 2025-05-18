import { CUSTOM_STYLE_ELEMENT_ID } from '@/constants/config';

/**
 * 验证CSS是否合法
 * @param css CSS文本
 * @returns 是否合法
 */
export const validateCss = (css: string): boolean => {
  try {
    const styleEl = document.createElement('style');
    styleEl.textContent = `.test-css-validation { ${css} }`;
    document.head.appendChild(styleEl);
    document.head.removeChild(styleEl);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 更新CSS中的颜色值
 * @param css CSS文本
 * @param property 属性名
 * @param value 新的颜色值
 * @returns 更新后的CSS文本
 */
export const updateCssColor = (
  css: string,
  property: string,
  value: string
): string => {
  // 尝试替换已存在的属性
  const regex = new RegExp(`(${property}\\s*:\\s*)([^;]+)(;?)`, 'g');
  if (regex.test(css)) {
    return css.replace(regex, `$1${value}$3`);
  }

  // 如果属性不存在，则添加到CSS末尾
  return css.trim() + `\n${property}: ${value};`;
};

// 注入自定义样式到HTML
export const injectCustomStyleToHtml = (css: string) => {
  // 检查是否已存在样式元素
  let styleElement = document.getElementById(CUSTOM_STYLE_ELEMENT_ID);

  // 如果不存在则创建
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = CUSTOM_STYLE_ELEMENT_ID;
    document.head.appendChild(styleElement);
  }

  // 更新样式内容
  styleElement.textContent = css;
};
