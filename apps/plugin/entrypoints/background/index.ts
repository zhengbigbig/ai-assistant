/**
 * AI 助手浏览器扩展背景脚本
 * 处理插件安装、事件监听和侧边栏交互
 */
import { defineBackground } from 'wxt/sandbox';
import { TARGET_LANGUAGE_OPTIONS } from '../constants/config';
import { useConfigStore } from '../stores/configStore';
import { resizeWindow } from './windowResizer';
import { CONFIG_STORAGE_KEY } from '../constants/key';

export default defineBackground(() => {
  console.log('AI 助手后台服务已启动');

  // 初始化上下文菜单
  function setupContextMenus() {
    // 清除所有现有的上下文菜单，以避免重复
    chrome.contextMenus.removeAll(() => {
      // 获取配置信息
      const configStore = useConfigStore.getState();
      const translation = configStore.translation;
      const shortcutTranslatePage =
        configStore.keyboardShortcuts.shortcutTranslatePage;
      // 获取目标语言中文名
      const targetLanguage = TARGET_LANGUAGE_OPTIONS.find(
        (option) => option.value === translation.targetLanguage
      )?.label;

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

      // 添加"截图选定区域"菜单项
      chrome.contextMenus.create({
        id: 'captureArea',
        title: '截取选定区域',
        contexts: ['page'], // 在任何页面上显示
      });

      // 创建"翻译为目标语言"菜单项
      chrome.contextMenus.create({
        id: 'translateText',
        title: `翻译为${targetLanguage} [${shortcutTranslatePage}]`,
        contexts: ['page'],
      });

      // 添加"打开设置"菜单项
      chrome.contextMenus.create({
        id: 'openOptions',
        title: '打开设置',
        contexts: ['action'], // 在扩展图标的右键菜单中显示
      });
    });

    // 处理上下文菜单点击
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (!tab?.id) return;

      if (info.menuItemId === 'sendToAI') {
        // 将选中的文本发送到侧边栏
        handleSelectedText(info.selectionText || '', tab.id);
      } else if (info.menuItemId === 'translateText') {
        // 处理翻译文本
        handleTranslateText(info.selectionText || '', tab.id);
      } else if (info.menuItemId === 'captureScreenshot') {
        // 截取页面截图
        captureVisibleTab(tab.id);
      } else if (info.menuItemId === 'captureArea') {
        // 启动区域截图模式
        startAreaScreenshot(tab.id);
      } else if (info.menuItemId === 'openOptions') {
        // 打开选项页面
        chrome.runtime.openOptionsPage();
      }
    });
  }

  // 处理选中的文本
  function handleSelectedText(text: string, tabId: number) {
    // 打开侧边栏
    chrome.sidePanel.open({ tabId }).catch((err) => {
      console.error('Failed to open side panel:', err);
    });

    // 发送选中的文本到侧边栏
    chrome.runtime.sendMessage({ action: 'addSelectedText', text });
  }

  // 处理翻译文本
  function handleTranslateText(text: string, tabId: number) {
    if (!text) return;

    // 获取配置信息
    const configStore = useConfigStore.getState();
    const translation = configStore.translation;
    const targetLanguage = translation.targetLanguage || 'zh-CN';

    // 打开侧边栏
    chrome.sidePanel.open({ tabId }).catch((err) => {
      console.error('Failed to open side panel:', err);
    });

    // 翻译前缀 + 文本
    const messageWithPrefix = `翻译为${targetLanguage}: ${text}`;

    // 发送消息到侧边栏
    chrome.runtime.sendMessage({
      action: 'syncTextToInput',
      text: messageWithPrefix,
    });
  }

  // 截取可见页面的截图
  function captureVisibleTab(tabId: number) {
    console.log('Attempting to capture visible tab:', tabId);

    try {
      chrome.tabs.captureVisibleTab(
        { format: 'png', quality: 100 },
        (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error('Screenshot error:', chrome.runtime.lastError);
            return;
          }

          console.log('Screenshot captured successfully');

          // 打开侧边栏
          chrome.sidePanel.open({ tabId }).catch((err) => {
            console.error('Failed to open side panel:', err);
          });

          // 使用 OCR API 获取截图中的文本（这里仅示例，实际需要集成 OCR 服务）
          const exampleText =
            '这是一张截图，包含了页面的可见内容。实际应用中应整合 OCR 服务提取文本。';

          // 发送截图和提取的文本到侧边栏
          chrome.runtime.sendMessage(
            {
              action: 'addScreenshot',
              imageUrl: dataUrl,
              text: exampleText,
              addToInput: false, // 默认不添加到输入框
            },
            (response) => {
              console.log('addScreenshot response:', response);
            }
          );
        }
      );
    } catch (error) {
      console.error('Error during captureVisibleTab:', error);
    }
  }

  // 启动区域截图模式
  function startAreaScreenshot(tabId: number) {
    console.log('Attempting to start area screenshot for tab:', tabId);

    try {
      // 向内容脚本发送消息，启动区域截图模式
      chrome.tabs.sendMessage(
        tabId,
        { action: 'startAreaScreenshot' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Error sending message to content script:',
              chrome.runtime.lastError
            );

            // 尝试注入内容脚本如果它还没有加载
            chrome.scripting
              .executeScript({
                target: { tabId },
                files: ['entrypoints/content.js'],
              })
              .then(() => {
                console.log(
                  'Content script injected, retrying startAreaScreenshot'
                );
                // 重试发送消息
                setTimeout(() => {
                  chrome.tabs.sendMessage(tabId, {
                    action: 'startAreaScreenshot',
                  });
                }, 500);
              })
              .catch((err) => {
                console.error('Failed to inject content script:', err);
              });

            return;
          }

          console.log(
            'Area screenshot started, content script response:',
            response
          );
        }
      );
    } catch (error) {
      console.error('Error during startAreaScreenshot:', error);
    }
  }

  // 监听命令快捷键
  chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;

      if (command === 'toggle-sidepanel') {
        // 打开/关闭侧边栏
        chrome.sidePanel.open({ tabId: tabs[0].id }).catch((err) => {
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
    chrome.sidePanel.open({ tabId: tab.id }).catch((err) => {
      console.error('Failed to open side panel:', err);
    });
  });

  // 监听来自内容脚本或弹出窗口的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    if (message.action === 'captureScreenshot') {
      console.log('Handling captureScreenshot action');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          console.log('Capturing screenshot for tab:', tabs[0].id);
          captureVisibleTab(tabs[0].id);
        } else {
          console.error('No active tab found');
        }
      });
      sendResponse({ success: true });
    } else if (message.action === 'captureVisibleTabForScroll') {
      // 处理滚动截图过程中对可见区域的捕获请求
      console.log('Handling captureVisibleTabForScroll action');

      if (!sender.tab?.id) {
        console.error('Cannot capture tab: no tab ID');
        sendResponse({ error: '无法获取标签页ID' });
        return true;
      }

      try {
        chrome.tabs.captureVisibleTab(
          { format: 'png', quality: 100 },
          (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.error(
                'Screenshot error during scroll capture:',
                chrome.runtime.lastError
              );
              sendResponse({ error: chrome.runtime.lastError.message });
              return;
            }

            console.log('Scroll screenshot captured successfully');
            sendResponse({ dataUrl });
          }
        );
      } catch (error) {
        console.error('Error during scroll screenshot capture:', error);
        sendResponse({ error: String(error) });
      }

      return true; // 保持消息通道打开以进行异步响应
    } else if (message.action === 'openSidePanel') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id }).catch((err) => {
            console.error('Failed to open side panel:', err);
          });
        }
      });
      sendResponse({ success: true });
    } else if (message.action === 'syncSelectedText') {
      // 只同步文本到侧边栏输入框，不发送
      console.log('同步划词数据到侧边栏输入框:', message.text);
      // 先打开侧边栏
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel
            .open({ tabId: tabs[0].id })
            .then(() => {
              // 同步文本到侧边栏输入框
              chrome.runtime.sendMessage({
                action: 'syncTextToInput',
                text: message.text,
              });
              sendResponse({ success: true });
            })
            .catch((err) => {
              console.error('同步划词数据失败:', err);
              sendResponse({ error: err.message });
            });
        } else {
          sendResponse({ error: '无法获取当前标签页' });
        }
      });
      return true; // 保持消息通道打开以进行异步响应
    } else if (message.action === 'sendSelectedText') {
      // 发送文本到侧边栏并立即发送
      console.log('发送划词数据到侧边栏并立即发送:', message.text);
      // 先打开侧边栏
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel
            .open({ tabId: tabs[0].id })
            .then(() => {
              // 发送文本到侧边栏并立即发送
              chrome.runtime.sendMessage({
                action: 'addSelectedText',
                text: message.text,
                sendImmediately: true,
              });
              sendResponse({ success: true });
            })
            .catch((err) => {
              console.error('发送划词数据失败:', err);
              sendResponse({ error: err.message });
            });
        } else {
          sendResponse({ error: '无法获取当前标签页' });
        }
      });
      return true; // 保持消息通道打开以进行异步响应
    } else if (message.action === 'getTabId') {
      // 返回当前标签页ID
      if (sender.tab?.id) {
        sendResponse({ tabId: sender.tab.id });
      } else {
        sendResponse({ error: '无法获取标签页ID' });
      }
    } else if (message.action === 'addScreenshot') {
      console.log('Forwarding screenshot data to side panel');
      // 转发截图数据到侧边栏
      chrome.runtime.sendMessage({
        action: 'addScreenshot',
        imageUrl: message.imageUrl,
        text: message.text || '区域截图',
        addToInput: message.addToInput || false, // 传递addToInput参数
      });
      sendResponse({ success: true });
    } else if (message.action === 'startAreaScreenshot') {
      console.log('Handling startAreaScreenshot action');
      // 在当前标签页启动区域截图模式
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          console.log('Starting area screenshot for tab:', tabs[0].id);
          startAreaScreenshot(tabs[0].id);
        } else {
          console.error('No active tab found');
        }
      });
      sendResponse({ success: true });
    } else if (message.action === 'resizeWindow') {
      console.log('Handling resizeWindow action');

      // 调整窗口尺寸
      if (message.width && message.height) {
        resizeWindow(message.width, message.height);
        sendResponse({ success: true });
      } else {
        console.error('Missing width or height in resizeWindow message');
        sendResponse({ success: false, error: '缺少宽度或高度参数' });
      }
    } else if (message.action === 'openOptionsPage') {
      // 打开选项页面
      chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
    }
    return true;
  });

  // 设置侧边栏默认打开位置
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => {
      console.error('Failed to set side panel behavior:', err);
    });

  // 插件安装或更新时初始化
  chrome.runtime.onInstalled.addListener(() => {
    // 设置上下文菜单
    setupContextMenus();
  });

  // 监听 chrome.storage 的变化
  chrome.storage.onChanged.addListener((changes) => {
    const newConfig = changes[CONFIG_STORAGE_KEY]?.newValue?.state;
    const lastConfig = changes[CONFIG_STORAGE_KEY]?.oldValue?.state;

    const newTargetLanguage = newConfig?.translation?.targetLanguage;
    const newShortcutTranslatePage = newConfig?.keyboardShortcuts?.shortcutTranslatePage;
    const lastTargetLanguage = lastConfig?.translation?.targetLanguage;
    const lastShortcutTranslatePage = lastConfig?.keyboardShortcuts?.shortcutTranslatePage;

    if(newTargetLanguage !== lastTargetLanguage || newShortcutTranslatePage !== lastShortcutTranslatePage){
      // 更新右键菜单
      const targetLanguageLabel = TARGET_LANGUAGE_OPTIONS.find(
        (option) => option.value === newTargetLanguage
      )?.label;

      chrome.contextMenus.update('translateText', {
        title: `翻译为${targetLanguageLabel} [${newShortcutTranslatePage}]`,
      });
    }
  });
});
