import React, { useEffect, useState } from 'react';
import { Button, Space, Modal } from 'antd';
import styled from 'styled-components';

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
  .ant-modal {
    position: absolute !important;
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
  console.log('open',open)
  // 处理发送文本到AI助手
  const handleSendToAI = () => {
    // 关闭工具栏
    onClose();

    // 显示聊天弹窗
    onShowChat();
  };

  // 计算Modal位置
  useEffect(() => {
    // 延迟获取DOM的宽高，确保Modal已渲染
    const timer = setTimeout(() => {
      // 获取选区宽高
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      console.log('rect',rect,window.scrollY)
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

        console.log('newX', newX, 'newY', newY);
        setModalPosition({ x: newX, y: newY });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [position]);

  return (
    <StyledModal
      open={open}
      closable={false}
      footer={null}
      maskClosable={true}
      onCancel={onClose}
      mask={false}
      style={{
        left: modalPosition.x,
        top: modalPosition.y,
        position: 'absolute',
      }}
      // 渲染到shadowRoot
      getContainer={false}
    >
      <Space size={4}>
        <Button
          type="primary"
          size="small"
          onClick={handleSendToAI}
          style={{ backgroundColor: '#6e59f2' }}
        >
          发送到AI助手
        </Button>
        <Button
          size="small"
          onClick={handleSendToAI}
        >
          提问
        </Button>
      </Space>
    </StyledModal>
  );
};

export default TextSelectionToolbar;
