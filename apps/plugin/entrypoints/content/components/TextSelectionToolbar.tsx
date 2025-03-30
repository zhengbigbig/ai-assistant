import React, { useEffect, useState } from 'react';
import { Button, Space, Modal } from 'antd';
import styled from 'styled-components';
import { TranslationOutlined, FileTextOutlined, ArrowRightOutlined } from '@ant-design/icons';

const TOOLBAR_HEIGHT = 40;
const TOOLBAR_DISTANCE = 5;

interface TextSelectionToolbarProps {
  open: boolean;
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onShowChat: () => void;
}

// 工具栏样式（基于Modal）
const StyledModal = styled(Modal)`
  &&& {
    position: absolute !important;
    top: ${props => props.style?.top}px;
    left: ${props => props.style?.left}px;
    transform: translate(-50%, 0);
    padding: 0;
    margin: 0;
  }

  &&& .ant-modal-content {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    padding: 0;
  }

  &&& .ant-modal-body {
    padding: 2px 4px;
  }
`;

// 按钮样式
const ActionButton = styled(Button)`
  &&& {
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
  }
`;

const ButtonsContainer = styled(Space)`
  &&& {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }
`;

const TextSelectionToolbar: React.FC<TextSelectionToolbarProps> = ({
  open,
  selectedText,
  position,
  onClose,
  onShowChat
}) => {
  const [modalPosition, setModalPosition] = useState({ x: position.x, y: position.y + 20 });

  // 处理各种操作
  const handleAction = (action: string) => {
    // 关闭工具栏
    onClose();

    // 显示聊天弹窗
    onShowChat();

    // 发送相应的命令和文本到侧边栏
    setTimeout(() => {
      const messagePrefix = action === 'translate'
        ? '翻译: '
        : action === 'explain'
          ? '解释: '
          : '';

      chrome.runtime.sendMessage({
        action: 'addSelectedText',
        text: `${messagePrefix}${selectedText}`
      }, (response) => {
        console.log('发送划词和操作到侧边栏:', response);
      });
    }, 500);
  };

  // 计算Modal位置
  useEffect(() => {
    // 延迟获取DOM的宽高，确保Modal已渲染
    const timer = setTimeout(() => {
      // 获取选区宽高
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        // 划词区域相对于页面的位置
        const selectionLeft = rect.left + window.scrollX;
        const selectionTop = rect.top + window.scrollY;

        // 计算工具栏的left位置：划词区域left + 划词区域宽度的一半
        const newX = selectionLeft + (rect.width / 2);

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
      maskClosable={true}
      onCancel={onClose}
      mask={false}
      style={modalStyle}
      width={180}
      // 渲染到shadowRoot
      getContainer={false}
      modalRender={(modal) => (
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>
          {modal}
        </div>
      )}
    >
      <ButtonsContainer size={0} direction="horizontal">
        <ActionButton
          type="text"
          onClick={() => handleAction('translate')}
          icon={<TranslationOutlined />}
        >
          翻译
        </ActionButton>
        <ActionButton
          type="text"
          onClick={() => handleAction('explain')}
          icon={<FileTextOutlined />}
        >
          解释
        </ActionButton>
        <ActionButton
          type="text"
          onClick={() => handleAction('chat')}
          icon={<ArrowRightOutlined />}
        >
          发送
        </ActionButton>
      </ButtonsContainer>
    </StyledModal>
  );
};

export default TextSelectionToolbar;
