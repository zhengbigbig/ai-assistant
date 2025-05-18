/**
 * 翻译服务类型定义
 */
import { TranslationProviderType } from '@/entrypoints/stores/configStore';

// 翻译状态
export type TranslationStatus = 'translating' | 'complete' | 'error';

// 翻译信息
export interface TranslationInfo {
  originalText: string;
  translatedText: null | string;
  detectedLanguage: null | string;
  status: TranslationStatus;
  waitTranslate: Promise<void>;
}

// 单个翻译结果响应
export interface ServiceSingleResultResponse {
  text: string;
  detectedLanguage: string | null;
}

// 翻译服务接口
export interface TranslationService {
  translateHTML(
    serviceName: string,
    sourceLanguage: string,
    targetLanguage: string,
    sourceArray2d: string[][],
    dontSaveInPersistentCache?: boolean
  ): Promise<string[][]>;

  translateText(
    serviceName: string,
    sourceLanguage: string,
    targetLanguage: string,
    sourceArray: string[],
    dontSaveInPersistentCache?: boolean
  ): Promise<string[]>;

  translateSingleText(
    serviceName: string,
    sourceLanguage: string,
    targetLanguage: string,
    originalText: string,
    dontSaveInPersistentCache?: boolean
  ): Promise<string>;
}

// 翻译服务提供者接口
export interface TranslationServiceProvider {
  serviceName: string;
  translate(
    sourceLanguage: string,
    targetLanguage: string,
    sourceArray2d: string[][],
    dontSaveInPersistentCache?: boolean
  ): Promise<string[][]>;
}

// 导出 ConfigStore 中的 TranslationProviderType 以便其他模块使用
export type { TranslationProviderType };
