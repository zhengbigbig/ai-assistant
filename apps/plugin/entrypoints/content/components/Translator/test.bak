import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { message, Spin, Radio, Button, Space, Progress } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { useTranslationStore } from '../../stores/translationStore';
import { translateText } from '../../services/translation';
import { DisplayMode, DisplayStyle } from '../../constants/config';
import { useConfigStore } from '../../stores/configStore';

// 浮动工具栏
const FloatingToolbar = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 8px 12px;
  z-index: 999999;
  align-items: center;
`;

// 全局样式，注入到页面中
const injectGlobalStyles = () => {
  const styleId = 'ai-assistant-translation-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .ai-assistant-translated-text {
        color: inherit;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        margin: 0;
        padding: 0;
        overflow: visible !important;
        text-overflow: clip !important;
        -webkit-line-clamp: unset !important;
        max-height: none !important;
        display: block !important;
      }

      .ai-assistant-dual-original {
        margin-bottom: 4px;
      }

      .ai-assistant-dual-translated {
        margin-top: 4px;
      }

      .ai-assistant-error {
        color: #ff4d4f;
        padding: 5px;
        margin: 5px 0;
        font-size: 14px;
        border-left: 3px solid #ff4d4f;
        background-color: #fff1f0;
        cursor: pointer;
        overflow: visible !important;
        text-overflow: clip !important;
        -webkit-line-clamp: unset !important;
        max-height: none !important;
      }

      .ai-assistant-loading-icon {
        display: inline-flex;
        position: relative;
        width: 12px;
        height: 12px;
        margin-left: 4px;
        vertical-align: middle;
      }

      .ai-assistant-loading-icon:after {
        content: " ";
        display: block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid #6e59f2;
        border-color: #6e59f2 transparent #6e59f2 transparent;
        animation: ai-assistant-loading-animation 1.2s linear infinite;
      }

      @keyframes ai-assistant-loading-animation {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .ai-assistant-bilingual-inline {
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }

      .ai-assistant-bilingual-inline .original {
        flex: 1;
      }

      .ai-assistant-bilingual-inline .translated {
        flex: 1;
        border-left: 1px solid #eee;
        padding-left: 12px;
      }

      .ai-assistant-bilingual-block {
        display: block;
      }

      .ai-assistant-bilingual-block .original {
        margin-bottom: 8px;
      }

      .ai-assistant-bilingual-block .translated {
        padding-left: 8px;
        border-left: 2px solid rgba(110, 89, 242, 0.3);
      }

    `;
    document.head.appendChild(style);
  }
};

// 翻译节点的缓存Map
const translationCache = new Map();

/**
 * 生成唯一ID
 */
