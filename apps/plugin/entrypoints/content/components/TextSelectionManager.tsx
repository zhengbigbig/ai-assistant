import React, { useEffect, useState } from 'react';
import TextSelectionToolbar from './TextSelectionToolbar';
import ChatPopup from './ChatPopup';
import { useScreenshotStore } from '../../stores/screenshot';

const TextSelectionManager: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState<boolean>(false);
  const [showChatPopup, setShowChatPopup] = useState<boolean>(false);

  // 监听文本选择事件
  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      // 如果正在进行截图，不要显示文本选择工具栏
      const { isSelecting } = useScreenshotStore.getState();
      if (isSelecting) return;

      // 延迟一下获取选中文本，确保选择操作已完成
      setTimeout(() => {
        const text = window.getSelection()?.toString();

        // 如果有选中的文本，显示工具栏
        if (text && text.trim().length > 0) {
          console.log('选中文本:', text);
          setSelectedText(text);
          setPosition({ x: event.clientX, y: event.clientY });
          setShowToolbar(true);

          // 注意：不再在这里发送到Sider面板，而是等用户点击工具栏按钮时再发送
        }
      }, 10);
    };

    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 关闭工具栏
  const handleCloseToolbar = () => {
    setShowToolbar(false);
  };

  // 显示聊天弹窗
  const handleShowChat = () => {
    // 关闭工具栏
    setShowToolbar(false);
    // 显示聊天弹窗
    setShowChatPopup(true);
  };

  // 关闭聊天弹窗
  const handleCloseChatPopup = () => {
    setShowChatPopup(false);
    // 清除选中的文本
    window.getSelection()?.removeAllRanges();
  };

  // 点击页面时关闭工具栏
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      // 如果点击的不是工具栏或聊天弹窗内的元素，关闭工具栏
      const isClickInsideModal = (event.target as Element)?.closest('.ant-modal-content');

      if (!isClickInsideModal && showToolbar) {
        setShowToolbar(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showToolbar]);

  return (
    <>
      {showToolbar && (
        <TextSelectionToolbar
          selectedText={selectedText}
          position={position}
          onClose={handleCloseToolbar}
          onShowChat={handleShowChat}
        />
      )}

      {showChatPopup && (
        <ChatPopup
          visible={showChatPopup}
          position={position}
          selectedText={selectedText}
          onClose={handleCloseChatPopup}
        />
      )}
    </>
  );
};

export default TextSelectionManager;
