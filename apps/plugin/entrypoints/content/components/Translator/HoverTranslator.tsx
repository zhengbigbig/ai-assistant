import React, { useEffect, useState, useRef } from 'react';
import { Card, Spin, Typography } from 'antd';
import styled from 'styled-components';
import { useTranslation } from '../../../stores/configStore';
import { TranslationHotkey } from '../../../constants/config';

const { Text } = Typography;

// 悬停翻译卡片容器
const HoverCard = styled(Card)<{ $visible: boolean }>`
  position: fixed;
  z-index: 99999;
  max-width: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0;
  display: ${props => (props.$visible ? 'block' : 'none')};
`;

// 原文样式
const OriginalText = styled(Text)`
  display: block;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 8px;
  font-size: 14px;
`;

// 译文样式
const TranslatedText = styled(Text)`
  display: block;
  font-weight: 500;
  font-size: 14px;
`;

// 获取正确的热键处理函数
const getHotkeyHandler = (hotkey: string): string => {
  switch (hotkey) {
    case TranslationHotkey.OPTION:
      return 'altKey';
    case TranslationHotkey.COMMAND:
      return 'metaKey';
    case TranslationHotkey.SHIFT:
      return 'shiftKey';
    default:
      return 'altKey';
  }
};

// 悬停翻译组件
const HoverTranslator: React.FC = () => {
  // 从store获取鼠标悬停翻译设置
  const translation = useTranslation();
  const { enableHoverTranslation, hoverHotkey, hoverTranslationService } = translation;

  // 悬停翻译状态
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [visible, setVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [originalText, setOriginalText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const activeNode = useRef<Node | null>(null);
  const isHotkeyPressed = useRef<boolean>(false);

  // 获取热键处理函数
  const hotkeyHandler = getHotkeyHandler(hoverHotkey);

  // 设置鼠标移动事件和按键事件监听
  useEffect(() => {
    if (!enableHoverTranslation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event[hotkeyHandler as keyof KeyboardEvent]) {
        isHotkeyPressed.current = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event[hotkeyHandler as keyof KeyboardEvent]) {
        isHotkeyPressed.current = false;
        // 热键松开时隐藏翻译卡片
        setVisible(false);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isHotkeyPressed.current) return;

      // 获取鼠标下方的文本节点
      const range = document.caretRangeFromPoint(event.clientX, event.clientY);
      if (!range) return;

      const node = range.startContainer;

      // 如果是文本节点且包含内容，则显示翻译卡片
      if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim() !== '') {
        // 如果是同一个节点，不重复翻译
        if (node === activeNode.current) return;

        activeNode.current = node;

        // 获取待翻译的文本
        const text = node.textContent.trim();
        if (text.length < 2) return;

        // 设置卡片位置
        setPosition({
          x: event.clientX,
          y: event.clientY + 20 // 在鼠标下方20px处显示
        });

        // 设置原文并翻译
        setOriginalText(text);
        translateText(text);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enableHoverTranslation, hotkeyHandler]);

  // 翻译文本函数
  const translateText = async (text: string) => {
    if (!text) return;

    setLoading(true);
    setVisible(true);

    try {
      // 发送消息到后台脚本进行翻译
      const result = await chrome.runtime.sendMessage({
        action: 'translateText',
        translationService: hoverTranslationService,
        targetLanguage: translation.targetLanguage,
        sourceText: text
      });

      if (!result || result.error) {
        throw new Error(result?.error || '翻译失败');
      }

      setTranslatedText(result.translatedText);
    } catch (error) {
      console.error('悬停翻译出错:', error);
      setTranslatedText('翻译失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 如果不启用悬停翻译，不渲染组件
  if (!enableHoverTranslation) {
    return null;
  }

  return (
    <HoverCard
      $visible={visible}
      style={{ left: position.x, top: position.y }}
      size="small"
      variant="outlined"
    >
      <Spin spinning={loading} size="small">
        <OriginalText>{originalText}</OriginalText>
        <TranslatedText>{translatedText}</TranslatedText>
      </Spin>
    </HoverCard>
  );
};

export default HoverTranslator;
