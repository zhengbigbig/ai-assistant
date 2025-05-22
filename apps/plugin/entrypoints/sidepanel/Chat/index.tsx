import {
  CopyOutlined,
  DislikeOutlined,
  LikeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Bubble, Prompts, Welcome } from '@ant-design/x';
import { Button, Space, Spin } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import {
  useChatStore,
  useMessages
} from '../../stores/chatStore';
import ChatInput from './ChatInput';

// 定义聊天组件Props
interface ChatProps {
  suggestedPrompts?: string[];
}

const AGENT_PLACEHOLDER = '生成内容中，请稍候...';

const useStyles = createStyles(({ token, css }) => {
  return {
    chatContainer: css`
      flex: 1;
      overflow: auto;
      padding-block: 16px;
    `,
    chatWelcome: css`
      margin-inline: 16px;
      padding: 12px 16px;
      border-radius: 2px 12px 12px 12px;
      background: ${token.colorBgTextHover};
      margin-bottom: 16px;
    `,
    inputArea: css`
      padding: 8px;
      /* border-top: 1px solid ${token.colorBorder}; */
    `,
    loadingMessage: css`
      background-image: linear-gradient(
        90deg,
        #ff6b23 0%,
        #af3cb8 31%,
        #53b6ff 89%
      );
      background-size: 100% 2px;
      background-repeat: no-repeat;
      background-position: bottom;
    `,
    speechButton: css`
      font-size: 18px;
      color: ${token.colorText} !important;
    `,
    messageFooter: css`
      display: flex;
    `,
  };
});

const Chat: React.FC<ChatProps> = ({ suggestedPrompts = [] }) => {
  const { styles } = useStyles();
  const messages = useMessages();

  const {
    setSelectedMessageIndex,
    chatOpenAI,
    retryChatOpenAI,
    copyMessage,
  } = useChatStore();

  // 处理消息点击
  const handleMessageClick = (index: number) => {
    setSelectedMessageIndex(index);
  };

  // 操作栏组件
  const MessageActions = () => (
    <div className={styles.messageFooter}>
      <Button
        type="text"
        size="small"
        icon={<ReloadOutlined />}
        onClick={retryChatOpenAI}
      />
      <Button
        type="text"
        size="small"
        icon={<CopyOutlined />}
        onClick={copyMessage}
      />
      <Button type="text" size="small" icon={<LikeOutlined />} />
      <Button type="text" size="small" icon={<DislikeOutlined />} />
    </div>
  );

  return (
    <>
      {/* 聊天内容区域 */}
      <div className={styles.chatContainer}>
        {messages?.length ? (
          /** 消息列表 */
          <Bubble.List
            style={{ height: '100%', paddingInline: 16 }}
            items={messages.map((msg, index) => ({
              role: msg.role,
              content: msg.content,
              imageUrl: msg.imageUrl,
              onClick: () => handleMessageClick(index),
              classNames: {
                content: msg.status === 'loading' ? styles.loadingMessage : '',
              },
              typing:
                msg.status === 'loading'
                  ? { step: 5, interval: 20, suffix: <>💗</> }
                  : false,
            }))}
            roles={{
              assistant: {
                placement: 'start',
                footer: <MessageActions />,
                loadingRender: () => (
                  <Space>
                    <Spin size="small" />
                    {AGENT_PLACEHOLDER}
                  </Space>
                ),
              },
              user: { placement: 'end' },
            }}
          />
        ) : (
          /** 没有消息时的 welcome */
          <>
            <Welcome
              variant="borderless"
              title="👋 你好，我是AI助手"
              description="我可以帮助你解答问题、生成内容、提供建议等"
              className={styles.chatWelcome}
            />

            <Prompts
              vertical
              title="我可以帮你："
              items={suggestedPrompts.map((i) => ({ key: i, description: i }))}
              onItemClick={(info) =>
                chatOpenAI(info?.data?.description as string)
              }
              style={{
                marginInline: 16,
              }}
              styles={{
                title: { fontSize: 14 },
              }}
            />
          </>
        )}
      </div>

      {/* 底部输入区域 */}
      <div className={styles.inputArea}>
        <ChatInput />
      </div>
    </>
  );
};

export default Chat;
