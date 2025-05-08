/**
 * 基础翻译服务实现
 */
import { fixString, createResolvablePromise } from './utils';
import {
  TranslationInfo,
  ServiceSingleResultResponse,
  TranslationServiceProvider
} from './types';
import { translationCache } from './cache';

/**
 * 创建基础翻译服务
 */
export function createBaseTranslationService({
  serviceName,
  baseURL,
  xhrMethod,
  transformRequest,
  parseResponse,
  transformResponse,
  getExtraParameters = null,
  getRequestBody = null
}: {
  serviceName: string;
  baseURL: string;
  xhrMethod: 'GET' | 'POST';
  transformRequest: (sourceArray: string[]) => string;
  parseResponse: (response: any) => ServiceSingleResultResponse[];
  transformResponse: (result: string) => string[];
  getExtraParameters?: ((sourceLanguage: string, targetLanguage: string, requests: TranslationInfo[]) => string) | null;
  getRequestBody?: ((sourceLanguage: string, targetLanguage: string, requests: TranslationInfo[]) => string) | null;
}): TranslationServiceProvider {
  // 存储进行中的翻译请求
  const translationsInProgress = new Map<string, TranslationInfo>();

  /**
   * 准备翻译请求
   */
  async function getRequests(
    sourceLanguage: string,
    targetLanguage: string,
    sourceArray2d: string[][]
  ): Promise<[TranslationInfo[][], TranslationInfo[]]> {
    const requests: TranslationInfo[][] = [];
    const currentTranslationsInProgress: TranslationInfo[] = [];

    let currentRequest: TranslationInfo[] = [];
    let currentSize = 0;

    for (const sourceArray of sourceArray2d) {
      const requestString = fixString(transformRequest(sourceArray));
      const requestHash = [sourceLanguage, targetLanguage, requestString].join(', ');

      const progressInfo = translationsInProgress.get(requestHash);
      if (progressInfo) {
        currentTranslationsInProgress.push(progressInfo);
      } else {
        let status: 'translating' | 'complete' | 'error' = 'translating';
        const [waitTranslate, resolvePromise] = createResolvablePromise<void>();

        const progressInfo: TranslationInfo = {
          originalText: requestString,
          translatedText: null,
          detectedLanguage: null,
          get status() {
            return status;
          },
          set status(_status) {
            status = _status;
            resolvePromise();
          },
          waitTranslate
        };

        currentTranslationsInProgress.push(progressInfo);
        translationsInProgress.set(requestHash, progressInfo);

        const cacheEntry = await translationCache.get(
          serviceName,
          sourceLanguage,
          targetLanguage,
          requestString
        );

        if (cacheEntry) {
          progressInfo.translatedText = cacheEntry.translatedText;
          progressInfo.detectedLanguage = cacheEntry.detectedLanguage;
          progressInfo.status = 'complete';
        } else {
          currentRequest.push(progressInfo);
          currentSize += progressInfo.originalText.length;
          if (currentSize > 800) {
            requests.push(currentRequest);
            currentSize = 0;
            currentRequest = [];
          }
        }
      }
    }

    if (currentRequest.length > 0) {
      requests.push(currentRequest);
    }

    return [requests, currentTranslationsInProgress];
  }

  /**
   * 发送翻译请求
   */
  async function makeRequest(
    sourceLanguage: string,
    targetLanguage: string,
    requests: TranslationInfo[]
  ): Promise<any> {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const params: RequestInit = {
      method: xhrMethod,
      headers,
    };

    if (getRequestBody && xhrMethod === 'POST') {
      params.body = getRequestBody(sourceLanguage, targetLanguage, requests);
    }

    const url = baseURL +
      (getExtraParameters
        ? getExtraParameters(sourceLanguage, targetLanguage, requests)
        : '');

    const response = await fetch(url, params);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(response.statusText);
    }
  }

  /**
   * 执行翻译
   */
  async function translate(
    sourceLanguage: string,
    targetLanguage: string,
    sourceArray2d: string[][],
    dontSaveInPersistentCache = false
  ): Promise<string[][]> {
    const [requests, currentTranslationsInProgress] = await getRequests(
      sourceLanguage,
      targetLanguage,
      sourceArray2d
    );

    const promises: Promise<void>[] = [];

    for (const request of requests) {
      promises.push(
        makeRequest(sourceLanguage, targetLanguage, request)
          .then((response) => {
            const results = parseResponse(response);
            for (const idx in request) {
              const result = results[idx];
              // 验证翻译结果是否有效
              transformResponse(result.text);

              const transInfo = request[idx];
              transInfo.detectedLanguage = result.detectedLanguage || 'und';
              transInfo.translatedText = result.text;
              transInfo.status = 'complete';

              if (dontSaveInPersistentCache === false) {
                translationCache.set(
                  serviceName,
                  sourceLanguage,
                  targetLanguage,
                  transInfo.originalText,
                  transInfo.translatedText,
                  transInfo.detectedLanguage
                );
              }
            }
          })
          .catch((e) => {
            console.error(e);
            for (const transInfo of request) {
              transInfo.status = 'error';
            }
          })
      );
    }

    await Promise.all(
      currentTranslationsInProgress.map((transInfo) => transInfo.waitTranslate)
    );

    return currentTranslationsInProgress.map((transInfo) =>
      transformResponse(transInfo.translatedText!)
    );
  }

  return {
    serviceName,
    translate
  };
}
