/**
 * Yandex翻译服务实现
 */
import { createBaseTranslationService } from './baseService';
import { escapeHTML, unescapeHTML } from './utils';
import { TranslationServiceProvider } from './types';

/**
 * Yandex翻译服务SID管理
 */
let lastRequestSidTime: number | null = null;
let translateSid: string | null = null;
let SIDNotFound = false;
let findPromise: Promise<void> | null = null;

/**
 * 查找Yandex翻译SID
 */
async function findSID(): Promise<void> {
  if (findPromise) return await findPromise;

  findPromise = new Promise<void>((resolve) => {
    let updateYandexSid = false;
    if (lastRequestSidTime) {
      const date = new Date();
      if (translateSid) {
        date.setHours(date.getHours() - 12);
      } else if (SIDNotFound) {
        date.setMinutes(date.getMinutes() - 30);
      } else {
        date.setMinutes(date.getMinutes() - 2);
      }
      if (date.getTime() > lastRequestSidTime) {
        updateYandexSid = true;
      }
    } else {
      updateYandexSid = true;
    }

    if (updateYandexSid) {
      lastRequestSidTime = Date.now();
      try {
        fetch(
          'https://translate.yandex.net/website-widget/v1/widget.js?widgetId=ytWidget&pageLang=es&widgetTheme=light&autoMode=false'
        )
          .then(response => response.text())
          .then(text => {
            const result = text.match(/sid:\s'[0-9a-f.]+/);
            if (result && result[0] && result[0].length > 7) {
              translateSid = result[0].substring(6);
              SIDNotFound = false;
            } else {
              SIDNotFound = true;
            }
            resolve();
          })
          .catch(e => {
            console.warn('fetch yandex sid failed', e);
            resolve();
          });
      } catch (e) {
        console.warn('fetch yandex sid failed', e);
        resolve();
      }
    } else {
      resolve();
    }
  });

  findPromise.finally(() => {
    findPromise = null;
  });

  return await findPromise;
}

/**
 * 创建Yandex翻译服务
 */
export function createYandexTranslationService(): TranslationServiceProvider {
  const baseService = createBaseTranslationService({
    serviceName: 'yandex',
    baseURL: 'https://translate.yandex.net/api/v1/tr.json/translate?srv=tr-url-widget',
    xhrMethod: 'GET',
    transformRequest: function(sourceArray) {
      return sourceArray
        .map((value) => escapeHTML(value))
        .join('<wbr>');
    },
    parseResponse: function(response) {
      const lang = response.lang;
      const detectedLanguage = lang ? lang.split('-')[0] : null;
      return response.text.map(
        (text: string) => ({ text, detectedLanguage })
      );
    },
    transformResponse: function(result) {
      if (!result) return [];
      return result.split('<wbr>').map((value) => unescapeHTML(value));
    },
    getExtraParameters: function(sourceLanguage, targetLanguage, requests) {
      return `&id=${translateSid}-0-0&format=html&lang=${
        sourceLanguage === 'auto' ? '' : sourceLanguage + '-'
      }${targetLanguage}${requests
        .map((info) => `&text=${encodeURIComponent(info.originalText)}`)
        .join('')}`;
    }
  });

  // 重写translate方法，添加SID查找逻辑
  return {
    serviceName: 'yandex',
    async translate(
      sourceLanguage: string,
      targetLanguage: string,
      sourceArray2d: string[][],
      dontSaveInPersistentCache = false
    ): Promise<string[][]> {
      await findSID();
      if (!translateSid) return [];

      // 处理中文特殊情况
      if (sourceLanguage.startsWith('zh')) sourceLanguage = 'zh';
      if (targetLanguage.startsWith('zh')) targetLanguage = 'zh';

      return await baseService.translate(
        sourceLanguage,
        targetLanguage,
        sourceArray2d,
        dontSaveInPersistentCache
      );
    }
  };
}
