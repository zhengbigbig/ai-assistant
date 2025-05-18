/**
 * Bing翻译服务实现
 */
import { createBaseTranslationService } from './baseService';
import { escapeHTML, unescapeHTML } from './utils';
import { TranslationServiceProvider } from './types';

// 默认的 Bing 翻译 API 地址
const DEFAULT_BASE_URL = 'https://www.bing.com/ttranslatev3?isVertical=1';

/**
 * Bing翻译服务SID管理
 */
let lastRequestSidTime: number | null = null;
let translateSid: string | null = null;
let translate_IID_IG: string | null = null;
let SIDNotFound = false;
let sidPromise: Promise<void> | null = null;

/**
 * 查找Bing翻译SID
 */
async function findSID(): Promise<void> {
  if (sidPromise) return await sidPromise;

  sidPromise = new Promise<void>((resolve) => {
    let updateBingSid = false;
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
        updateBingSid = true;
      }
    } else {
      updateBingSid = true;
    }

    if (updateBingSid) {
      lastRequestSidTime = Date.now();

      try {
        fetch('https://www.bing.com/translator')
          .then(response => response.text())
          .then(text => {
            const result = text.match(/params_RichTranslateHelper\s=\s\[[^\]]+/);
            const data_iid_r = text.match(/data-iid="[a-zA-Z0-9.]+/);
            const IG_r = text.match(/IG:"[a-zA-Z0-9.]+/);
            if (
              result &&
              result[0] &&
              result[0].length > 50 &&
              data_iid_r &&
              data_iid_r[0] &&
              IG_r &&
              IG_r[0]
            ) {
              const params_RichTranslateHelper = result[0]
                .substring('params_RichTranslateHelper = ['.length)
                .split(',');
              const data_iid = data_iid_r[0].substring('data-iid="'.length);
              const IG = IG_r[0].substring('IG:"'.length);
              if (
                params_RichTranslateHelper &&
                params_RichTranslateHelper[0] &&
                params_RichTranslateHelper[1] &&
                parseInt(params_RichTranslateHelper[0]) &&
                data_iid &&
                IG
              ) {
                translateSid = `&token=${params_RichTranslateHelper[1].substring(
                  1,
                  params_RichTranslateHelper[1].length - 1
                )}&key=${parseInt(params_RichTranslateHelper[0])}`;
                translate_IID_IG = `IG=${IG}&IID=${data_iid}`;
                SIDNotFound = false;
              } else {
                SIDNotFound = true;
              }
            } else {
              SIDNotFound = true;
            }
            resolve();
          })
          .catch(e => {
            console.warn('fetch bing sid failed', e);
            resolve();
          });
      } catch (e) {
        console.warn('fetch bing sid failed', e);
        resolve();
      }
    } else {
      resolve();
    }
  });

  sidPromise.finally(() => {
    sidPromise = null;
  });

  return await sidPromise;
}

/**
 * 创建Bing翻译服务
 */
export function createBingTranslationService(
  baseUrl?: string
): TranslationServiceProvider {
  const baseService = createBaseTranslationService({
    serviceName: 'bing',
    baseURL: baseUrl || DEFAULT_BASE_URL,
    xhrMethod: 'POST',
    transformRequest: function(sourceArray) {
      return sourceArray
        .map((value) => escapeHTML(value))
        .join('<wbr>');
    },
    parseResponse: function(response) {
      return [
        {
          text: response[0].translations[0].text,
          detectedLanguage: response[0].detectedLanguage.language,
        },
      ];
    },
    transformResponse: function(result) {
      if (!result) return [];
      return [unescapeHTML(result)];
    },
    getExtraParameters: function() {
      return `&${translate_IID_IG}`;
    },
    getRequestBody: function(sourceLanguage, targetLanguage, requests) {
      return `&fromLang=${sourceLanguage}${requests
        .map((info) => `&text=${encodeURIComponent(info.originalText)}`)
        .join('')}&to=${targetLanguage}${translateSid}`;
    }
  });

  // 重写translate方法，添加SID查找逻辑和语言代码替换
  return {
    serviceName: 'bing',
    async translate(
      sourceLanguage: string,
      targetLanguage: string,
      sourceArray2d: string[][],
      dontSaveInPersistentCache = false
    ): Promise<string[][]> {
      // 语言代码替换
      const replacements = [
        { search: 'auto', replace: 'auto-detect' },
        { search: 'zh-CN', replace: 'zh-Hans' },
        { search: 'zh-TW', replace: 'zh-Hant' },
        { search: 'tl', replace: 'fil' },
        { search: 'hmn', replace: 'mww' },
        { search: 'ckb', replace: 'kmr' },
        { search: 'mn', replace: 'mn-Cyrl' },
        { search: 'no', replace: 'nb' },
        { search: 'sr', replace: 'sr-Cyrl' },
      ];

      let modifiedSourceLanguage = sourceLanguage;
      let modifiedTargetLanguage = targetLanguage;

      replacements.forEach((r) => {
        if (targetLanguage === r.search) {
          modifiedTargetLanguage = r.replace;
        }
        if (sourceLanguage === r.search) {
          modifiedSourceLanguage = r.replace;
        }
      });

      await findSID();
      if (!translate_IID_IG) return [];

      return await baseService.translate(
        modifiedSourceLanguage,
        modifiedTargetLanguage,
        sourceArray2d,
        dontSaveInPersistentCache
      );
    }
  };
}
