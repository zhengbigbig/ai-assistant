import { defineContentScript } from 'wxt/sandbox';
import { startExtendedAreaScreenshot } from './screenshot';
import { createRoot } from 'react-dom/client';
import { createShadowRootUi } from 'wxt/client';
import App from './App';

// 定义内容脚本
export default defineContentScript({
  matches: ['*://*/*'],
  async main(ctx) {
    console.log('Hello content script.');

    const ui = await createShadowRootUi(ctx, {
      name: 'ai-assistant-content-script',
      position: 'overlay',
      anchor: 'body',
      append: 'first',
      zIndex: 9999,
      onMount: (container) => {
        // 存储shadowRoot引用
        const globalShadowRoot = container.getRootNode() as ShadowRoot;

        // Don't mount react app directly on <body>
        const wrapper = document.createElement('div');
        container.append(wrapper);
        const root = createRoot(wrapper);
        root.render(<App shadowRoot={globalShadowRoot} />);
        return { root, wrapper };
      },
      onRemove: (elements) => {
        elements?.root.unmount();
        elements?.wrapper.remove();
      },
    });
    ui.mount();

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
        // 直接开始选定区域截图模式，不再显示选择按钮
        console.log('Starting extended area screenshot mode');
        startExtendedAreaScreenshot();
        sendResponse({ success: true });
      }
      return true;
    });
  },
});