const generateUniqueId = (): string => {
  return `trans-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * 判断节点是否可见
 * @param element 待检查的元素
 * @returns 是否可见
 */
const isElementVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' &&
         style.visibility !== 'hidden' &&
         style.opacity !== '0' &&
         element.offsetParent !== null;
};

/**
 * 判断节点是否有截断样式（如webkit-line-clamp）
 * @param element 待检查的元素
 * @returns 是否有截断样式
 */
const hasLineClampStyle = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.webkitLineClamp !== 'none' ||
         style.textOverflow === 'ellipsis' ||
         style.overflow === 'hidden';
};

/**
 * 禁用元素上的文本截断样式
 * @param element 元素
 */
const disableLineClampStyle = (element: HTMLElement): void => {
  // 保存原始样式
  if (!element.dataset.originalOverflowStyle) {
    element.dataset.originalOverflowStyle = element.style.overflow || '';
    element.dataset.originalTextOverflowStyle = element.style.textOverflow || '';
    element.dataset.originalWebkitLineClampStyle = element.style.webkitLineClamp || '';
    element.dataset.originalDisplayStyle = element.style.display || '';
  }

  // 设置样式以确保翻译文本可见
  element.style.overflow = 'visible';
  element.style.textOverflow = 'clip';
  element.style.webkitLineClamp = 'unset';
  if (element.style.display === '-webkit-box') {
    element.style.display = 'block';
  }
};

/**
 * 恢复元素的文本截断样式
 * @param element 元素
 */
const restoreLineClampStyle = (element: HTMLElement): void => {
  if (element.dataset.originalOverflowStyle !== undefined) {
    element.style.overflow = element.dataset.originalOverflowStyle;
    delete element.dataset.originalOverflowStyle;
  }

  if (element.dataset.originalTextOverflowStyle !== undefined) {
    element.style.textOverflow = element.dataset.originalTextOverflowStyle;
    delete element.dataset.originalTextOverflowStyle;
  }

  if (element.dataset.originalWebkitLineClampStyle !== undefined) {
    element.style.webkitLineClamp = element.dataset.originalWebkitLineClampStyle;
    delete element.dataset.originalWebkitLineClampStyle;
  }

  if (element.dataset.originalDisplayStyle !== undefined) {
    element.style.display = element.dataset.originalDisplayStyle;
    delete element.dataset.originalDisplayStyle;
  }
};

/**
 * 获取元素的块级父元素
 * @param element 当前元素
 * @returns 块级父元素或自身
 */
const getBlockParent = (element: HTMLElement): HTMLElement => {
  // 如果当前元素是块级元素，直接返回
  if (isBlockElement(element)) {
    return element;
  }

  // 向上查找最近的块级元素父节点
  let parent = element.parentElement;
  while (parent && !isBlockElement(parent)) {
    parent = parent.parentElement;
  }

  // 如果找到了块级父元素，返回它，否则返回原始元素
  return parent || element;
};

/**
 * 检查节点是否应该被翻译
 * @param node 待检查的节点
 * @returns 是否应该被翻译
 */
const shouldTranslateNode = (node: Node): boolean => {
  // 跳过文本长度过短的节点
  const textContent = node.textContent?.trim() || '';
  if (textContent.length < 10) return false;

  // 文本节点直接检查其父元素
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement;
  if (!element) return false;

  // 跳过不可见元素
  if (!isElementVisible(element)) return false;

  // 跳过已翻译过的元素
  if (element.dataset.translated === 'true' || element.dataset.translationId) return false;

  // 跳过带有notranslate类的元素（检查class中是否包含notranslate子字符串）
  if (element.classList && Array.from(element.classList).some(cls => cls.toLowerCase().includes('notranslate'))) {
    return false;
  }

  // 检查是否有父元素包含notranslate类
  let parent = element.parentElement;
  while (parent) {
    if (parent.classList && Array.from(parent.classList).some(cls => cls.toLowerCase().includes('notranslate'))) {
      return false;
    }
    parent = parent.parentElement;
  }

  // 跳过已经有翻译标记的元素
  if (
    element.dataset.translated ||
    element.dataset.loading ||
    element.dataset.error
  ) {
    return false;
  }

  // 跳过翻译相关的元素
  if (
    element.classList.contains('ai-assistant-translated-text') ||
    element.classList.contains('ai-assistant-loading-icon') ||
    element.classList.contains('ai-assistant-error') ||
    element.classList.contains('ai-assistant-dual-original') ||
    element.classList.contains('ai-assistant-dual-translated') ||
    element.classList.contains('ai-assistant-inline-translation')
  ) {
    return false;
  }

  // 跳过某些用户界面元素（如菜单、按钮等）
  if (
    element.tagName === 'BUTTON' ||
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.tagName === 'A' ||
    element.tagName === 'OPTION' ||
    element.closest('nav') !== null ||
    element.closest('header') !== null ||
    element.closest('footer') !== null ||
    element.closest('aside') !== null
  ) {
    return false;
  }

  return true;
};

/**
 * 查找页面中的文本节点
 * @returns 可翻译的文本节点及其元素
 */
const findTextNodes = (): { element: HTMLElement; text: string; id: string }[] => {
  const textNodes: { element: HTMLElement; text: string; id: string }[] = [];
  const processedElements = new Set<HTMLElement>();

  // 使用TreeWalker深度遍历DOM树，找出文本节点
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const text = node.textContent?.trim() || '';
        if (text.length < 10) return NodeFilter.FILTER_REJECT;
        if (!shouldTranslateNode(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  // 遍历所有符合条件的文本节点
  let node;
  while ((node = walker.nextNode())) {
    const parentElement = node.parentElement;
    if (!parentElement) continue;

    // 获取块级父元素作为翻译单位
    const blockElement = getBlockParent(parentElement);

    // 如果已经处理过这个块级元素，跳过
    if (processedElements.has(blockElement)) continue;

    // 标记为已处理，避免重复
    processedElements.add(blockElement);

    // 当前块级容器的文本
    const currentText = blockElement.innerText.trim();

    // 确保内容有效且未被翻译过
    if (currentText.length >= 10 && shouldTranslateNode(blockElement)) {
      textNodes.push({
        element: blockElement,
        text: currentText,
        id: generateUniqueId()
      });
    }
  }

  return textNodes;
};

/**
 * 批量合并文本进行翻译
 * @param texts 待翻译的文本数组
 * @param batchSize 每批次的文本数量
 * @returns 翻译结果的Promise数组
 */
const batchTranslateTexts = async (
  texts: string[],
  batchSize = 5
): Promise<string[]> => {
  const results: string[] = new Array(texts.length).fill('');

  // 将文本分批处理
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchIndexes = Array.from({ length: batch.length }, (_, idx) => i + idx);

    // 检查缓存
    const uncachedBatch: { text: string; index: number }[] = [];
    batch.forEach((text, idx) => {
      const cacheKey = text.trim();
      if (translationCache.has(cacheKey)) {
        results[batchIndexes[idx]] = translationCache.get(cacheKey);
      } else {
        uncachedBatch.push({ text, index: batchIndexes[idx] });
      }
    });

    // 翻译未缓存的文本
    if (uncachedBatch.length > 0) {
      // 这里假设translateText函数可以处理单个文本，实际实现中可能需要修改API调用
      // 如果API支持批量翻译，可以进一步优化
      const translationPromises = uncachedBatch.map(async ({ text, index }) => {
        try {
          const result = await translateText(text);
          translationCache.set(text.trim(), result.translatedText);
          results[index] = result.translatedText;
          return result.translatedText;
        } catch (error) {
          console.error(`批量翻译出错:`, error);
          throw error;
        }
      });

      await Promise.all(translationPromises);
    }
  }

  return results;
};

/**
 * 判断元素是否为块级元素
 * @param element 待检查的元素
 * @returns 是否为块级元素
 */
const isBlockElement = (element: HTMLElement): boolean => {
  const display = window.getComputedStyle(element).display;
  return display === 'block' ||
         display === 'flex' ||
         display === 'grid' ||
         display === 'table' ||
         display === 'list-item';
};

/**
 * 插入翻译结果到页面
 * @param element 元素
 * @param original 原文
 * @param translated 翻译文本
 * @param displayMode 显示模式
 * @param displayStyle 显示样式
 * @param translationId 翻译ID
 */
const insertTranslation = (
  element: HTMLElement,
  original: string,
  translated: string,
  displayMode: DisplayMode,
  displayStyle: DisplayStyle,
  translationId: string
) => {
  // 保存原始内容
  if (!element.dataset.originalContent) {
    element.dataset.originalContent = element.innerHTML;
    element.dataset.originalStyle = element.getAttribute('style') || '';
    element.dataset.originalClass = element.getAttribute('class') || '';
  }

  // 移除所有loading图标
  removeLoadingIcon(element);

  // 检查并处理可能的文本截断样式
  if (hasLineClampStyle(element)) {
    disableLineClampStyle(element);
  }

  if (displayMode === DisplayMode.DUAL) {
    // 双语对照模式
    const styleMap = {
      [DisplayStyle.UNDERLINE]: 'text-decoration: underline dotted',
      [DisplayStyle.BACKGROUND]: 'background-color: rgba(110, 89, 242, 0.1)',
      [DisplayStyle.BORDER]: 'border: 1px dashed rgba(110, 89, 242, 0.5); padding: 2px 5px',
    };

    // 创建翻译文本元素
    const translatedElement = document.createElement('div');
    translatedElement.classList.add('ai-assistant-translated-text', 'notranslate');
    translatedElement.setAttribute('data-translation-id', translationId);
    translatedElement.style.cssText = styleMap[displayStyle];
    translatedElement.innerHTML = translated;

    // 确保翻译文本不会被截断
    translatedElement.style.overflow = 'visible';
    translatedElement.style.textOverflow = 'clip';
    translatedElement.style.webkitLineClamp = 'unset';

    // 创建一个包装器来保持原始内容
    const wrapper = document.createElement('div');
    wrapper.innerHTML = element.dataset.originalContent;
    wrapper.classList.add('ai-assistant-dual-original');

    // 翻译元素添加块级对照样式
    translatedElement.classList.add('ai-assistant-dual-translated');

    // 清空原元素并添加原始内容和翻译内容
    element.innerHTML = '';
    element.appendChild(wrapper);
    element.appendChild(translatedElement);
  } else {
    // 替换原文模式 - 直接替换文本内容，保留原始样式和结构
    // 创建包含翻译结果的元素
    const translatedContent = document.createElement('div');
    translatedContent.classList.add('ai-assistant-translated-text', 'notranslate');
    translatedContent.setAttribute('data-translation-id', translationId);
    translatedContent.innerHTML = translated;

    // 确保翻译内容不会被截断
    translatedContent.style.overflow = 'visible';
    translatedContent.style.textOverflow = 'clip';
    translatedContent.style.webkitLineClamp = 'unset';
    translatedContent.style.display = 'block';

    // 保存原始内容用于恢复
    element.dataset.translatedContent = translated;

    // 清空原元素并添加翻译内容
    element.innerHTML = '';
    element.appendChild(translatedContent);
  }

  // 标记为已翻译
  element.dataset.translated = 'true';
  element.dataset.translationId = translationId;
  element.dataset.displayMode = displayMode;
};

/**
 * 显示加载中状态
 * @param element 元素
 * @param translationId 翻译ID
 */
const showLoading = (element: HTMLElement, translationId: string) => {
  // 移除已有的loading图标（如果存在）
  removeLoadingIcon(element);

  // 保存原始内容
  if (!element.dataset.originalContent) {
    element.dataset.originalContent = element.innerHTML;
    element.dataset.originalStyle = element.getAttribute('style') || '';
    element.dataset.originalClass = element.getAttribute('class') || '';
  }

  // 检查并处理可能的文本截断样式
  if (hasLineClampStyle(element)) {
    disableLineClampStyle(element);
  }

  // 创建一个简单的loading图标
  const loadingIcon = document.createElement('span');
  loadingIcon.className = 'ai-assistant-loading-icon notranslate';
  loadingIcon.setAttribute('data-translation-id', translationId);

  // 始终将loading图标添加到元素内部的末尾
  element.appendChild(loadingIcon);

  // 标记元素为加载状态
  element.dataset.loading = 'true';
  element.dataset.translationId = translationId;
};

/**
 * 移除加载图标
 * @param element 关联的元素
 */
const removeLoadingIcon = (element: HTMLElement) => {
  // 查找与此元素关联的loading图标
  const translationId = element.dataset.translationId;
  if (translationId) {
    // 在文档中查找所有相关loading图标
    document.querySelectorAll(`.ai-assistant-loading-icon[data-translation-id="${translationId}"]`).forEach(icon => {
      icon.remove();
    });
  }

  // 查找元素内部的loading图标
  element.querySelectorAll('.ai-assistant-loading-icon').forEach(icon => {
    icon.remove();
  });

  // 如果是行内元素，还需要检查其父节点的下一个兄弟节点
  if (!isBlockElement(element) && element.nextSibling &&
      element.nextSibling.nodeType === Node.ELEMENT_NODE &&
      (element.nextSibling as HTMLElement).classList.contains('ai-assistant-loading-icon')) {
    element.nextSibling.remove();
  }
};

/**
 * 显示错误信息
 * @param element 元素
 * @param error 错误信息
 * @param translationId 翻译ID
 */
const showError = (element: HTMLElement, error: string, translationId: string) => {
  // 如果没有保存原始内容，说明没有设置过loading，先保存
  if (!element.dataset.originalContent) {
    element.dataset.originalContent = element.innerHTML;
    element.dataset.originalStyle = element.getAttribute('style') || '';
    element.dataset.originalClass = element.getAttribute('class') || '';
  }

  // 移除所有loading图标
  removeLoadingIcon(element);

  // 检查并处理可能的文本截断样式
  if (hasLineClampStyle(element)) {
    disableLineClampStyle(element);
  }

  // 创建错误提示元素
  const errorElement = document.createElement('div');
  errorElement.className = 'ai-assistant-error notranslate';
  errorElement.setAttribute('data-translation-id', translationId);
  errorElement.innerHTML = `
    <div>翻译失败: ${error}</div>
    <div style="margin-top: 4px; font-size: 12px; color: #999;">点击此处恢复原文</div>
  `;

  // 添加点击事件，恢复原文
  errorElement.addEventListener('click', () => {
    restoreOriginalContent(element);
  });

  // 始终将错误提示添加到元素内部
  element.appendChild(errorElement);

  element.dataset.error = 'true';
  element.dataset.translationId = translationId;
};

/**
 * 恢复原始内容
 * @param element 元素
 */
const restoreOriginalContent = (element: HTMLElement) => {
  // 恢复可能被禁用的文本截断样式
  restoreLineClampStyle(element);

  // 正常恢复元素内容
  if (element.dataset.originalContent) {
    // 恢复原始HTML内容
    element.innerHTML = element.dataset.originalContent;

    // 恢复原始样式
    if (element.dataset.originalStyle) {
      element.setAttribute('style', element.dataset.originalStyle);
    } else {
      element.removeAttribute('style');
    }

    // 恢复原始类名
    if (element.dataset.originalClass) {
      element.setAttribute('class', element.dataset.originalClass);
    } else {
      element.removeAttribute('class');
    }

    // 查找并移除关联的翻译元素（行内元素双语模式）
    const translationId = element.dataset.relatedTranslationElement;
    if (translationId) {
      document.querySelectorAll(`[data-translation-id="${translationId}"]`).forEach(el => {
        el.remove();
      });
    }

    // 移除loading图标
    removeLoadingIcon(element);

    // 移除错误提示
    if (element.dataset.translationId) {
      document.querySelectorAll(`.ai-assistant-error[data-translation-id="${element.dataset.translationId}"]`).forEach(el => {
        el.remove();
      });
    }

    // 清除所有数据标记
    delete element.dataset.originalContent;
    delete element.dataset.originalStyle;
    delete element.dataset.originalClass;
    delete element.dataset.translated;
    delete element.dataset.loading;
    delete element.dataset.error;
    delete element.dataset.translationId;
    delete element.dataset.relatedTranslationElement;
    delete element.dataset.translatedContent;
    delete element.dataset.displayMode;
  }
};

/**
 * 清理页面上所有翻译相关元素
 */
const cleanupAllTranslations = () => {
  // 移除所有loading图标
  document.querySelectorAll('.ai-assistant-loading-icon').forEach(icon => {
    icon.remove();
  });

  // 移除所有错误提示
  document.querySelectorAll('.ai-assistant-error').forEach(el => {
    el.remove();
  });

  // 恢复所有已翻译元素
  document.querySelectorAll('[data-translated], [data-loading], [data-error]').forEach(element => {
    restoreOriginalContent(element as HTMLElement);
  });

  // 移除所有翻译相关类的元素（以防万一有遗漏）
  document.querySelectorAll('.ai-assistant-translated-text, .ai-assistant-dual-original, .ai-assistant-dual-translated').forEach(element => {
    element.remove();
  });
};

const TranslationManager: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [translatedCount, setTranslatedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const visibleNodesRef = useRef<Set<string>>(new Set());

  const translation = useConfigStore((state) => state.translation);
  const updateTranslation = useConfigStore((state) => state.updateTranslation);
  const keyboardShortcuts = useConfigStore((state) => state.keyboardShortcuts);

  const {
    isTranslating,
    paragraphs,
    displayMode,
    setDisplayMode,
    targetLanguage,
    setIsTranslating,
    clearParagraphs,
    addParagraphs,
    setParagraphLoading,
    setParagraphTranslation,
    setParagraphError,
  } = useTranslationStore();

  // 切换显示模式
  const toggleDisplayMode = (e: RadioChangeEvent) => {
    const newMode = e.target.value as DisplayMode;
    setDisplayMode(newMode);

    // 更新配置存储
    updateTranslation({ displayMode: newMode === DisplayMode.DUAL ? 'dual' : 'replace' });

    // 重新应用翻译
    reapplyTranslations(newMode);
  };

  // 重新应用所有翻译
  const reapplyTranslations = (mode: DisplayMode) => {
    paragraphs.forEach(paragraph => {
      if (paragraph.isTranslated && paragraph.translatedText) {
        insertTranslation(
          paragraph.element,
          paragraph.originalText,
          paragraph.translatedText,
          mode,
          translation.displayStyle as DisplayStyle,
          paragraph.id
        );
      }
    });
  };

  // 初始化页面段落元素
  const initializePageElements = () => {
    // 注入全局样式
    injectGlobalStyles();

    setIsInitializing(true);
    clearParagraphs();

    try {
      // 使用TreeWalker查找页面中的文本节点
      const textNodes = findTextNodes();

      if (textNodes.length > 0) {
        setTotalCount(textNodes.length);

        // 转换为需要的格式添加到paragraphs中
        const paragraphsToAdd = textNodes.map(({ element, text, id }) => ({
          element,
          originalText: text,
          translatedText: null,
          isLoading: false,
          isTranslated: false,
          error: null,
          id
        }));

        addParagraphs(paragraphsToAdd);
        console.log(`找到 ${textNodes.length} 个待翻译段落`);

        // 设置交叉观察器观察可见元素
        setupIntersectionObserver(paragraphsToAdd);
      } else {
        message.info('未找到可翻译内容');
        setIsTranslating(false);
      }
    } catch (error) {
      console.error('初始化页面元素出错:', error);
      message.error('初始化页面元素失败');
      setIsTranslating(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // 设置交叉观察器，只翻译可视区域内的元素
  const setupIntersectionObserver = (paragraphsToObserve: typeof paragraphs) => {
    // 清理之前的观察器
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
    }

    // 创建新的观察器
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-translation-id');
          if (!id) return;

          if (entry.isIntersecting) {
            visibleNodesRef.current.add(id);
          } else {
            visibleNodesRef.current.delete(id);
          }
        });
      },
      { rootMargin: '200px 0px' } // 提前200px加载
    );

    // 观察所有段落元素
    paragraphsToObserve.forEach(paragraph => {
      const element = paragraph.element;
      element.setAttribute('data-translation-id', paragraph.id);
      intersectionObserverRef.current?.observe(element);
    });
  };

  // 开始翻译所有段落
  const startTranslation = async () => {
    if (paragraphs.length === 0) {
      message.info('没有可翻译的内容');
      setIsTranslating(false);
      return;
    }

    let successCount = 0;
    setTranslatedCount(0);

    try {
      // 先为所有段落显示加载中
      paragraphs.forEach(paragraph => {
        if (!paragraph.isTranslated) {
          // 显示加载状态
          showLoading(paragraph.element, paragraph.id);
          setParagraphLoading(paragraph.id, true);
        }
      });

      // 准备批量翻译数据
      const textsToTranslate = paragraphs
        .filter(p => !p.isTranslated)
        .map(p => p.originalText);

      const paragraphIds = paragraphs
        .filter(p => !p.isTranslated)
        .map(p => p.id);

      // 批量翻译
      const translatedTexts = await batchTranslateTexts(textsToTranslate);

      // 应用翻译结果
      for (let i = 0; i < paragraphIds.length; i++) {
        const paragraph = paragraphs.find(p => p.id === paragraphIds[i]);
        if (!paragraph) continue;

        try {
          const translatedText = translatedTexts[i];

          // 设置翻译结果
          setParagraphTranslation(paragraph.id, translatedText);

          // 将翻译结果插入页面
          insertTranslation(
            paragraph.element,
            paragraph.originalText,
            translatedText,
            displayMode,
            translation.displayStyle as DisplayStyle,
            paragraph.id
          );

          successCount++;
        } catch (error) {
          console.error(`翻译段落 ${paragraph.id} 出错:`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          setParagraphError(paragraph.id, errorMessage);
          showError(paragraph.element, errorMessage, paragraph.id);
        } finally {
          setTranslatedCount(count => count + 1);
        }
      }

      // 翻译完成
      if (successCount > 0) {
        message.success(`页面翻译完成，成功翻译 ${successCount} 个段落`);
      } else {
        message.warning('页面翻译完成，但没有成功翻译的段落');
      }

      // 显示工具栏
      setShowToolbar(true);

      // 设置DOM变化监听
      setupMutationObserver();
    } catch (error) {
      console.error('翻译过程中出错:', error);
      message.error('翻译过程中出错');
    } finally {
      setIsTranslating(false);
    }
  };

  // 设置DOM变化监听
  const setupMutationObserver = () => {
    // 清理之前的观察器
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect();
    }

    // 创建新的观察器
    mutationObserverRef.current = new MutationObserver((mutations) => {
      // 只在非翻译过程中处理新增节点
      if (isTranslating) return;

      // 检查是否有新增节点
      let hasNewNodes = false;
      const processedElements = new Set<HTMLElement>();

      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length === 0) return;

        // 跳过处理已翻译的容器内部变化
        const targetElement = mutation.target as HTMLElement;
        if (targetElement && (
          targetElement.dataset.translated === 'true' ||
          targetElement.classList?.contains('ai-assistant-translated-text') ||
          targetElement.classList?.contains('ai-assistant-dual-original') ||
          targetElement.classList?.contains('ai-assistant-dual-translated') ||
          targetElement.classList?.contains('ai-assistant-inline-translation')
        )) {
          return;
        }

        mutation.addedNodes.forEach((node) => {
          // 只处理元素节点
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const element = node as HTMLElement;

          // 如果是翻译相关节点，跳过
          if (
            element.classList?.contains('ai-assistant-translated-text') ||
            element.classList?.contains('ai-assistant-loading-icon') ||
            element.classList?.contains('ai-assistant-error') ||
            element.classList?.contains('ai-assistant-dual-original') ||
            element.classList?.contains('ai-assistant-dual-translated') ||
            element.classList?.contains('ai-assistant-inline-translation') ||
            element.dataset.translated === 'true'
          ) {
            return;
          }

          // 标记为已处理过的节点，避免重复处理
          if (processedElements.has(element)) return;
          processedElements.add(element);

          hasNewNodes = true;
        });
      });

      // 只有在确实有新节点时才执行查找和翻译
      if (hasNewNodes) {
        // 使用TreeWalker查找新增文本节点
        const newTextNodes = findTextNodes();

        // 筛选出未翻译过的节点
        const newElementsToTranslate = newTextNodes
          .filter(({ element }) => !element.dataset.translated && !element.dataset.translationId)
          .map(({ element, text, id }) => ({
            element,
            originalText: text,
            translatedText: null,
            isLoading: false,
            isTranslated: false,
            error: null,
            id
          }));

        if (newElementsToTranslate.length > 0) {
          console.log(`发现 ${newElementsToTranslate.length} 个新增待翻译段落`);
          // 添加新段落并翻译
          addParagraphs(newElementsToTranslate);
          setTotalCount(total => total + newElementsToTranslate.length);

          // 翻译新增节点
          translateNewNodes(newElementsToTranslate);
        }
      }
    });

    // 开始观察DOM变化，只监听DOM结构变化，不监听文本和属性变化
    mutationObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
      attributes: false
    });
  };

  // 翻译新增节点
  const translateNewNodes = async (newNodes: typeof paragraphs) => {
    if (newNodes.length === 0) return;

    try {
      // 显示加载状态
      newNodes.forEach(node => {
        showLoading(node.element, node.id);
        setParagraphLoading(node.id, true);
      });

      // 准备翻译数据
      const textsToTranslate = newNodes.map(node => node.originalText);

      // 批量翻译
      const translatedTexts = await batchTranslateTexts(textsToTranslate);

      // 应用翻译结果
      for (let i = 0; i < newNodes.length; i++) {
        const node = newNodes[i];

        try {
          const translatedText = translatedTexts[i];

          // 设置翻译结果
          setParagraphTranslation(node.id, translatedText);

          // 将翻译结果插入页面
          insertTranslation(
            node.element,
            node.originalText,
            translatedText,
            displayMode,
            translation.displayStyle as DisplayStyle,
            node.id
          );

          setTranslatedCount(count => count + 1);
        } catch (error) {
          console.error(`翻译新节点出错:`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          setParagraphError(node.id, errorMessage);
          showError(node.element, errorMessage, node.id);
        }
      }
    } catch (error) {
      console.error('翻译新增节点过程中出错:', error);
    }
  };

  // 清理翻译，恢复原始内容
  const cleanupTranslation = () => {
    try {
      // 清理观察器
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
        mutationObserverRef.current = null;
      }

      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
        intersectionObserverRef.current = null;
      }

      // 清空可见节点集合
      visibleNodesRef.current.clear();

      // 使用统一函数清理所有翻译
      cleanupAllTranslations();
      clearParagraphs();
      setShowToolbar(false);
      setTranslatedCount(0);
      setTotalCount(0);
    } catch (error) {
      console.error('清理翻译出错:', error);
    }
  };

  // 监听翻译状态变化
  useEffect(() => {
    if (isTranslating) {
      initializePageElements();
    }
  }, [isTranslating]);

  // 监听段落初始化完成
  useEffect(() => {
    if (!isInitializing && isTranslating && paragraphs.length > 0) {
      startTranslation();
    }
  }, [isInitializing, paragraphs.length]);

  // 监听后台消息
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.action === 'translateText') {
        setIsTranslating(true);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // 监听键盘事件，用于自定义快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      // 获取配置的快捷键
      const shortcutTranslatePage = keyboardShortcuts.shortcutTranslatePage || 'Alt+T';

      // 检查是否匹配配置的快捷键
      const isAlt = e.altKey;
      const isCtrl = e.ctrlKey;
      const isShift = e.shiftKey;
      const isMeta = e.metaKey;
      const key = e.key;

      // 解析配置的快捷键
      const parts = shortcutTranslatePage.split('+');
      const needsAlt = parts.some(part => part.toLowerCase() === 'alt' || part === '⌥');
      const needsCtrl = parts.some(part => part.toLowerCase() === 'ctrl');
      const needsShift = parts.some(part => part.toLowerCase() === 'shift' || part === '⇧');
      const needsMeta = parts.some(part => part.toLowerCase() === 'meta' || part === '⌘');
      const targetKey = parts.filter(part =>
        !['alt', '⌥', 'ctrl', 'shift', '⇧', 'meta', '⌘'].includes(part.toLowerCase())
      )[0];

      // 判断是否按下了配置的快捷键
      if (
        (isAlt === needsAlt) &&
        (isCtrl === needsCtrl) &&
        (isShift === needsShift) &&
        (isMeta === needsMeta) &&
        (key.toLowerCase() === targetKey?.toLowerCase())
      ) {
        console.log('检测到自定义翻译页面快捷键', shortcutTranslatePage);
        setIsTranslating(true);
        e.preventDefault();
      }
    };

    // 添加键盘事件监听器
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      // 清理所有观察器
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }

      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }

      chrome.runtime.onMessage.removeListener(handleMessage);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyboardShortcuts]);

  return (
    <>
      {showToolbar && !isTranslating && (
        <FloatingToolbar>
          <Space>
            <Radio.Group
              value={displayMode}
              onChange={toggleDisplayMode}
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value={DisplayMode.DUAL}>
                双语对照
              </Radio.Button>
              <Radio.Button value={DisplayMode.REPLACE}>
                仅译文
              </Radio.Button>
            </Radio.Group>
            <Button
              size="small"
              onClick={cleanupTranslation}
            >
              关闭翻译
            </Button>
          </Space>
        </FloatingToolbar>
      )}

      {isTranslating && translatedCount < totalCount && (
        <FloatingToolbar>
          <Space direction="vertical" size="small">
            <div style={{ fontSize: '14px' }}>
              翻译进度: {translatedCount}/{totalCount}
            </div>
            <Progress
              percent={Math.round((translatedCount / totalCount) * 100)}
              size="small"
              showInfo={false}
              status="active"
            />
          </Space>
        </FloatingToolbar>
      )}
    </>
  );
};

export default TranslationManager;
