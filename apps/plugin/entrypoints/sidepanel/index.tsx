import React, { useEffect, useState } from 'react';
import { createStyles } from 'antd-style';
import {
  ChatIcon,
  ScreenshotIcon,
  SettingsIcon,
  WindowResizeIcon
} from '../../components/Icons';
import WindowResizer from './WindowResizer';
import Chat from './Chat';
import { useChatStore } from '../stores/chatStore';
import './styles.css';

const useStyles = createStyles(({ token, css }) => {
  return {
    sidePanel: css`
      display: flex;
      flex-direction: column;
      height: 100%;
      background: ${token.colorBgContainer};
      color: ${token.colorText};
    `,
    sidebarControls: css`
      display: flex;
      justify-content: space-around;
      padding: 10px 0;
      border-top: 1px solid ${token.colorBorder};
    `,
    controlBtn: css`
      background: none;
      border: none;
      color: ${token.colorTextSecondary};
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;

      &:hover {
        background: ${token.colorBgTextHover};
        color: ${token.colorPrimary};
      }
    `,
  };
});

/**
 * AI 助手侧边栏组件
 * 实现类似ChatGPT的侧边栏界面
 */
const SidePanel: React.FC = () => {
  const { styles } = useStyles();
  const [showResizer, setShowResizer] = useState(false);
  const { addMessage, setMessages } = useChatStore();

  // 预设的对话建议
  const suggestedPrompts = [
    "写一首关于智能手机的莎士比亚风格的十四行诗",
    "为孩子们建议10种创意万圣节服装",
    "概述学习个人理财的初学者路线图"
  ];

  // 监听来自background或content script的消息
  useEffect(() => {
    // 监听来自background或content script的消息
    const messageListener = (message: any, sender: any, sendResponse: (response?: any) => void) => {
      if (message.action === 'addSelectedText' && message.text) {
        console.log('addSelectedText',message.text)
        // 如果需要立即发送消息
        if (message.sendImmediately) {
          // 创建用户消息
          const userMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: message.text,
            status: 'done' as const
          };

          // 获取当前消息列表并添加新消息
          const currentMessages = useChatStore.getState().messages;
          const newMessages = [...currentMessages, userMessage];
          setMessages(newMessages);

          // 触发发送
          useChatStore.getState().setMessages(newMessages);
        }

        sendResponse({ success: true });
      } else if (message.action === 'syncSelectedText' && message.text) {
        console.log('syncSelectedText',message.text)
        // 只同步文本到输入框，不发送
        useChatStore.getState().setSelectedText(message.text);
        // 注意：这部分功能现在需要在Chat组件内部实现
        sendResponse({ success: true });
      } else if (message.action === 'addScreenshot' && message.imageUrl) {
        // 添加截图消息
        const userMessage = {
          id: Date.now().toString(),
          role: 'user' as const,
          content: message.text || '截图',
          imageUrl: message.imageUrl,
          status: 'done' as const
        };

        addMessage(userMessage);
        sendResponse({ success: true });
      }
      return true;
    };

    // 添加消息监听器
    chrome.runtime.onMessage.addListener(messageListener);

    // 组件卸载时清理监听器
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      // 取消进行中的请求
      const abortController = useChatStore.getState().abortController;
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

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
    <div className={styles.sidePanel}>
      {/* 窗口缩放组件 */}
      <WindowResizer
        isOpen={showResizer}
        onClose={() => setShowResizer(false)}
      />

      {/* 聊天组件 */}
      <Chat suggestedPrompts={suggestedPrompts} />

      {/* 侧边栏操作按钮 */}
      <div className={styles.sidebarControls}>
        <button className={styles.controlBtn}>
          <ChatIcon width={20} height={20} />
          <span className="sr-only">对话</span>
        </button>
        <button
          className={styles.controlBtn}
          onClick={handleScreenshot}
          title="截取整个页面"
        >
          <ScreenshotIcon width={20} height={20} />
          <span className="sr-only">截图</span>
        </button>
        <button
          className={styles.controlBtn}
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
          className={styles.controlBtn}
          onClick={handleWindowResize}
          title="窗口缩放"
        >
          <WindowResizeIcon width={20} height={20} />
          <span className="sr-only">窗口缩放</span>
        </button>
        <button
          className={styles.controlBtn}
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
