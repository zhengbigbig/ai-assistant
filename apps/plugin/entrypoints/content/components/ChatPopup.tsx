import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography } from 'antd';
import styled from 'styled-components';

const { TextArea } = Input;
const { Text } = Typography;

interface ChatPopupProps {
  open: boolean;
  position: { x: number; y: number };
  selectedText: string;
  onClose: () => void;
}

const StyledModal = styled(Modal)`
  position: fixed !important;
  top: ${props => props.style?.top}px;
  left: ${props => props.style?.left}px;
  width: 320px;

  .ant-modal {
    position: absolute !important;
  }

  .ant-modal-content {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .ant-modal-header {
    border-bottom: none;
    padding: 12px 16px;
  }

  .ant-modal-body {
    padding: 12px 16px;
  }

  .ant-modal-footer {
    border-top: none;
    padding: 8px 16px 12px;
  }

  // 移除遮罩层样式已通过mask={false}属性设置
`;

const ChatPopup: React.FC<ChatPopupProps> = ({
  open,
  position,
  selectedText,
  onClose
}) => {
  // 允许用户编辑选中的文本
  const [text, setText] = useState(selectedText);
  const [modalPosition, setModalPosition] = useState({ x: position.x, y: position.y + 20 });
  const [sending, setSending] = useState(false);

  // 发送消息
  const handleSend = () => {
    // 防止重复发送
    if (sending) return;
    setSending(true);

    // 打开侧边栏并发送消息
    chrome.runtime.sendMessage({
      action: 'openSidePanel'
    }, () => {
      // 然后发送选中的文本
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'addSelectedText',
          text: text.trim()
        }, () => {
          console.log('已发送消息到侧边栏:', text);
          // 重置状态
          setSending(false);
          // 关闭弹窗
          onClose();
        });
      }, 500); // 给侧边栏打开留出时间
    });
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
      title="AI助手"
      open={open}
      onCancel={onClose}
      mask={false}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="send"
          type="primary"
          onClick={handleSend}
          style={{ backgroundColor: '#6e59f2' }}
          loading={sending}
        >
          发送
        </Button>
      ]}
      maskClosable={false}
      style={{
        left: modalPosition.x,
        top: modalPosition.y,
        position: 'fixed'
      }}
      width={320}
      getContainer={false}
      modalRender={(modal) => <div>{modal}</div>}
    >
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>已选中文本内容：</Text>
      </div>
      <TextArea
        autoSize={{ minRows: 3, maxRows: 5 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ marginBottom: 8 }}
        placeholder="编辑消息内容..."
      />
    </StyledModal>
  );
};

export default ChatPopup;
