/**
 * AI 助手浏览器扩展背景脚本
 * 处理插件安装、事件监听和侧边栏交互
 */
export default defineBackground(() => {
  console.log('AI 助手后台服务已启动');

  // 初始化上下文菜单
  function setupContextMenus() {
    // 清除所有现有的上下文菜单，以避免重复
    chrome.contextMenus.removeAll(() => {
      // 创建"发送选定文本给 AI 助手"菜单项
      chrome.contextMenus.create({
        id: 'sendToAI',
        title: '发送选定文本给 AI 助手',
        contexts: ['selection'], // 仅在选中文本时显示
      });

      // 创建"截取页面截图"菜单项
      chrome.contextMenus.create({
        id: 'captureScreenshot',
        title: '截取页面截图',
        contexts: ['page'], // 在页面上的任何地方显示
      });
    });

    // 处理上下文菜单点击
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (!tab?.id) return;

      if (info.menuItemId === 'sendToAI') {
        // 将选中的文本发送到侧边栏
        handleSelectedText(info.selectionText || '', tab.id);
      } else if (info.menuItemId === 'captureScreenshot') {
        // 截取页面截图
        captureVisibleTab(tab.id);
      }
    });
  }

  // 处理选中的文本
  function handleSelectedText(text: string, tabId: number) {
    // 打开侧边栏
    chrome.sidePanel.open({ tabId }).catch(err => {
      console.error('Failed to open side panel:', err);
    });

    // 发送选中的文本到侧边栏
    chrome.runtime.sendMessage({ action: 'addSelectedText', text });
  }

  // 截取可见页面的截图
  function captureVisibleTab(tabId: number) {
    chrome.tabs.captureVisibleTab(
      { format: 'png', quality: 100 },
      (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Screenshot error:', chrome.runtime.lastError);
          return;
        }

        // 打开侧边栏
        chrome.sidePanel.open({ tabId }).catch(err => {
          console.error('Failed to open side panel:', err);
        });

        // 使用 OCR API 获取截图中的文本（这里仅示例，实际需要集成 OCR 服务）
        const exampleText = '这是一张截图，包含了页面的可见内容。实际应用中应整合 OCR 服务提取文本。';

        // 发送截图和提取的文本到侧边栏
        chrome.runtime.sendMessage({
          action: 'addScreenshot',
          imageUrl: dataUrl,
          text: exampleText
        });
      }
    );
  }

  // 处理命令快捷键
  chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;

      if (command === 'toggle-sidepanel') {
        // 打开/关闭侧边栏
        chrome.sidePanel.open({ tabId: tabs[0].id }).catch(err => {
          console.error('Failed to open side panel:', err);
        });
      } else if (command === 'capture-screenshot') {
        // 截取页面截图
        captureVisibleTab(tabs[0].id);
      }
    });
  });

  // 监听扩展图标点击事件
  chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;

    // 切换侧边栏显示状态
    chrome.sidePanel.open({ tabId: tab.id }).catch(err => {
      console.error('Failed to open side panel:', err);
    });
  });

  // 监听来自内容脚本或弹出窗口的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'captureScreenshot') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          captureVisibleTab(tabs[0].id);
        }
      });
      sendResponse({ success: true });
    } else if (message.action === 'openSidePanel') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id }).catch(err => {
            console.error('Failed to open side panel:', err);
          });
        }
      });
      sendResponse({ success: true });
    }
    return true;
  });

  // 设置侧边栏默认打开位置
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(err => {
    console.error('Failed to set side panel behavior:', err);
  });

  // 插件安装或更新时初始化
  chrome.runtime.onInstalled.addListener(() => {
    // 设置上下文菜单
    setupContextMenus();

    // 初始化存储，设置默认值
    chrome.storage.sync.get(
      [
        'apiKey',
        'apiEndpoint',
        'enableContextMenu',
        'enableScreenshot',
        'defaultModel'
      ],
      (result) => {
        const defaults: Record<string, any> = {};

        if (result.enableContextMenu === undefined) {
          defaults.enableContextMenu = true;
        }

        if (result.enableScreenshot === undefined) {
          defaults.enableScreenshot = true;
        }

        if (!result.apiEndpoint) {
          defaults.apiEndpoint = 'https://api.openai.com/v1';
        }

        if (!result.defaultModel) {
          defaults.defaultModel = 'gpt-4';
        }

        if (Object.keys(defaults).length > 0) {
          chrome.storage.sync.set(defaults);
        }
      }
    );
  });
});
