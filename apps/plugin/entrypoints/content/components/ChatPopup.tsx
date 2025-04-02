import React, { useState, useEffect, useRef } from 'react';
import { useClickAway } from 'ahooks';
import { Modal, Input, Button, Typography } from 'antd';
import styled from 'styled-components';

const { TextArea } = Input;
const { Text } = Typography;

const POPUP_HEIGHT = 200; // 估计的弹窗高度
const POPUP_DISTANCE = 5; // 与选区的距离

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

  // 弹窗引用
  const popupRef = useRef<HTMLDivElement>(null);

  // 使用 useClickAway 监听点击弹窗外部的事件
  useClickAway(() => {
    if (open) {
      console.log('点击聊天弹窗外部，关闭弹窗');
      onClose();
    }
  }, () => {
    // 返回要监听的元素，聊天弹窗使用Modal渲染
    return document.querySelector('.ant-modal-content');
  });

  // 发送消息
  const handleSend = () => {
    // 防止重复发送
    if (sending) return;
    setSending(true);

    // 发送消息到侧边栏
    chrome.runtime.sendMessage({
      action: 'sendSelectedText',
      text: text.trim()
    }, () => {
      console.log('已发送消息到侧边栏:', text);
      // 重置状态
      setSending(false);
      // 关闭弹窗
      onClose();
    });
  };

  // 计算Modal位置 - 采用与工具栏相同的定位逻辑
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

        // 计算聊天弹窗的left位置：划词区域left + 划词区域宽度的一半 - 弹窗宽度的一半
        const modalWidth = 320; // Modal的宽度
        const newX = selectionLeft + rect.width / 2 - modalWidth / 2;

        // 默认计算top位置：划词区域top + 划词区域高度
        let newY = selectionTop + rect.height + POPUP_DISTANCE;

        // 如果top已经超出了边界，则计算为划词区域top - 弹窗高度
        if (newY + POPUP_HEIGHT > window.innerHeight + window.scrollY) {
          newY = selectionTop - POPUP_HEIGHT - POPUP_DISTANCE;
        }

        // 确保不超出左右边界
        const adjustedX = Math.max(10, Math.min(newX, window.innerWidth - modalWidth - 10));

        setModalPosition({ x: adjustedX, y: newY });
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
      modalRender={(modal) => <div ref={popupRef}>{modal}</div>}
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
