/**
 * 翻译服务
 * 封装了翻译相关的API调用
 */
import { useConfigStore } from '../stores/configStore';
import { TargetLanguage } from '../constants/config';

// 支持的翻译服务类型
export enum TranslationServiceType {
  OPENAI = 'openai',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
}

// 翻译结果接口
export interface TranslationResult {
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

/**
 * 使用默认配置的翻译服务翻译文本
 * @param text 需要翻译的文本
 * @returns 翻译结果
 */
export async function translateText(text: string): Promise<TranslationResult> {
  const config = useConfigStore.getState();
  const { translationService, targetLanguage } = config.translation;

  return translateTextWithService(text, translationService as TranslationServiceType, targetLanguage as TargetLanguage);
}

/**
 * 使用指定翻译服务翻译文本
 * @param text 需要翻译的文本
 * @param service 翻译服务类型
 * @param targetLanguage 目标语言
 * @returns 翻译结果
 */
export async function translateTextWithService(
  text: string,
  service: TranslationServiceType,
  targetLanguage: TargetLanguage
): Promise<TranslationResult> {
  try {
    switch (service) {
      case TranslationServiceType.OPENAI:
        return await translateWithOpenAI(text, targetLanguage);
      case TranslationServiceType.GOOGLE:
        return await translateWithGoogle(text, targetLanguage);
      case TranslationServiceType.MICROSOFT:
        return await translateWithMicrosoft(text, targetLanguage);
      default:
        // 默认使用OpenAI
        return await translateWithOpenAI(text, targetLanguage);
    }
  } catch (error) {
    console.error('翻译出错:', error);
    throw new Error(`翻译失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 使用OpenAI翻译文本
 * @param text 需要翻译的文本
 * @param targetLanguage 目标语言
 * @returns 翻译结果
 */
async function translateWithOpenAI(text: string, targetLanguage: TargetLanguage): Promise<TranslationResult> {
  const config = useConfigStore.getState();
  const providers = config.providers;
  const openAIProvider = providers.find(p => p.id === 'openai');

  if (!openAIProvider || !openAIProvider.apiKey) {
    throw new Error('未配置OpenAI API密钥');
  }

  try {
    // 获取目标语言显示名称
    const languageName = getLanguageDisplayName(targetLanguage);

    // 构建请求参数
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的翻译助手。请将用户的文本翻译成${languageName}，只返回翻译结果，不要添加任何额外的解释或标记。保持原文的格式，包括换行和空格。`
      },
      {
        role: 'user',
        content: text
      }
    ];

    // 发送请求到OpenAI API
    const response = await fetch(`${openAIProvider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIProvider.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.3, // 使用较低的随机性，确保翻译准确
        max_tokens: text.length * 2, // 预估目标语言可能需要的最大token数
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API错误: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim() || '';

    return {
      translatedText,
      targetLanguage
    };
  } catch (error) {
    console.error('OpenAI翻译出错:', error);
    throw new Error(`OpenAI翻译失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 使用Google翻译文本（示例实现，实际需要集成Google翻译API）
 */
async function translateWithGoogle(text: string, targetLanguage: TargetLanguage): Promise<TranslationResult> {
  // 这里是示例实现，实际需要集成Google翻译API
  console.log('使用Google翻译', text, targetLanguage);

  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    translatedText: `[Google翻译] ${text}`,
    targetLanguage
  };
}

/**
 * 使用Microsoft翻译文本（示例实现，实际需要集成Microsoft翻译API）
 */
async function translateWithMicrosoft(text: string, targetLanguage: TargetLanguage): Promise<TranslationResult> {
  // 这里是示例实现，实际需要集成Microsoft翻译API
  console.log('使用Microsoft翻译', text, targetLanguage);

  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    translatedText: `[Microsoft翻译] ${text}`,
    targetLanguage
  };
}

/**
 * 获取语言显示名称
 * @param language 语言代码
 * @returns 语言显示名称
 */
function getLanguageDisplayName(language: TargetLanguage): string {
  const languageMap: Record<TargetLanguage, string> = {
    [TargetLanguage.ZH_CN]: '简体中文',
    [TargetLanguage.EN_US]: '英语',
    [TargetLanguage.JA_JP]: '日语',
    [TargetLanguage.KO_KR]: '韩语',
    [TargetLanguage.FR_FR]: '法语',
    [TargetLanguage.DE_DE]: '德语',
    [TargetLanguage.RU_RU]: '俄语',
    [TargetLanguage.ES_ES]: '西班牙语',
    [TargetLanguage.IT_IT]: '意大利语',
    [TargetLanguage.PT_PT]: '葡萄牙语',
  };

  return languageMap[language] || '未知语言';
}
