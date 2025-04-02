import React, { useEffect, useState } from 'react';
import TextSelectionToolbar from './TextSelectionToolbar';
import ChatPopup from './ChatPopup';
import { useScreenshotStore } from '../../stores/screenshot';

const TextSelectionManager: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [showToolbar, setShowToolbar] = useState<boolean>(false);
  const [showChatPopup, setShowChatPopup] = useState<boolean>(false);

  const handleMouseUp = (event: MouseEvent) => {
    // 如果正在进行截图，不要显示文本选择工具栏
    const { isSelecting } = useScreenshotStore.getState();
    if (isSelecting) {
      console.log('正在截图中，不显示划词工具栏');
      return;
    }

    // 如果弹窗已经显示，不再触发新的选择
    if (showChatPopup) {
      console.log('聊天弹窗已显示，不触发新的选择');
      return;
    }

    // 延迟一下获取选中文本，确保选择操作已完成
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      // 如果有选中的文本，显示工具栏
      if (text && text.trim().length > 0) {
        console.log('选中文本:', text, '位置:', event.clientX, event.clientY);
        setSelectedText(text);
        setPosition({ x: event.clientX, y: event.clientY });
        setShowToolbar(true);
      } else {
        console.log('没有选中文本或文本为空');
        setShowToolbar(false);
      }
    }, 10);
  };

  // 监听文本选择事件
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 关闭工具栏
  const handleCloseToolbar = () => {
    console.log('关闭划词工具栏');
    setShowToolbar(false);
  };

  // 显示聊天弹窗
  const handleShowChat = () => {
    // 关闭工具栏
    console.log('显示聊天弹窗，位置:', position);
    setShowToolbar(false);
    // 显示聊天弹窗
    setShowChatPopup(true);
  };

  // 关闭聊天弹窗
  const handleCloseChatPopup = () => {
    console.log('关闭聊天弹窗');
    setShowChatPopup(false);
    // 清除选中的文本
    window.getSelection()?.removeAllRanges();
  };

  return (
    <>
      {/* 减少频繁创建销毁 */}
      <TextSelectionToolbar
        open={showToolbar}
        selectedText={selectedText}
        position={position}
        onClose={handleCloseToolbar}
        onShowChat={handleShowChat}
      />

      {showChatPopup && (
        <ChatPopup
          open={showChatPopup}
          position={position}
          selectedText={selectedText}
          onClose={handleCloseChatPopup}
        />
      )}
    </>
  );
};

export default TextSelectionManager;
