import { Message } from '../entrypoints/stores/chatStore';
import OpenAI from 'openai';

/**
 * 创建OpenAI客户端
 * @param apiKey API密钥
 * @param apiBaseUrl API基础URL
 * @returns OpenAI客户端实例
 */
export const createOpenAIClient = (apiKey: string, apiBaseUrl = 'https://api.openai.com/v1') => {
  return new OpenAI({
    apiKey,
    baseURL: apiBaseUrl,
    dangerouslyAllowBrowser: true, // 允许在浏览器环境中使用
  });
};

/**
 * 流式发送消息到OpenAI API
 * @param messages 消息列表
 * @param apiKey API密钥
 * @param apiBaseUrl API基础URL
 * @param model 模型名称
 * @param signal 中止信号
 * @param onUpdate 更新回调
 * @param onComplete 完成回调
 * @param onError 错误回调
 */
export const streamToOpenAI = async (
  messages: Message[],
  apiKey: string,
  apiBaseUrl = 'https://api.openai.com/v1',
  model = 'gpt-3.5-turbo',
  signal: AbortSignal,
  onUpdate: (content: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) => {
  try {
    const openai = createOpenAIClient(apiKey, apiBaseUrl);

    const stream = await openai.chat.completions.create({
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: true,
    }, { signal });

    let content = '';

    for await (const chunk of stream) {
      if (signal.aborted) {
        break;
      }

      const contentDelta = chunk.choices[0]?.delta?.content || '';
      if (contentDelta) {
        content += contentDelta;
        onUpdate(content);
      }
    }

    // 完成回调
    if (!signal.aborted) {
      onComplete();
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('请求已取消');
    } else {
      console.error('发送消息错误:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
};

/**
 * 同步发送消息到OpenAI API（非流式）
 * @param messages 消息列表
 * @param apiKey API密钥
 * @param apiBaseUrl API基础URL
 * @param model 模型名称
 * @param signal 中止信号
 * @returns 返回AI回复的内容
 */
export const sendToOpenAISync = async (
  messages: Message[],
  apiKey: string,
  apiBaseUrl = 'https://api.openai.com/v1',
  model = 'gpt-3.5-turbo',
  signal?: AbortSignal
): Promise<string> => {
  try {
    const openai = createOpenAIClient(apiKey, apiBaseUrl);

    const response = await openai.chat.completions.create({
      model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      stream: false,
    }, signal ? { signal } : undefined);

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('请求已取消');
      throw new Error('请求已取消');
    } else {
      console.error('发送消息错误:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
};

/**
 * 发送消息到OpenAI API（兼容旧版本的API）
 * @deprecated 推荐使用 streamToOpenAI 或 sendToOpenAISync
 */
export const sendToOpenAI = async (
  messages: Message[],
  apiKey: string,
  apiBaseUrl = 'https://api.openai.com/v1',
  model = 'gpt-3.5-turbo',
  signal: AbortSignal,
  onUpdate: (content: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) => {
  return streamToOpenAI(messages, apiKey, apiBaseUrl, model, signal, onUpdate, onComplete, onError);
};
