import { defineContentScript } from '#imports';
import { createRoot } from 'react-dom/client';
import { createShadowRootUi } from '#imports';
import App from './App';
import { useTranslationStore } from '../stores/translationStore';

// 定义内容脚本
export default defineContentScript({
  matches: ['*://*/*'],
  async main(ctx: any) {
    console.log('Hello content script.');

    const ui = await createShadowRootUi(ctx, {
      name: 'ai-assistant-content-script',
      position: 'overlay',
      anchor: 'body',
      append: 'first',
      zIndex: 9999,
      onMount: (container: { getRootNode: () => ShadowRoot; append: (arg0: HTMLDivElement) => void; }) => {
        // 存储shadowRoot引用
        const globalShadowRoot = container.getRootNode() as ShadowRoot;

        // Don't mount react app directly on <body>
        const wrapper = document.createElement('div');
        container.append(wrapper);
        const root = createRoot(wrapper);
        root.render(<App shadowRoot={globalShadowRoot} />);
        return { root, wrapper };
      },
      onRemove: (elements: { root: { unmount: () => void; }; wrapper: { remove: () => void; }; }) => {
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
      } else if (message.action === 'getCurrentPageLanguageState') {
        // 返回当前页面的翻译状态
        const state = useTranslationStore.getState().pageLanguageState;
        sendResponse(state);
      } else if (message.action === 'getOriginalTabLanguage') {
        // 返回原始页面语言
        const originalLanguage = useTranslationStore.getState().originalTabLanguage;
        sendResponse(originalLanguage);
      }
      // 注意：startAreaScreenshot 消息现在由 ScreenshotManager 组件处理
      return true;
    });
  },
});
