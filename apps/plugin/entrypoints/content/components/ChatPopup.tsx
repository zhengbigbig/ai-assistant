import {
  BookOutlined,
  CloseOutlined,
  CopyOutlined,
  PushpinFilled,
  PushpinOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { Button, Modal, Space, Typography, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const { Text, Title } = Typography;

const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 500;
const POPUP_DISTANCE = 5;

interface ChatPopupProps {
  open: boolean;
  position: { x: number; y: number };
  selectedText: string;
  onClose: () => void;
  title?: string;
  onPinnedChange: (pinned: boolean) => void;
}

const StyledModal = styled(Modal)`
  position: fixed !important;
  width: ${POPUP_WIDTH}px !important;
  transition: all 0.2s ease-in-out;

  .ant-modal-content {
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    height: ${POPUP_HEIGHT}px;
    display: flex;
    flex-direction: column;
    transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
  }

  .ant-modal-body {
    padding: 0;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch; /* 为移动设备提供平滑滚动 */
    scrollbar-width: thin; /* Firefox */
    &::-webkit-scrollbar {
      width: 5px; /* Webkit浏览器 */
    }
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }
  }

  .ant-modal-title {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const QuestionBlock = styled.div`
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
`;

const AnswerBlock = styled.div`
  position: relative;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
`;

const ModelSelector = styled.div`
  position: absolute;
  bottom: 8px;
  right: 8px;
`;

const ChatPopup: React.FC<ChatPopupProps> = ({
  open,
  position,
  selectedText,
  onClose,
  title = '总结',
  onPinnedChange,
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [modalPosition, setModalPosition] = useState({
    x: position.x,
    y: position.y,
  });
  const [currentModel, setCurrentModel] = useState('GPT-4');
  const [isReading, setIsReading] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Mock 回答内容
  const mockAnswer =
    '这是一个模拟的 AI 回答内容。根据您的问题，我们可以从以下几个方面进行分析...';

  // 继续聊天，同步到 Sider
  const handleContinueChat = () => {
    chrome.runtime.sendMessage(
      {
        action: 'createNewChat',
        data: {
          question: selectedText,
          answer: mockAnswer,
        },
      },
      () => {
        console.log('已创建新的聊天记录');
        onClose();
      }
    );
  };

  // 添加到笔记
  const handleAddToNote = () => {
    chrome.runtime.sendMessage(
      {
        action: 'addToNote',
        data: {
          question: selectedText,
          answer: mockAnswer,
          model: currentModel,
          timestamp: new Date().toISOString(),
        },
      },
      () => {
        message.success('已添加到笔记');
      }
    );
  };

  // 朗读功能
  const handleRead = () => {
    if (!speechRef.current) {
      speechRef.current = new SpeechSynthesisUtterance();
      speechRef.current.lang = 'zh-CN';
    }

    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    const text = `问题：${selectedText}。回答：${mockAnswer}`;
    speechRef.current.text = text;

    speechRef.current.onend = () => {
      setIsReading(false);
    };

    window.speechSynthesis.speak(speechRef.current);
    setIsReading(true);
  };

  // 复制功能
  const handleCopy = async () => {
    const textToCopy = `问题：${selectedText}\n\n回答：${mockAnswer}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      message.success('已复制到剪贴板');
    } catch (err) {
      message.error('复制失败，请重试');
    }
  };

  // 清理朗读
  useEffect(() => {
    return () => {
      if (speechRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 计算 Modal 位置
  useEffect(() => {
    const timer = setTimeout(() => {
      // 1. 确定弹窗的尺寸
      const popupWidth = POPUP_WIDTH;
      const popupHeight = POPUP_HEIGHT;

      // 2. 以选区中心点为基准计算弹窗的初始位置（使弹窗中心与选区中心吻合）
      let newX = position.x - popupWidth / 2;
      let newY = position.y - popupHeight / 2;

      // 3. 获取可视窗口的尺寸
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // 4. 水平方向边界处理
      // 确保弹窗不会超出屏幕左侧
      if (newX < scrollX + 10) {
        newX = scrollX + 10;
      }
      // 确保弹窗不会超出屏幕右侧
      if (newX + popupWidth > scrollX + viewportWidth - 10) {
        newX = scrollX + viewportWidth - popupWidth - 10;
      }

      // 5. 垂直方向边界处理
      // 优先确保弹窗不超出底部
      if (newY + popupHeight > scrollY + viewportHeight - 10) {
        // 如果放在选区下方会超出屏幕底部，尝试放在选区上方
        const topPosition = position.y - popupHeight - 10;

        // 如果放在选区上方也会超出屏幕顶部，则固定在屏幕顶部
        if (topPosition < scrollY + 10) {
          // 固定在可视区域顶部
          newY = scrollY + 10;
        } else {
          // 放在选区上方
          newY = topPosition;
        }
      }

      console.log('调整后弹窗位置:', { x: newX, y: newY });
      setModalPosition({ x: newX, y: newY });
    }, 0);

    return () => clearTimeout(timer);
  }, [position]);

  return (
    <StyledModal
      title={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            height: 30,
            alignItems: 'center',
          }}
        >
          <Title level={5} style={{ margin: 0 }}>
            {title}
          </Title>
          <div>
            <Button
              type="text"
              icon={
                isPinned ? (
                  <PushpinFilled style={{ color: '#6e59f2' }} />
                ) : (
                  <PushpinOutlined />
                )
              }
              onClick={() => {
                setIsPinned((prev) => {
                  onPinnedChange(!prev);
                  return !prev;
                });
              }}
            />
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
          </div>
        </div>
      }
      open={open}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Button type="primary" onClick={handleContinueChat}>
            继续聊天
          </Button>
          <Space>
            <Button icon={<BookOutlined />} onClick={handleAddToNote}>
              添加到笔记
            </Button>
            <Button
              icon={<ReadOutlined />}
              onClick={handleRead}
              type={isReading ? 'primary' : 'default'}
            >
              {isReading ? '停止朗读' : '朗读'}
            </Button>
            <Button icon={<CopyOutlined />} onClick={handleCopy}>
              复制
            </Button>
          </Space>
        </div>
      }
      closable={false}
      mask={false}
      maskClosable={false}
      style={{
        left: modalPosition.x,
        top: modalPosition.y,
        position: 'fixed',
        margin: 0,
        padding: 0,
      }}
      width={POPUP_WIDTH}
      getContainer={false}
      modalRender={(modal) => (
        <div
          onMouseUp={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {modal}
        </div>
      )}
    >
      <ContentWrapper>
        <QuestionBlock>
          <Text strong>问题：</Text>
          <div>{selectedText}</div>
        </QuestionBlock>
        <AnswerBlock>
          <Text strong>回答：</Text>
          <div>{mockAnswer}</div>
          <ModelSelector>
            <Button
              type="link"
              onClick={() =>
                setCurrentModel(currentModel === 'GPT-4' ? 'GPT-3.5' : 'GPT-4')
              }
            >
              {currentModel}
            </Button>
          </ModelSelector>
        </AnswerBlock>
      </ContentWrapper>
    </StyledModal>
  );
};

export default ChatPopup;
