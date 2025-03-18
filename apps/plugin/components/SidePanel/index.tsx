import React, { useState, useEffect } from 'react';
import {
  ChatIcon,
  HelpIcon,
  ScreenshotIcon,
  CopyIcon,
  QuestionIcon,
  FeedbackIcon,
  SettingsIcon,
  MicrophoneIcon,
  AtSignIcon,
  SendIcon
} from '../Icons';
import './styles.css';

/**
 * AI 助手侧边栏组件
 * 实现类似ChatGPT的侧边栏界面
 */
const SidePanel: React.FC = () => {
  // 输入框内容
  const [inputValue, setInputValue] = useState('');

  // 聊天消息列表
  const [messages, setMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
  }>>([
    {
      id: '1',
      role: 'assistant',
      content: '你好,\n我今天能帮你什么?',
    },
  ]);

  // 预设的对话建议
  const suggestedPrompts = [
    "写一首关于智能手机的莎士比亚风格的十四行诗 →",
    "为孩子们建议10种创意万圣节服装 →",
    "概述学习个人理财的初学者路线图 →"
  ];

  // 从存储中加载消息并监听新消息
  useEffect(() => {
    // 从本地存储加载消息历史
    chrome.storage.local.get(['messages'], (result) => {
      if (result.messages && Array.isArray(result.messages) && result.messages.length > 0) {
        setMessages(result.messages);
      }
    });

    // 监听来自background或content script的消息
    const messageListener = (message: any, sender: any, sendResponse: (response?: any) => void) => {
      if (message.action === 'addSelectedText' && message.text) {
        // 添加选定的文本到输入框
        setInputValue((prev) => {
          const newValue = prev ? `${prev}\n\n${message.text}` : message.text;
          return newValue;
        });
        sendResponse({ success: true });
      } else if (message.action === 'addScreenshot' && message.text) {
        // 添加截图文本到输入框
        setInputValue((prev) => {
          const newValue = prev
            ? `${prev}\n\n[图片内容]\n${message.text}`
            : `[图片内容]\n${message.text}`;
          return newValue;
        });
        sendResponse({ success: true });
      }
      return true;
    };

    // 添加消息监听器
    chrome.runtime.onMessage.addListener(messageListener);

    // 组件卸载时清理监听器
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // 保存消息到存储
  useEffect(() => {
    if (messages.length > 1) {
      chrome.storage.local.set({ messages });
    }
  }, [messages]);

  // 发送消息
  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    // 创建用户消息
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
    };

    // 更新消息列表
    setMessages((prev) => [...prev, userMessage]);

    // 清空输入框
    setInputValue('');

    // 模拟 AI 回复（实际应用中应该调用 API）
    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `这是一个模拟回复。你发送的消息是：${content}`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  // 处理预设提示点击
  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  // 处理输入框提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // 处理截图按钮点击
  const handleScreenshot = () => {
    chrome.runtime.sendMessage({ action: 'captureScreenshot' });
  };

  return (
    <div className="sider-panel">
      <div className="chat-container">
        {/* 聊天内容区域 */}
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-content">
                {message.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 建议提示区域 - 只在没有用户消息时显示 */}
        {messages.length === 1 && (
          <div className="suggested-prompts">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                className="prompt-btn"
                onClick={() => handlePromptClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 底部输入区域 */}
      <div className="input-area">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-container">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              rows={1}
              className="message-input"
            />
            <div className="action-buttons">
              <button type="button" className="action-btn mic">
                <MicrophoneIcon width={18} height={18} />
                <span className="sr-only">语音输入</span>
              </button>
              <button type="button" className="action-btn at">
                <AtSignIcon width={18} height={18} />
                <span className="sr-only">@提及</span>
              </button>
              <button
                type="submit"
                className="action-btn send"
                disabled={!inputValue.trim()}
              >
                <SendIcon width={18} height={18} />
                <span className="sr-only">发送</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 侧边栏操作按钮 */}
      <div className="sidebar-controls">
        <button className="control-btn chat">
          <ChatIcon width={20} height={20} />
          <span className="sr-only">对话</span>
        </button>
        <button className="control-btn help">
          <HelpIcon width={20} height={20} />
          <span className="sr-only">帮助</span>
        </button>
        <button
          className="control-btn screenshot"
          onClick={handleScreenshot}
        >
          <ScreenshotIcon width={20} height={20} />
          <span className="sr-only">截图</span>
        </button>
        <button className="control-btn copy">
          <CopyIcon width={20} height={20} />
          <span className="sr-only">复制</span>
        </button>
        <button className="control-btn question">
          <QuestionIcon width={20} height={20} />
          <span className="sr-only">问题</span>
        </button>
        <button className="control-btn feedback">
          <FeedbackIcon width={20} height={20} />
          <span className="sr-only">反馈</span>
        </button>
        <button className="control-btn settings">
          <SettingsIcon width={20} height={20} />
          <span className="sr-only">设置</span>
        </button>
      </div>
    </div>
  );
};

export default SidePanel;
