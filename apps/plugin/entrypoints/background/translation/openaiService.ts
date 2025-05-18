/**
 * OpenAI翻译服务实现
 */
import OpenAI from 'openai';
import { TranslationServiceProvider, TranslationProviderType } from './types';

/**
 * 创建OpenAI翻译服务
 */
export function createOpenAITranslationService(provider: TranslationProviderType): TranslationServiceProvider {
  const {
    apiKey = '',
    baseUrl: endpoint = 'https://api.openai.com/v1/chat/completions',
    model = 'gpt-3.5-turbo',
    systemPrompt = '你是一个专业的翻译助手，请将用户输入的文本翻译成{{targetLanguage}}，只返回翻译结果，不要添加任何解释或额外内容。',
    headers = {}
  } = provider;

  return {
    serviceName: provider.id || 'openai',
    async translate(
      sourceLanguage: string,
      targetLanguage: string,
      sourceArray2d: string[][],
      dontSaveInPersistentCache = false
    ): Promise<string[][]> {
      // 将二维数组扁平化为一维数组，以便进行批量翻译
      const flattenedTexts = sourceArray2d.flat();

      // 如果没有文本需要翻译，返回空结果
      if (flattenedTexts.length === 0) {
        return [];
      }

      try {
        // 创建OpenAI客户端实例
        const openai = new OpenAI({
          apiKey: apiKey,
          baseURL: endpoint,
          defaultHeaders: {
            'Content-Type': 'application/json',
            ...headers
          }
        });

        // 使用OpenAI API进行翻译
        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt.replace('{{targetLanguage}}', getLanguageName(targetLanguage))
            },
            {
              role: 'user',
              content: `将以下文本从${getLanguageName(sourceLanguage)}翻译成${getLanguageName(targetLanguage)}:\n\n${flattenedTexts.join('\n---\n')}`
            }
          ],
          temperature: 0.3
        });
        // 解析响应
        if (completion.choices && completion.choices.length > 0) {
          const translatedText = completion.choices[0].message.content || '';

          // 按照分隔符分割文本
          const translatedTexts = translatedText.split('\n---\n');

          // 重新构建二维数组结构
          const result: string[][] = [];
          let currentIndex = 0;

          for (const sourceArray of sourceArray2d) {
            const translatedArray: string[] = [];
            for (let i = 0; i < sourceArray.length; i++) {
              translatedArray.push(translatedTexts[currentIndex] || '');
              currentIndex++;
            }
            result.push(translatedArray);
          }

          return result;
        }

        throw new Error('OpenAI API 返回的响应格式不正确');
      } catch (error) {
        console.error('OpenAI翻译出错:', error);
        // 返回原始文本作为备选
        return sourceArray2d;
      }
    }
  };
}

/**
 * 获取语言名称
 */
function getLanguageName(languageCode: string): string {
  const languageMap: Record<string, string> = {
    'auto': '自动检测',
    'zh-CN': '中文(简体)',
    'zh-TW': '中文(繁体)',
    'en': '英语',
    'ja': '日语',
    'ko': '韩语',
    'fr': '法语',
    'es': '西班牙语',
    'it': '意大利语',
    'de': '德语',
    'ru': '俄语',
    'pt': '葡萄牙语',
    'ar': '阿拉伯语',
    'hi': '印地语',
    // 可以根据需要添加更多语言
  };

  return languageMap[languageCode] || languageCode;
}
