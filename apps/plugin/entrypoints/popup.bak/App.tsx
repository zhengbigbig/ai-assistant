import React from 'react';
import './App.css';

/**
 * 弹出窗口应用组件
 * 提供快捷操作，包括打开侧边栏、打开设置页面等
 */
export default function App() {
  /**
   * 打开侧边栏
   */
  const openSidePanel = () => {
    // 使用 Chrome API 打开侧边栏
    // @ts-ignore - Chrome API 类型定义问题
    chrome.sidePanel.open().catch(err => {
      console.error('Failed to open side panel:', err);
    });
    // 关闭弹出窗口
    window.close();
  };

  /**
   * 打开设置页面
   */
  const openOptions = () => {
    chrome.runtime.openOptionsPage().catch(err => {
      console.error('Failed to open options page:', err);
    });
    // 关闭弹出窗口
    window.close();
  };

  /**
   * 截取页面截图
   */
  const captureScreenshot = () => {
    // 发送消息到后台脚本，请求截取当前页面截图
    chrome.runtime.sendMessage({ action: 'captureScreenshot' });
    // 关闭弹出窗口
    window.close();
  };

  return (
    <div className="container">
      <h1>AI Assistant</h1>
      <div className="button-group">
        <button className="button" onClick={openSidePanel}>
          打开AI助手
        </button>
        <button className="button" onClick={captureScreenshot}>
          截取页面截图
        </button>
        <button className="button" onClick={openOptions}>
          设置
        </button>
      </div>
      <div className="footer">
        <p>快捷键: Alt+A 打开侧边栏 | Alt+S 截图</p>
      </div>
    </div>
  );
}
