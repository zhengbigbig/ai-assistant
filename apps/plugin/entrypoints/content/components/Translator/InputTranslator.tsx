import React, { useEffect } from 'react';
import { message } from 'antd';
import { useTranslation } from '../../../stores/configStore';

// 输入框翻译组件
const InputTranslator: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  // 从store获取输入翻译设置
  const translation = useTranslation();
  const { enableInputTranslation, targetLanguage, translationService } = translation;

  // 监听快捷键
  useEffect(() => {
    if (!enableInputTranslation) return;

    // 标识当前选中的输入元素
    let focusedElement: HTMLInputElement | HTMLTextAreaElement | null = null;

    // 记录当前聚焦的输入元素
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (isValidInputElement(target)) {
        focusedElement = target as HTMLInputElement | HTMLTextAreaElement;
      }
    };

    // 当输入元素失去焦点
    const handleBlur = () => {
      focusedElement = null;
    };

    // 检查是否是可输入的元素
    const isValidInputElement = (element: HTMLElement): boolean => {
      return (
        (element.tagName === 'INPUT' &&
          ['text', 'search', 'email', 'url', 'tel', 'number', undefined].includes(
            (element as HTMLInputElement).type
          )
        ) ||
        element.tagName === 'TEXTAREA' ||
        element.isContentEditable
      );
    };

    // 处理键盘事件
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Alt+T 触发翻译
      if (event.altKey && event.key === 't' && focusedElement) {
        event.preventDefault();

        // 获取输入值
        let inputText = '';
        if (focusedElement.isContentEditable) {
          inputText = focusedElement.textContent || '';
        } else {
          inputText = focusedElement.value;
        }

        if (!inputText.trim()) {
          messageApi.info('请先输入需要翻译的文本');
          return;
        }

        // 显示加载提示
        messageApi.loading('正在翻译...');

        try {
          // 发送消息到后台脚本进行翻译
          const result = await chrome.runtime.sendMessage({
            action: 'translateText',
            translationService,
            targetLanguage,
            sourceText: inputText
          });

          if (!result || result.error) {
            throw new Error(result?.error || '翻译失败');
          }

          const translatedText = result.translatedText;

          // 更新输入框的值
          if (focusedElement.isContentEditable) {
            focusedElement.textContent = translatedText;
            // 触发输入事件，确保其他脚本能够感知到变化
            const inputEvent = new Event('input', { bubbles: true });
            focusedElement.dispatchEvent(inputEvent);
          } else {
            focusedElement.value = translatedText;
            // 触发输入事件，确保其他脚本能够感知到变化
            const inputEvent = new Event('input', { bubbles: true });
            focusedElement.dispatchEvent(inputEvent);

            // 对于React控制的输入框，可能需要触发change事件
            const changeEvent = new Event('change', { bubbles: true });
            focusedElement.dispatchEvent(changeEvent);
          }

          messageApi.success('翻译完成');
        } catch (error) {
          console.error('输入翻译出错:', error);
          messageApi.error('翻译失败，请重试');
        }
      }
    };

    // 添加事件监听
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);
    document.addEventListener('keydown', handleKeyDown);

    // 初始化：检查当前是否有输入框聚焦
    if (document.activeElement && isValidInputElement(document.activeElement as HTMLElement)) {
      focusedElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
    }

    // 首次加载时显示提示
    messageApi.info('按 Alt+T 可在输入框中翻译文本', 5);

    // 清理事件监听
    return () => {
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableInputTranslation, targetLanguage, translationService]);

  // 如果没有启用输入翻译，不渲染组件
  if (!enableInputTranslation) {
    return null;
  }

  return <>{contextHolder}</>;
};

export default InputTranslator;
