import { defineContentScript } from 'wxt/sandbox';
import { startExtendedAreaScreenshot } from './screenshot';
import { setupTextSelectionHandler } from './textSelection';

// 定义内容脚本
export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'], // 匹配所有网页
  runAt: 'document_end', // 在 DOM 加载完成后运行
  main() {
    console.log('AI Assistant content script loaded');

    // 添加划词处理
    setupTextSelectionHandler();

    // 监听来自后台的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message);

      if (message.action === 'getSelectedText') {
        // 获取并返回当前选中的文本
        const selectedText = window.getSelection()?.toString() || '';
        // 文本存在则调用发送
        if (selectedText) {
          sendResponse({ text: selectedText });
        }
      } else if (message.action === 'startAreaScreenshot') {
        // 直接开始扩展区域截图模式，不再显示选择按钮
        console.log('Starting extended area screenshot mode');
        startExtendedAreaScreenshot();
        sendResponse({ success: true });
      }
      return true;
    });
  },
});


