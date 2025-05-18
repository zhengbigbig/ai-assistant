/**
 * DeepL翻译服务实现
 */
import { TranslationServiceProvider } from './types';

// 默认的 DeepL 网址
const DEFAULT_BASE_URL = 'https://www.deepl.com';

/**
 * DeepL翻译标签
 */
let DeepLTab: chrome.tabs.Tab | null = null;

/**
 * 创建DeepL翻译服务
 */
export function createDeepLTranslationService(
  baseUrl?: string
): TranslationServiceProvider {
  const actualBaseUrl = baseUrl || DEFAULT_BASE_URL;

  return {
    serviceName: 'deepl',
    async translate(
      sourceLanguage: string,
      targetLanguage: string,
      sourceArray2d: string[][],
      dontSaveInPersistentCache = false
    ): Promise<string[][]> {
      // DeepL只翻译sourceArray2d[0][0]
      return await new Promise((resolve) => {
        const waitFirstTranslationResult = () => {
          const listener = (request: any, sender: any, sendResponse: any) => {
            if (request.action === 'DeepL_firstTranslationResult') {
              resolve([[request.result]]);
              chrome.runtime.onMessage.removeListener(listener);
            }
          };
          chrome.runtime.onMessage.addListener(listener);

          setTimeout(() => {
            chrome.runtime.onMessage.removeListener(listener);
            resolve([['']]);
          }, 8000);
        };

        if (DeepLTab) {
          chrome.tabs.get(DeepLTab.id!, (tab) => {
            // 检查是否有错误
            const lastError = chrome.runtime.lastError;
            if (lastError) {
              console.warn('Chrome runtime error:', lastError.message);
            }

            if (tab) {
              // 发送消息到DeepL标签页
              chrome.tabs.sendMessage(
                tab.id!,
                {
                  action: 'translateTextWithDeepL',
                  text: sourceArray2d[0][0],
                  targetLanguage,
                },
                {
                  frameId: 0,
                },
                (response) => resolve([[response]])
              );
            } else {
              // 如果标签页不存在，创建新标签页
              chrome.tabs.create(
                {
                  url: `${actualBaseUrl}/#!${targetLanguage}!#${encodeURIComponent(
                    sourceArray2d[0][0]
                  )}`,
                },
                (tab) => {
                  DeepLTab = tab;
                  waitFirstTranslationResult();
                }
              );
            }
          });
        } else {
          // 如果没有DeepL标签页，创建一个
          chrome.tabs.create(
            {
              url: `${actualBaseUrl}/#!${targetLanguage}!#${encodeURIComponent(
                sourceArray2d[0][0]
              )}`,
            },
            (tab) => {
              DeepLTab = tab;
              waitFirstTranslationResult();
            }
          );
        }
      });
    }
  };
}
