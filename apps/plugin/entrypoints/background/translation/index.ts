/**
 * 翻译服务主接口
 */
import { languages } from '../../../utils/languages';
import { TranslationServiceFactory, TranslationServiceType } from './serviceFactory';
import { OpenAIServiceParams, TranslationService } from './types';

/**
 * 创建翻译服务
 */
export const translationService: TranslationService = {
  /**
   * 翻译HTML内容
   */
  async translateHTML(
    serviceName: string,
    sourceLanguage: string,
    targetLanguage: string,
    sourceArray2d: string[][],
    dontSaveInPersistentCache = false
  ): Promise<string[][]> {
    console.log('translateHTML', serviceName, sourceLanguage, targetLanguage, sourceArray2d, dontSaveInPersistentCache)
    // 获取适合的翻译服务
    const actualServiceName = languages.getAlternativeService(targetLanguage, serviceName, true) as TranslationServiceType;
    const service = TranslationServiceFactory.getService(actualServiceName);
    return await service.translate(
      sourceLanguage,
      targetLanguage,
      sourceArray2d,
      dontSaveInPersistentCache
    );
  },

  /**
   * 翻译文本数组
   */
  async translateText(
    serviceName: string,
    sourceLanguage: string,
    targetLanguage: string,
    sourceArray: string[],
    dontSaveInPersistentCache = false
  ): Promise<string[]> {
    console.log('translateText', serviceName, sourceLanguage, targetLanguage, sourceArray, dontSaveInPersistentCache)
    // 获取适合的翻译服务
    const actualServiceName = languages.getAlternativeService(targetLanguage, serviceName, false) as TranslationServiceType;
    const service = TranslationServiceFactory.getService(actualServiceName);

    const result = await service.translate(
      sourceLanguage,
      targetLanguage,
      [sourceArray],
      dontSaveInPersistentCache
    );

    return result[0];
  },

  /**
   * 翻译单个文本
   */
  async translateSingleText(
    serviceName: string,
    sourceLanguage: string,
    targetLanguage: string,
    originalText: string,
    dontSaveInPersistentCache = false
  ): Promise<string> {
    console.log('translateSingleText', serviceName, sourceLanguage, targetLanguage, originalText, dontSaveInPersistentCache)
    // 获取适合的翻译服务
    const actualServiceName = languages.getAlternativeService(targetLanguage, serviceName, false) as TranslationServiceType;
    const service = TranslationServiceFactory.getService(actualServiceName);

    const result = await service.translate(
      sourceLanguage,
      targetLanguage,
      [[originalText]],
      dontSaveInPersistentCache
    );

    return result[0][0];
  }
};

/**
 * 设置OpenAI配置
 */
export function setOpenAIConfig(config: OpenAIServiceParams): void {
  TranslationServiceFactory.setOpenAIConfig(config);
}

/**
 * 清除翻译服务缓存
 */
export function clearTranslationServiceCache(): void {
  TranslationServiceFactory.clearCache();
}

// 导出类型定义
export * from './types';

// 导出各个翻译服务的创建函数
export { createBingTranslationService } from './bingService';
export { createDeepLTranslationService } from './deeplService';
export { createGoogleTranslationService } from './googleService';
export { createOpenAITranslationService } from './openaiService';
export { createYandexTranslationService } from './yandexService';

