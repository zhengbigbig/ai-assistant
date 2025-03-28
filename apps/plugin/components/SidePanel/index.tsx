import React, { useEffect, useState } from 'react';
import {
  AtSignIcon,
  ChatIcon,
  MicrophoneIcon,
  ScreenshotIcon,
  SendIcon,
  SettingsIcon,
  WindowResizeIcon
} from '../Icons';
import WindowResizer from '../WindowResizer';
import './styles.css';

// 定义消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  // 可选的图片URL
  imageUrl?: string;
}

/**
 * AI 助手侧边栏组件
 * 实现类似ChatGPT的侧边栏界面
 */
const SidePanel: React.FC = () => {
  // 输入框内容
  const [inputValue, setInputValue] = useState('');

  // 聊天消息列表
  const [messages, setMessages] = useState<Message[]>([
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

  const [showResizer, setShowResizer] = useState(false);

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
      } else if (message.action === 'addScreenshot' && message.imageUrl) {
        // 检查是否要添加到输入框
        if (message.addToInput) {
          // 将截图URL添加到输入框中或存储在状态中以便后续发送
          setInputValue((prev) => {
            const imageDescription = message.text || '截图';
            // 这里只存储图片链接描述，实际发送消息时会将其转换为带图片的消息
            const newValue = prev ? `${prev}\n\n[${imageDescription}](${message.imageUrl})` : `[${imageDescription}](${message.imageUrl})`;
            return newValue;
          });
        } else {
          // 原有行为：创建带有截图的消息
          const screenshotMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: message.text || '截图',
            imageUrl: message.imageUrl
          };

          // 添加消息到列表
          setMessages(prev => [...prev, screenshotMessage]);

          // 模拟AI响应
          setTimeout(() => {
            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: '我已接收到您的截图，有什么需要我帮助解析的吗？'
            };
            setMessages(prev => [...prev, assistantMessage]);
          }, 1000);
        }
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

    // 检查消息中是否包含图片链接
    const imgLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let matches;
    let processedContent = content;
    const images: { description: string, url: string }[] = [];

    // 提取所有图片链接
    while ((matches = imgLinkRegex.exec(content)) !== null) {
      const [fullMatch, description, url] = matches;
      images.push({ description, url });
      // 从文本中移除图片链接
      processedContent = processedContent.replace(fullMatch, '');
    }

    // 清理处理后的内容
    processedContent = processedContent.trim();

    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: processedContent || (images.length > 0 ? images[0].description : ''),
      // 如果有图片，添加第一张图片URL
      imageUrl: images.length > 0 ? images[0].url : undefined
    };

    // 更新消息列表
    setMessages((prev) => [...prev, userMessage]);

    // 清空输入框
    setInputValue('');

    // 模拟 AI 回复（实际应用中应该调用 API）
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `这是一个模拟回复。你发送的消息是：${processedContent}${images.length > 0 ? '，并附带了图片' : ''}`,
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
    console.log('Screenshot button clicked');
    chrome.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
      console.log('captureScreenshot response:', response);
    });
  };

  // 处理区域截图按钮点击
  const handleAreaScreenshot = () => {
    console.log('Area screenshot button clicked');
    chrome.runtime.sendMessage({ action: 'startAreaScreenshot' }, (response) => {
      console.log('startAreaScreenshot response:', response);
    });
  };

  // 处理窗口缩放按钮点击
  const handleWindowResize = () => {
    console.log('Window resize button clicked');
    setShowResizer(true);
  };

  // 处理设置按钮点击
  const handleOpenSettings = () => {
    console.log('Settings button clicked');
    chrome.runtime.sendMessage({ action: 'openOptionsPage' }, (response) => {
      console.log('openOptionsPage response:', response);
    });
  };

  return (
    <div className="sider-panel">
      {/* 窗口缩放组件 */}
      <WindowResizer
        isOpen={showResizer}
        onClose={() => setShowResizer(false)}
      />

      <div className="chat-container">
        {/* 聊天内容区域 */}
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-content">
                {/* 如果有图片，则显示图片 */}
                {message.imageUrl && (
                  <div className="message-image">
                    <img src={message.imageUrl} alt="截图" className="screenshot-image" />
                  </div>
                )}
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
        <button
          className="control-btn screenshot"
          onClick={handleScreenshot}
          title="截取整个页面"
        >
          <ScreenshotIcon width={20} height={20} />
          <span className="sr-only">截图</span>
        </button>
        <button
          className="control-btn area-screenshot"
          onClick={handleAreaScreenshot}
          title="截取选定区域"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M9 9h6v6H9z" fill="currentColor" />
          </svg>
          <span className="sr-only">区域截图</span>
        </button>
        <button
          className="control-btn window-resize"
          onClick={handleWindowResize}
          title="窗口缩放"
        >
          <WindowResizeIcon width={20} height={20} />
          <span className="sr-only">窗口缩放</span>
        </button>
        <button
          className="control-btn settings"
          onClick={handleOpenSettings}
          title="设置选项"
        >
          <SettingsIcon width={20} height={20} />
          <span className="sr-only">设置</span>
        </button>
      </div>
    </div>
  );
};

export default SidePanel;
