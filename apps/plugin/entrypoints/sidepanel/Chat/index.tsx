import {
  CopyOutlined,
  DislikeOutlined,
  LikeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Bubble, BubbleProps, Prompts, Welcome } from '@ant-design/x';
import { Button, Space, Spin, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect } from 'react';
import { useChatStore, useMessages } from '../../stores/chatStore';
import { useActiveSessionId, useSessions, useSessionStore } from '../../stores/sessionStore';
import ChatInput from './ChatInput';
import markdownit from 'markdown-it';
import ChatInputHeader from './ChatInputHeader';

const md = markdownit({ html: true, breaks: true });

// 定义聊天组件Props
interface ChatProps {
  suggestedPrompts?: string[];
}

const AGENT_PLACEHOLDER = '生成内容中，请稍候...';

const renderMarkdown: BubbleProps['messageRender'] = (content) => {
  return (
    <Typography>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
      <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
    </Typography>
  );
};

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
  const sessions = useSessions();
  const activeSessionId = useActiveSessionId();
  const { createNewSession } = useSessionStore();
  const { setSelectedMessageIndex, chatOpenAI, retryChatOpenAI, copyMessage, loadMessagesFromSession, initSubscriptions } =
    useChatStore();

  // 初始化订阅
  useEffect(() => {
    initSubscriptions();
  }, [initSubscriptions]);

  // 如果没有活跃会话，创建一个新会话
  useEffect(() => {
    if (sessions.length === 0) {
      // 没有任何会话，创建一个新会话
      createNewSession();
    } else if (!activeSessionId) {
      // 有会话但没有激活的会话，激活第一个会话
      loadMessagesFromSession(sessions[0].id);
    }
  }, [sessions, activeSessionId, createNewSession, loadMessagesFromSession]);

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
              messageRender: renderMarkdown,
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
        <ChatInputHeader />
        <ChatInput />
      </div>
    </>
  );
};

export default Chat;
