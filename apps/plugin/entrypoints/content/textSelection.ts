/**
 * 文本划词功能
 */

import { useScreenshotStore } from "../stores/screenshot";

// 设置文本选择处理器
export function setupTextSelectionHandler() {
  // 当文本被选中时，显示浮动工具栏
  document.addEventListener('mouseup', (event) => {
    // 如果正在进行截图，不要显示文本选择工具栏
    const { isSelecting } = useScreenshotStore.getState();
    if (isSelecting) return;

    // 获取选中的文本
    const selectedText = window.getSelection()?.toString();

    // 如果有选中的文本，显示浮动工具栏
    if (selectedText && selectedText.trim().length > 0) {
      showFloatingToolbar(event.clientX, event.clientY, selectedText);
    } else {
      // 否则，隐藏浮动工具栏
      hideFloatingToolbar();
    }
  });

  // 点击页面时，如果不是浮动工具栏内部，则隐藏工具栏
  document.addEventListener('mousedown', (event) => {
    const toolbar = document.getElementById('ai-assistant-toolbar');
    if (toolbar && !toolbar.contains(event.target as Node)) {
      hideFloatingToolbar();
    }
  });
}

// 显示浮动工具栏
export function showFloatingToolbar(x: number, y: number, selectedText: string) {
  // 移除现有的工具栏（如果有）
  hideFloatingToolbar();

  // 创建工具栏容器
  const toolbar = document.createElement('div');
  toolbar.id = 'ai-assistant-toolbar';
  toolbar.style.position = 'fixed';
  toolbar.style.left = `${x}px`;
  toolbar.style.top = `${y + 20}px`; // 在鼠标下方显示
  toolbar.style.zIndex = '2147483647'; // 最高层级
  toolbar.style.backgroundColor = 'white';
  toolbar.style.border = '1px solid #d9d9d9';
  toolbar.style.borderRadius = '4px';
  toolbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  toolbar.style.padding = '6px 8px';
  toolbar.style.display = 'flex';
  toolbar.style.alignItems = 'center';
  toolbar.style.gap = '8px';

  // 添加"发送到AI助手"按钮
  const sendButton = document.createElement('button');
  sendButton.textContent = '发送到AI助手';
  sendButton.style.backgroundColor = '#6e59f2';
  sendButton.style.color = 'white';
  sendButton.style.border = 'none';
  sendButton.style.borderRadius = '4px';
  sendButton.style.padding = '4px 8px';
  sendButton.style.fontSize = '12px';
  sendButton.style.cursor = 'pointer';

  // 点击按钮时，发送选中的文本到AI助手
  sendButton.addEventListener('click', () => {
    // 先向后台发送打开侧边栏的请求
    chrome.runtime.sendMessage({
      action: 'openSidePanel'
    }, () => {
      // 然后发送选中的文本
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'addSelectedText',
          text: selectedText
        });
      }, 500); // 给侧边栏打开留出时间
    });

    // 隐藏工具栏
    hideFloatingToolbar();
  });

  toolbar.appendChild(sendButton);

  // 添加到页面
  document.body.appendChild(toolbar);

  // 确保工具栏完全在视口内
  const rect = toolbar.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    toolbar.style.left = `${window.innerWidth - rect.width - 10}px`;
  }
  if (rect.bottom > window.innerHeight) {
    toolbar.style.top = `${y - rect.height - 10}px`;
  }
}

// 隐藏浮动工具栏
export function hideFloatingToolbar() {
  const toolbar = document.getElementById('ai-assistant-toolbar');
  if (toolbar) {
    toolbar.remove();
  }
}
