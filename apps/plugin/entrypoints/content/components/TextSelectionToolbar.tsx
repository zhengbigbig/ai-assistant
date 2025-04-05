import React, { useEffect, useState, useRef } from 'react';
import { useClickAway } from 'ahooks';
import { Button, Space, Modal } from 'antd';
import styled from 'styled-components';
import {
  TranslationOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

const TOOLBAR_HEIGHT = 40;
const TOOLBAR_DISTANCE = 5;

export enum TEXT_SELECTION_TOOLBAR_ACTION {
  TRANSLATE = 'translate',
  EXPLAIN = 'explain',
  CHAT = 'chat',
}

export const TEXT_SELECTION_TOOLBAR_ACTION_LABEL = {
  [TEXT_SELECTION_TOOLBAR_ACTION.TRANSLATE]: '翻译',
  [TEXT_SELECTION_TOOLBAR_ACTION.EXPLAIN]: '解释',
  [TEXT_SELECTION_TOOLBAR_ACTION.CHAT]: '发送',
};

interface TextSelectionToolbarProps {
  open: boolean;
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onShowChat: () => void;
  onAction: (action: TEXT_SELECTION_TOOLBAR_ACTION) => void;
}

// 工具栏样式（基于Modal）
const StyledModal = styled(Modal)`
  .ant-modal-content {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    padding: 0;
  }

  .ant-modal-body {
    padding: 2px 4px;
  }
`;

// 按钮样式
const ActionButton = styled(Button)`
  border: none;
  font-size: 14px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 10px;

  &:hover {
    background-color: #f5f5f5;
    color: #6e59f2;
  }

  .anticon {
    font-size: 16px;
    margin-right: 4px;
  }
`;

const ButtonsContainer = styled(Space)`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
`;

const TextSelectionToolbar: React.FC<TextSelectionToolbarProps> = ({
  open,
  selectedText,
  position,
  onClose,
  onShowChat,
  onAction,
}) => {
  const [modalPosition, setModalPosition] = useState({
    x: position.x,
    y: position.y + 20,
  });

  // 当工具栏显示时，同步文本到Sider但不发送
  useEffect(() => {
    if (open && selectedText) {
      // 只同步数据到Sider，但不发送
      chrome.runtime.sendMessage(
        {
          action: 'syncSelectedText',
          text: selectedText,
        },
        (response) => {
          console.log('同步划词数据到侧边栏:', response);
        }
      );
    }
  }, [open, selectedText]);

  // 处理各种操作
  const handleAction = (e: React.MouseEvent, action: TEXT_SELECTION_TOOLBAR_ACTION) => {
    // 阻止事件冒泡，防止触发全局点击事件
    e.stopPropagation();
    e.preventDefault();
    console.log('handleAction', action);
    // 立即关闭工具栏
    onClose();
    onAction(action);

    // 处理具体操作
    if (action === 'chat') {
      chrome.runtime.sendMessage(
        {
          action: 'sendSelectedText',
          text: selectedText,
        },
        (response) => {
          console.log('发送划词到侧边栏并立即发送:', response);
        }
      );
    } else {
      onShowChat();
      const messagePrefix = action === TEXT_SELECTION_TOOLBAR_ACTION.TRANSLATE ? '翻译: ' : '解释: ';

      chrome.runtime.sendMessage(
        {
          action: 'syncSelectedText',
          text: `${messagePrefix}${selectedText}`,
        },
        (response) => {
          console.log('发送划词和操作到侧边栏输入框:', response);
        }
      );
    }
  };

  // 计算Modal位置
  useEffect(() => {
    // 延迟获取DOM的宽高，确保Modal已渲染
    const timer = setTimeout(() => {
      // 获取选区宽高
      const selection = window.getSelection();
      const range = selection?.getRangeAt?.(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        // 划词区域相对于页面的位置
        const selectionLeft = rect.left + window.scrollX;
        const selectionTop = rect.top + window.scrollY;

        // 计算工具栏的left位置：划词区域left + 划词区域宽度的一半
        const newX = selectionLeft + rect.width / 2;

        // 默认计算top位置：划词区域top + 划词区域高度
        let newY = selectionTop + rect.height + TOOLBAR_DISTANCE;

        // 如果top已经超出了边界，则计算为划词区域top - 工具栏高度
        if (newY + TOOLBAR_HEIGHT > window.innerHeight + window.scrollY) {
          newY = selectionTop - TOOLBAR_HEIGHT - TOOLBAR_DISTANCE;
        }

        setModalPosition({ x: newX, y: newY });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [position]);

  // 直接在Modal上添加内联样式
  const modalStyle = {
    left: modalPosition.x,
    top: modalPosition.y,
    position: 'absolute' as const,
  };

  return (
    <StyledModal
      open={open}
      closable={false}
      footer={null}
      onCancel={onClose}
      mask={false}
      style={modalStyle}
      width={240}
      getContainer={false}
    >
      <ButtonsContainer size={0} direction="horizontal">
        <ActionButton
          type="text"
          size="small"
          onMouseUp={(e) =>
            handleAction(e, TEXT_SELECTION_TOOLBAR_ACTION.TRANSLATE)
          }
          icon={<TranslationOutlined />}
        >
          {
            TEXT_SELECTION_TOOLBAR_ACTION_LABEL[
              TEXT_SELECTION_TOOLBAR_ACTION.TRANSLATE
            ]
          }
        </ActionButton>
        <ActionButton
          type="text"
          size="small"
          onMouseUp={(e) =>
            handleAction(e, TEXT_SELECTION_TOOLBAR_ACTION.EXPLAIN)
          }
          icon={<FileTextOutlined />}
        >
          {
            TEXT_SELECTION_TOOLBAR_ACTION_LABEL[
              TEXT_SELECTION_TOOLBAR_ACTION.EXPLAIN
            ]
          }
        </ActionButton>
        <ActionButton
          type="text"
          size="small"
          onMouseUp={(e) => handleAction(e, TEXT_SELECTION_TOOLBAR_ACTION.CHAT)}
          icon={<ArrowRightOutlined />}
        >
          {
            TEXT_SELECTION_TOOLBAR_ACTION_LABEL[
              TEXT_SELECTION_TOOLBAR_ACTION.CHAT
            ]
          }
        </ActionButton>
      </ButtonsContainer>
    </StyledModal>
  );
};

export default TextSelectionToolbar;
