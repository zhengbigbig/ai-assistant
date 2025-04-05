import React, { useEffect, useState } from 'react';
import TextSelectionToolbar, {
  TEXT_SELECTION_TOOLBAR_ACTION,
  TEXT_SELECTION_TOOLBAR_ACTION_LABEL,
} from './TextSelectionToolbar';
import ChatPopup from './ChatPopup';
import { useScreenshotStore } from '../../stores/screenshot';

const TextSelectionManager: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  // 工具栏位置信息 - 初始化为鼠标位置或选区顶部
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  // 聊天弹窗位置信息 - 使用选区中心点
  const [chatPosition, setChatPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [showToolbar, setShowToolbar] = useState<boolean>(false);
  const [showChatPopup, setShowChatPopup] = useState<boolean>(false);
  const [pinned, setPinned] = useState<boolean>(false);
  const [action, setAction] = useState<TEXT_SELECTION_TOOLBAR_ACTION>(
    TEXT_SELECTION_TOOLBAR_ACTION.CHAT
  );

  const { isSelecting } = useScreenshotStore();

  const handleMouseUp = (event: MouseEvent) => {
    // 如果正在进行截图，不要显示文本选择工具栏
    if (isSelecting) {
      console.log('正在截图中，不显示划词工具栏');
      return;
    }

    // 如果弹窗已经显示则隐藏
    if (showChatPopup && !pinned) {
      setShowChatPopup(false);
      return;
    }

    // 延迟一下获取选中文本，确保选择操作已完成
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      // 如果有选中的文本，显示工具栏
      if (text && text.trim().length > 0) {
        // 获取选区的位置信息
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          // 为工具栏设置位置 - 使用鼠标位置
          // TextSelectionToolbar内部会自行处理位置调整
          setToolbarPosition({ x: event.clientX, y: event.clientY });

          // 计算选区的中心点位置（用于聊天弹窗）
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          console.log('选中文本:', text, '工具栏初始位置:', event.clientX, event.clientY, '聊天弹窗位置:', centerX, centerY);
          setSelectedText(text);
          setChatPosition({ x: centerX, y: centerY });
          setShowToolbar(true);
        }
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
  }, [isSelecting, showChatPopup, pinned]);

  // 关闭工具栏
  const handleCloseToolbar = () => {
    console.log('关闭划词工具栏');
    setShowToolbar(false);
  };

  // 显示聊天弹窗
  const handleShowChat = () => {
    // 关闭工具栏
    console.log('显示聊天弹窗，位置:', chatPosition);
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
      {/* 划词工具栏 - 使用工具栏专用位置 */}
      <TextSelectionToolbar
        open={showToolbar}
        selectedText={selectedText}
        position={toolbarPosition}
        onClose={handleCloseToolbar}
        onShowChat={handleShowChat}
        onAction={setAction}
      />

      {/* 聊天弹窗 - 使用聊天弹窗专用位置 */}
      {showChatPopup && (
        <ChatPopup
          title={TEXT_SELECTION_TOOLBAR_ACTION_LABEL?.[action]}
          open={showChatPopup}
          position={chatPosition}
          selectedText={selectedText}
          onClose={handleCloseChatPopup}
          onPinnedChange={setPinned}
        />
      )}
    </>
  );
};

export default TextSelectionManager;
