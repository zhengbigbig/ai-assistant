import React, { useState, useRef, useEffect } from 'react';
import './styles.css';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  magicPrompt: string | null;
  onClearPrompt: () => void;
}

/**
 * 聊天输入框组件
 * 用于用户输入消息和发送
 */
const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  magicPrompt,
  onClearPrompt,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight > 200
        ? '200px'
        : `${scrollHeight}px`;
    }
  }, [value]);

  // 自动聚焦
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 按 Enter 发送消息（但 Shift+Enter 为换行）
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 发送消息
  const handleSend = () => {
    // 组合魔法指令和用户输入
    const messageToSend = magicPrompt
      ? `${magicPrompt}\n\n${value}`
      : value;

    onSend(messageToSend);

    // 清空魔法指令
    if (magicPrompt) {
      onClearPrompt();
    }
  };

  return (
    <div className="chat-input">
      {magicPrompt && (
        <div className="magic-prompt">
          <div className="magic-prompt-content">{magicPrompt}</div>
          <button
            className="clear-prompt-button"
            onClick={onClearPrompt}
            title="清除指令"
          >
            &times;
          </button>
        </div>
      )}
      <div className="input-container">
        <textarea
          ref={textareaRef}
          className="message-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，按 Enter 发送..."
          rows={1}
        />
        <button
          className="send-button"
          onClick={handleSend}
          disabled={!value.trim()}
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
