import React, { useRef, useEffect } from 'react';
import './styles.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatListProps {
  messages: Message[];
}

/**
 * 聊天消息列表组件
 * 展示用户和 AI 的对话消息
 */
const ChatList: React.FC<ChatListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 新消息到达时滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 格式化时间戳
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
        >
          <div className="message-header">
            <span className="message-role">
              {message.role === 'user' ? '你' : 'AI助手'}
            </span>
            <span className="message-time">{formatTime(message.timestamp)}</span>
          </div>
          <div className="message-content">{message.content}</div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatList;
