import { TranslationHotkey } from '@/constants/config';
import { useConfigStore } from '@/entrypoints/stores/configStore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getNearestBlockElement, hoverTranslateElement } from './helpers';

/**
 * 悬停翻译组件
 * 监听鼠标悬停和快捷键事件，触发翻译功能
 * 交互方式：先鼠标悬停在元素上，再按下快捷键进行翻译切换
 */
const HoverTranslator: React.FC = () => {
  // 保存当前悬停的元素
  const [hoverElement, setHoverElement] = useState<Element | null>(null);
  // 延迟更新悬停元素的计时器
  const hoverTimerRef = useRef<number | null>(null);
  // 获取翻译配置
  const translationConfig = useConfigStore(state => state.translation);
  // 当前热键配置引用
  const currentHotkeyRef = useRef(translationConfig.hoverHotkey || TranslationHotkey.OPTION);
  // 添加防重复执行标记
  const isTranslatingRef = useRef(false);

  // 计算翻译块的位置
  const calculatePosition = useCallback((element: Element) => {
    if (!element) return;

    // 获取元素在视口中的位置
    const rect = element.getBoundingClientRect();

    // 这里可以返回元素的位置信息，以便在需要时使用
    return {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  // 处理翻译功能
  const handleTranslation = useCallback((element: Element) => {
    if (!element || isTranslatingRef.current) {
      return;
    }

    // 设置防重复执行标记
    isTranslatingRef.current = true;

    // 调用翻译函数
    hoverTranslateElement(element).finally(() => {
      // 延迟重置标记，避免快速重复触发
      setTimeout(() => {
        isTranslatingRef.current = false;
      }, 100);
    });

  }, []);

  // 检查是否匹配热键配置
  const isHotkeyMatch = useCallback((e: KeyboardEvent): boolean => {
    // 使用引用的热键配置，而不是直接从translationConfig获取
    const hoverHotkey = currentHotkeyRef.current;
    // 根据不同的热键配置检查对应的按键状态
    switch (hoverHotkey) {
      case TranslationHotkey.OPTION:
        return e.altKey; // Mac的Option键 / Windows的Alt键
      case TranslationHotkey.COMMAND:
        return e.metaKey || e.ctrlKey; // Mac的Command键 / Windows的Ctrl键
      case TranslationHotkey.SHIFT:
        return e.shiftKey; // 两个平台的Shift键
      default:
        return false;
    }
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 必须先有悬停元素，再检查快捷键是否匹配
    if (!hoverElement) {
      return;
    }

    if (!isHotkeyMatch(e)) {
      return;
    }

    // 阻止事件冒泡和默认行为，防止重复触发
    e.stopPropagation();
    e.preventDefault();

    handleTranslation(hoverElement);
  }, [hoverElement, isHotkeyMatch, handleTranslation]);

  // 主动初始化鼠标追踪
  useEffect(() => {
    // 在组件加载时模拟一次鼠标移动事件
    const initMousePosition = () => {
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2,
      });
      document.dispatchEvent(mouseEvent);
    };

    // 组件挂载后稍微延迟，等待页面完全加载
    const timer = setTimeout(initMousePosition, 300);
    return () => clearTimeout(timer);
  }, []);

  // 监听配置变化并更新热键
  useEffect(() => {
    // 更新热键配置引用
    currentHotkeyRef.current = translationConfig.hoverHotkey || TranslationHotkey.OPTION;
  }, [translationConfig]);

  // 主要的事件注册逻辑
  useEffect(() => {
    // 获取是否启用悬停翻译
    const enableHoverTranslation = translationConfig.enableHoverTranslation ?? false;

    if (!enableHoverTranslation) {
      return;
    }

    // 监听鼠标移动事件，用于跟踪鼠标当前悬停的元素
    const handleMouseMove = (e: MouseEvent) => {
      // 清除之前的计时器
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }

      // 使用计时器延迟更新悬停元素，避免频繁更新
      hoverTimerRef.current = window.setTimeout(() => {
        // 获取鼠标下方的元素
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element) {
          setHoverElement(null);
          return;
        }

        // 找到最近的块级元素节点，按照BLOCK_ELEMENTS的顺序依次查找
        const bestElement = getNearestBlockElement(element);

        if (!bestElement) {
          return;
        }

        // 如果元素发生变化才更新
        if (bestElement !== hoverElement) {
          setHoverElement(bestElement);
        }
      }, 100); // 100毫秒的防抖延迟
    };

    // 只在document上注册事件，避免重复触发
    document.addEventListener('mousemove', handleMouseMove, { capture: true, passive: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    // 组件卸载时清理事件监听器
    return () => {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });

      // 清除计时器
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, [handleKeyDown, translationConfig.enableHoverTranslation, hoverElement]);

  // 这是一个无UI的功能组件，不需要渲染任何内容
  return null;
};

export default HoverTranslator;
