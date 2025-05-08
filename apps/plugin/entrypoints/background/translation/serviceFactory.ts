/**
 * 翻译服务工厂
 */
import { TranslationServiceProvider, OpenAIServiceParams } from './types';
import { createGoogleTranslationService } from './googleService';
import { createYandexTranslationService } from './yandexService';
import { createBingTranslationService } from './bingService';
import { createDeepLTranslationService } from './deeplService';
import { createOpenAITranslationService } from './openaiService';

/**
 * 翻译服务类型
 */
export type TranslationServiceType = 'google' | 'yandex' | 'bing' | 'deepl' | 'openai';

/**
 * 翻译服务工厂
 */
export class TranslationServiceFactory {
  private static services: Map<string, TranslationServiceProvider> = new Map();
  private static openAIConfig: OpenAIServiceParams | null = null;

  /**
   * 设置OpenAI配置
   */
  static setOpenAIConfig(config: OpenAIServiceParams): void {
    this.openAIConfig = config;
  }

  /**
   * 获取翻译服务
   */
  static getService(type: TranslationServiceType): TranslationServiceProvider {
    // 如果服务已经创建，直接返回
    if (this.services.has(type)) {
      return this.services.get(type)!;
    }

    // 根据类型创建服务
    let service: TranslationServiceProvider;

    switch (type) {
      case 'google':
        service = createGoogleTranslationService();
        break;
      case 'yandex':
        service = createYandexTranslationService();
        break;
      case 'bing':
        service = createBingTranslationService();
        break;
      case 'deepl':
        service = createDeepLTranslationService();
        break;
      case 'openai':
        if (!this.openAIConfig) {
          throw new Error('OpenAI配置未设置，请先调用setOpenAIConfig方法');
        }
        service = createOpenAITranslationService(this.openAIConfig);
        break;
      default:
        // 默认使用Google翻译
        service = createGoogleTranslationService();
    }

    // 缓存服务实例
    this.services.set(type, service);
    return service;
  }

  /**
   * 清除服务缓存
   */
  static clearCache(): void {
    this.services.clear();
  }
}
