import React, { useEffect, useState } from 'react';
import { Button, Space, Modal } from 'antd';
import styled from 'styled-components';

interface TextSelectionToolbarProps {
  selectedText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onShowChat: () => void;
}

// 工具栏样式（基于Modal）
const StyledModal = styled(Modal)`
  .ant-modal-content {
    position: fixed;
    left: ${props => props.style?.left}px;
    top: ${props => props.style?.top}px;
    padding: 8px 12px;
    width: auto;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .ant-modal-body {
    padding: 0;
    display: flex;
    align-items: center;
  }

  // 隐藏标题和页脚
  .ant-modal-header, .ant-modal-footer {
    display: none;
  }

  // 移除遮罩层
  .ant-modal-mask {
    display: none;
  }
`;

const TextSelectionToolbar: React.FC<TextSelectionToolbarProps> = ({
  selectedText,
  position,
  onClose,
  onShowChat
}) => {
  const [modalPosition, setModalPosition] = useState({ x: position.x, y: position.y + 20 });

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
      const modalElement = document.querySelector('.ant-modal-content') as HTMLElement;
      if (modalElement) {
        const rect = modalElement.getBoundingClientRect();
        let newX = position.x;
        let newY = position.y + 20; // 默认在选择区域下方

        // 确保不超出右边界
        if (newX + rect.width > window.innerWidth) {
          newX = window.innerWidth - rect.width - 10;
        }

        // 确保不超出下边界，如果超出则显示在选区上方
        if (newY + rect.height > window.innerHeight) {
          newY = position.y - rect.height - 10;
        }

        setModalPosition({ x: newX, y: newY });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [position]);

  return (
    <StyledModal
      open={true}
      closable={false}
      footer={null}
      maskClosable={true}
      onCancel={onClose}
      style={{
        left: modalPosition.x,
        top: modalPosition.y
      }}
      width="auto"
    >
      <Space>
        <Button
          type="primary"
          size="small"
          onClick={handleSendToAI}
          style={{ backgroundColor: '#6e59f2' }}
        >
          发送到AI助手
        </Button>
      </Space>
    </StyledModal>
  );
};

export default TextSelectionToolbar;
