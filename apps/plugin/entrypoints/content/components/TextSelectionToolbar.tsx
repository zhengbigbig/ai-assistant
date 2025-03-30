import React, { useEffect, useState } from 'react';
import { Button, Space, Modal } from 'antd';
import styled from 'styled-components';

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
      if (rect) {
        let newX = position.x;
        let newY = position.y + rect?.y; // 默认在选择区域下方
        // 确保不超出右边界
        if (newX + rect.width > window.innerWidth) {
          newX = window.innerWidth - rect.width - 10;
        }

        // 确保不超出下边界，如果超出则显示在选区上方
        if (newY + rect.height > window.innerHeight) {
          newY = position.y - rect.height - 10;
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
