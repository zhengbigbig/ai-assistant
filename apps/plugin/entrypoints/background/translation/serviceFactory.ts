/**
 * 翻译服务工厂
 */
import { TranslationServiceProvider, TranslationProviderType } from './types';
import { createGoogleTranslationService } from './googleService';
import { createYandexTranslationService } from './yandexService';
import { createBingTranslationService } from './bingService';
import { createDeepLTranslationService } from './deeplService';
import { createOpenAITranslationService } from './openaiService';
import { useConfigStore } from '@/entrypoints/stores/configStore';
import { DEFAULT_TRANSLATION_PROVIDERS } from '@/constants/config';

/**
 * 翻译服务类型
 */
export type TranslationServiceType =
  | 'google'
  | 'yandex'
  | 'bing'
  | 'deepl'
  | string;

/**
 * 翻译服务工厂
 */
export class TranslationServiceFactory {
  private static services: Map<string, TranslationServiceProvider> = new Map();

  /**
   * 获取翻译服务提供商配置
   */
  private static getProviderConfig(
    id: string
  ): TranslationProviderType | undefined {
    // 首先从 configStore 获取
    const configStore = useConfigStore.getState();
    const translationProviders = configStore.translationProviders || [];
    const providerConfig = translationProviders.find((p) => p.id === id);

    // 如果 configStore 中没有，尝试从默认配置获取
    if (!providerConfig) {
      return DEFAULT_TRANSLATION_PROVIDERS.find((p) => p.id === id);
    }

    return providerConfig;
  }

  /**
   * 获取翻译服务
   */
  static getService(type: TranslationServiceType): TranslationServiceProvider {
    // 如果服务已经创建，直接返回
    if (this.services.has(type)) {
      return this.services.get(type)!;
    }
    // 获取服务提供商配置
    const providerConfig = this.getProviderConfig(type);
    console.log('type', type);
    console.log('providerConfig', providerConfig);

    // 创建服务
    let service: TranslationServiceProvider;

    // 内置服务使用专门的代码实现
    if (providerConfig?.isBuiltIn) {
      switch (type) {
        case 'yandex':
          service = createYandexTranslationService(providerConfig.baseUrl);
          break;
        case 'bing':
          service = createBingTranslationService(providerConfig.baseUrl);
          break;
        case 'deepl':
          service = createDeepLTranslationService(providerConfig.baseUrl);
          break;
        default:
          service = createGoogleTranslationService(providerConfig.baseUrl);
          break;
      }
    } else if (providerConfig) {
      // 非内置服务统一使用OpenAI服务
      service = createOpenAITranslationService(providerConfig);
    } else {
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
