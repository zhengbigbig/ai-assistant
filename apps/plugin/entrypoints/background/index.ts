/**
 * AI 助手浏览器扩展背景脚本
 * 处理插件安装、事件监听和侧边栏交互
 */
import { defineBackground } from '#imports';
import { TARGET_LANGUAGE_OPTIONS } from '../../constants/config';
import { CONFIG_STORAGE_KEY } from '../../constants/key';
import { useConfigStore } from '../stores/configStore';
import { translationService } from './translation';
import { translationCache } from './translation/cache';
import { resizeWindow } from './windowResizer';

export default defineBackground(() => {
  console.log('AI 助手后台服务已启动');

  // 存储各个标签页的翻译状态
  const tabLanguageStates: Record<number, string> = {};
  // 获取当前活动标签页的翻译状态，默认为'original'
  const getCurrentPageLanguageState = (tabId?: number): string => {
    if (!tabId) return 'original';
    return tabLanguageStates[tabId] || 'original';
  };

  // 初始化上下文菜单
  function setupContextMenus(tabId?: number) {
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

      // 获取当前标签页的翻译状态
      const currentPageLanguageState = getCurrentPageLanguageState(tabId);

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

      // 创建"翻译为目标语言"或"恢复原文"菜单项
      chrome.contextMenus.create({
        id: 'translatePage',
        title: currentPageLanguageState === 'translated'
          ? `恢复原文 [${shortcutTranslatePage}]`
          : `翻译为${targetLanguage} [${shortcutTranslatePage}]`,
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
      } else if (info.menuItemId === 'translatePage') {
        // 翻译页面
        handleTranslatePage(tab.id);
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
  function handleTranslatePage(tabId: number) {
    if (!tabId) return;
    console.log('handleTranslatePage', tabId);
    // 发送消息到内容脚本，触发页面翻译
    chrome.tabs.sendMessage(tabId, { action: 'translatePage' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          'Error sending translatePage message:',
          chrome.runtime.lastError
        );
        return;
      }

      console.log('Page translation started, response:', response);
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

  // 监听标签页切换，更新上下文菜单
  chrome.tabs.onActivated.addListener((activeInfo) => {
    // 当标签页切换时，更新菜单以反映当前标签页的翻译状态
    updateTranslatePageMenuItem(activeInfo.tabId);
  });

  // 监听页面加载完成，获取初始翻译状态
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      // 页面加载完成，查询当前翻译状态
      chrome.tabs.sendMessage(tabId, { action: 'getCurrentPageLanguageState' }, (response) => {
        if (chrome.runtime.lastError) {
          // 可能内容脚本尚未加载，这是正常的
          console.log('内容脚本尚未准备好:', chrome.runtime.lastError);
          return;
        }
        if (response) {
          // 更新当前标签页的翻译状态
          tabLanguageStates[tabId] = response;

          // 如果当前是活动标签页，更新菜单
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0 && tabs[0].id === tabId) {
              updateTranslatePageMenuItem(tabId);
            }
          });
        }
      });
    }
  });

  // 监听来自内容脚本或弹出窗口的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background script received message:', message);
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
    } else if (message.action === 'pageLanguageStateChanged') {
      // 更新当前标签页的翻译状态
      const tabId = sender.tab?.id;
      if (tabId) {
        tabLanguageStates[tabId] = message.state;
        console.log(`Tab ${tabId} language state changed to:`, message.state);
        // 更新翻译菜单
        updateTranslatePageMenuItem(tabId);
      }
      sendResponse({ success: true });
    } else if (message.action === 'configChanged') {
      // 配置变更，更新翻译菜单
      if (message.change === 'targetLanguage' || message.change === 'shortcutTranslatePage') {
        // 获取当前活动标签页
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs.length > 0) {
            updateTranslatePageMenuItem(tabs[0].id);
          } else {
            updateTranslatePageMenuItem();
          }
        });
      }
      sendResponse({ success: true });
    } else if (message.action === 'getCurrentPageLanguageState') {
      // 获取当前标签页的翻译状态
      const tabId = sender.tab?.id;
      if (tabId) {
        sendResponse(tabLanguageStates[tabId] || 'original');
      } else {
        sendResponse('original');
      }
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
              console.error('Screenshot error during scroll capture:', chrome.runtime.lastError);
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
          chrome.sidePanel.open({ tabId: tabs[0].id }).catch(err => {
            console.error('Failed to open side panel:', err);
          });
        }
      });
      sendResponse({ success: true });
    } else if (message.action === 'addScreenshot') {
      console.log('Forwarding screenshot data to side panel');
      // 转发截图数据到侧边栏
      chrome.runtime.sendMessage({
        action: 'addScreenshot',
        imageUrl: message.imageUrl,
        text: message.text || '区域截图',
        addToInput: message.addToInput || false // 传递addToInput参数
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
    } else if (message.action === 'getActiveTab') {
      // 获取当前活动标签页
      handleGetActiveTab(sendResponse);
      return true; // 异步响应
    } else if (message.action === 'openOptionsPage') {
      // 打开选项页面
      handleOpenOptionsPage(message.hash);
      sendResponse({ success: true });
    } else if (message.action === 'captureVisibleTab') {
      // 截取当前可见页面的截图
      handleCaptureVisibleTab(sender.tab?.id, sendResponse);
      return true; // 异步响应
    } else if (message.action === 'saveScreenshotArea') {
      // 保存用户选择的屏幕区域
      handleSaveScreenshotArea(sender.tab?.id, message.area, sendResponse);
      return true; // 异步响应
    } else if (message.action === 'sendCommands') {
      // 发送命令到目标标签页
      handleSendCommands(message.tabId, message.commands, sendResponse);
      return true; // 异步响应
    } else if (message.action === 'openTab') {
      // 打开新标签页
      handleOpenTab(message.url, sendResponse);
      return true; // 异步响应
    } else if (message.action === 'resizeWindow') {
      // 调整窗口大小
      resizeWindow(message.width, message.height);
      return true; // 异步响应
    } else if (message.action === 'getCtx') {
      // 获取上下文信息
      const tabUrl = sender.tab?.url;
      if (!tabUrl) {
        sendResponse({
          error: 'No tab URL found',
        });
        return;
      }
      const tabUrlObj = new URL(tabUrl);
      sendResponse({
        tabUrl,
        tabHostName: tabUrlObj.hostname,
        tabUrlWithoutSearch: tabUrlObj.origin + tabUrlObj.pathname,
      });
    } else if (message.action === 'detectLanguage') {
      chrome.i18n.detectLanguage(message.text, function (result) {
        if (result.languages.length > 0) {
          sendResponse(result.languages[0].language);
        } else {
          sendResponse(undefined);
        }
      });
      return true;
    } else if (message.action === 'detectTabLanguage') {
      if (!message.tabId) {
        sendResponse('und');
        return true;
      }
      try {
        chrome.tabs.detectLanguage(message.tabId, function (result) {
          sendResponse(result);
        });
        return true;
      } catch (error) {
        console.error('Error during detectTabLanguage:', error);
        sendResponse('und');
        return true;
      }
    } else if (message.action === 'getMainFramePageLanguageState') {
      chrome.tabs.sendMessage(
        message.tabId,
        { action: 'getCurrentPageLanguageState' },
        {
          frameId: 0,
        },
        (pageLanguageState) => {
          sendResponse(pageLanguageState);
        }
      );
      return true;
    } else if (message.action === 'getMainFrameTabLanguage') {
      chrome.tabs.sendMessage(
        message.tabId,
        { action: 'getOriginalTabLanguage' },
        {
          frameId: 0,
        },
        (tabLanguage) => {
          sendResponse(tabLanguage);
        }
      );
      return true;
    } else if (message.action === 'translateHTML') {
      const dontSaveInPersistentCache = sender.tab
        ? sender.tab.incognito
        : false;
      const serviceName = message.serviceName;
      const targetLanguage = message.targetLanguage;
      const sourceArray2d = message.sourceArray2d;
      translationService
        .translateHTML(
          serviceName,
          'auto',
          targetLanguage,
          sourceArray2d,
          dontSaveInPersistentCache
        )
        .then((result) => {
          sendResponse(result);
        })
        .catch((error) => {
          console.error('翻译失败:', error);
          sendResponse({ error: '翻译失败: ' + (error as Error).message });
        });
      return true;
    } else if (message.action === 'translateText') {
      translationService
        .translateText(
          message.serviceName,
          'auto',
          message.targetLanguage,
          message.sourceArray2d,
          message.dontSaveInPersistentCache
        )
        .then((result) => {
          sendResponse(result);
        })
        .catch((error) => {
          console.error('翻译失败:', error);
          sendResponse({ error: '翻译失败: ' + (error as Error).message });
        });
      return true;
    } else if (message.action === 'translateSingleText') {
      translationService
        .translateText(
          message.serviceName,
          'auto',
          message.targetLanguage,
          message.sourceArray2d,
          message.dontSaveInPersistentCache
        )
        .then((result) => {
          sendResponse(result);
        })
        .catch((error) => {
          console.error('翻译失败:', error);
          sendResponse({ error: '翻译失败: ' + (error as Error).message });
        });
      return true;
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
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      // 设置上下文菜单
      setupContextMenus();
    } else if (
      details.reason === 'update' &&
      details.previousVersion !== chrome.runtime.getManifest().version
    ) {
      // 清除翻译缓存
      translationCache.deleteTranslationCache();
    }
  });

  // 监听 chrome.storage 的变化
  chrome.storage.onChanged.addListener((changes) => {
    const newConfig = changes[CONFIG_STORAGE_KEY]?.newValue?.state;
    const lastConfig = changes[CONFIG_STORAGE_KEY]?.oldValue?.state;

    const newTargetLanguage = newConfig?.translation?.targetLanguage;
    const newShortcutTranslatePage =
      newConfig?.keyboardShortcuts?.shortcutTranslatePage;
    const lastTargetLanguage = lastConfig?.translation?.targetLanguage;
    const lastShortcutTranslatePage =
      lastConfig?.keyboardShortcuts?.shortcutTranslatePage;

    if (
      newTargetLanguage !== lastTargetLanguage ||
      newShortcutTranslatePage !== lastShortcutTranslatePage
    ) {
      updateTranslatePageMenuItem();
    }
  });

  // 更新翻译菜单项文本
  function updateTranslatePageMenuItem(tabId?: number) {
    const configStore = useConfigStore.getState();

    // 获取配置信息
    const targetLanguage = TARGET_LANGUAGE_OPTIONS.find(
      (option) => option.value === configStore.translation.targetLanguage
    )?.label;
    const shortcutTranslatePage = configStore.keyboardShortcuts.shortcutTranslatePage;

    // 获取当前标签页的翻译状态
    const currentPageLanguageState = getCurrentPageLanguageState(tabId);

    // 根据当前翻译状态显示不同的菜单标题
    const menuTitle = currentPageLanguageState === 'translated'
      ? `恢复原文 [${shortcutTranslatePage}]`
      : `翻译为${targetLanguage} [${shortcutTranslatePage}]`;

    // 更新右键菜单
    chrome.contextMenus.update('translatePage', {
      title: menuTitle,
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('更新菜单失败:', chrome.runtime.lastError);
      }
    });
  }

  // 处理获取活动标签页
  function handleGetActiveTab(sendResponse: (response?: any) => void) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        sendResponse({ tab: tabs[0] });
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
  }

  // 处理打开选项页面
  function handleOpenOptionsPage(hash?: string) {
    // 打开选项页面，可以带上查询参数以直接导航到特定页面
    if (hash) {
      // 构建完整的选项页面URL
      const optionsUrl = chrome.runtime.getURL('options.html') + hash;

      // 使用 chrome.tabs.create 直接打开带有查询参数的URL
      chrome.tabs.create({ url: optionsUrl }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('打开选项页面失败:', chrome.runtime.lastError);
        }
      });
    } else {
      // 如果没有传递查询参数，使用默认的 openOptionsPage 方法
      chrome.runtime.openOptionsPage();
    }
  }

  // 处理截取当前可见页面
  function handleCaptureVisibleTab(
    tabId: number | undefined,
    sendResponse: (response?: any) => void
  ) {
    if (!tabId) {
      sendResponse({ error: 'Invalid tab ID' });
      return;
    }

    chrome.tabs.captureVisibleTab(
      { format: 'png', quality: 100 },
      (dataUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            error: 'Failed to capture screenshot: ' + chrome.runtime.lastError,
          });
        } else {
          sendResponse({ imageUrl: dataUrl });
        }
      }
    );
  }

  // 处理保存屏幕区域截图
  function handleSaveScreenshotArea(
    tabId: number | undefined,
    area: any,
    sendResponse: (response?: any) => void
  ) {
    if (!tabId) {
      sendResponse({ error: 'Invalid tab ID' });
      return;
    }

    // 这里应该有处理截图区域的逻辑
    // 由于浏览器API限制，我们需要使用canvas在内容脚本中截图，然后发送回来
    sendResponse({ success: true, area });
  }

  // 处理发送命令到目标标签页
  function handleSendCommands(
    tabId: number,
    commands: string[],
    sendResponse: (response?: any) => void
  ) {
    if (!tabId) {
      sendResponse({ error: 'Invalid tab ID' });
      return;
    }

    chrome.tabs.sendMessage(
      tabId,
      { action: 'executeCommands', commands },
      (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            error:
              'Failed to send commands: ' + chrome.runtime.lastError.message,
          });
        } else {
          sendResponse({ success: true, response });
        }
      }
    );
  }

  // 处理打开新标签页
  function handleOpenTab(url: string, sendResponse: (response?: any) => void) {
    chrome.tabs.create({ url }, (tab) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          error: 'Failed to open tab: ' + chrome.runtime.lastError.message,
        });
      } else {
        sendResponse({ success: true, tab });
      }
    });
  }
});
