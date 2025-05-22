import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStorageAdapter } from './storage';
import { ProviderType } from './configStore';
import { streamToOpenAI } from '@/utils/openai';
import { message as messageApi } from 'antd';
import { AttachmentsProps } from '@ant-design/x';

// 定义消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  status?: 'loading' | 'done' | 'error';
}

export interface ModelParams {
  provider?: ProviderType;
  model?: string;
}

// 根据不同类型组装入参
export enum DispatchType {
  OPENAI = 'openai',
  // extra
}

// 插件类型
export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  // 开启状态
  enabled: boolean;
}

// 聊天状态
export interface ChatState {
  // 当前模型信息
  currentModel: ModelParams;
  // 输入框内容
  inputValue: string;
  // 附件
  attachments: AttachmentsProps['items'];
  // 插件
  plugins: Plugin[];
  // 消息列表
  messages: Message[];
  // 加载状态
  loading: boolean;
  // 当前选中的消息索引
  selectedMessageIndex: number;
  // 当前中止控制器
  abortController: AbortController | null;

  // 划词引用
  selectedText: string;

  // 操作方法
  updatePlugin: (id: string, updates: Partial<Plugin>) => void;
  setSelectedText: (selectedText: string) => void;
  setCurrentModel: (modelParams: ModelParams) => void;
  setInputValue: (inputValue: string) => void;
  setAttachments: (attachments: AttachmentsProps['items']) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setSelectedMessageIndex: (index: number) => void;
  setAbortController: (controller: AbortController | null) => void;
  generateUserMessage: (message: string) => Message;
  generateAssistantMessage: (message: string) => Message;
  chatOpenAI: (message: string) => void;
  abortRequest: () => void;
  retryChatOpenAI: () => void;
  // copy message
  copyMessage: () => void;
}

// 创建聊天存储
export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentModel: {
        provider: undefined,
        model: undefined,
      },
      inputValue: '',
      attachments: [],
      plugins: [
        {
          id: 'think',
          name: '思考',
          description: '思考',
          icon: 'think',
          enabled: false,
        },
        {
          id: 'search',
          name: '搜索',
          description: '搜索',
          icon: 'search',
          enabled: false,
        },
      ],
      messages: [],
      loading: false,
      selectedMessageIndex: -1,
      abortController: null,

      selectedText: '',

      updatePlugin: (id: string, updates: Partial<Plugin>) => set((state) => ({
        plugins: state.plugins.map((plugin) =>
          plugin.id === id ? { ...plugin, ...updates } : plugin
        ),
      })),
      setSelectedText: (selectedText: string) => {
        set({ selectedText })
      },
      setCurrentModel: (modelParams: ModelParams) => set({ currentModel: modelParams }),
      setAttachments: (attachments: AttachmentsProps['items']) => set({ attachments }),
      setMessages: (messages) => set({ messages }),
      setInputValue: (inputValue: string) => set({ inputValue }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        })),
      removeMessage: (id) =>
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        })),
      clearMessages: () => set({ messages: [] }),
      setLoading: (loading) => set({ loading }),
      setSelectedMessageIndex: (index) => set({ selectedMessageIndex: index }),
      setAbortController: (controller) => set({ abortController: controller }),
      generateUserMessage: (message: string) => {
        // 检查消息中是否包含图片链接
        const imgLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let matches;
        let processedContent = message;
        let imageUrl;
        // 提取图片链接
        while ((matches = imgLinkRegex.exec(message)) !== null) {
          const [fullMatch, description, url] = matches;
          imageUrl = url;
          // 从文本中移除图片链接
          processedContent = processedContent.replace(fullMatch, '');
        }
        // 清理处理后的内容
        processedContent = processedContent.trim();
        // 创建用户消息
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: processedContent,
          imageUrl: imageUrl,
          status: 'done',
        };
        return userMessage;
      },
      generateAssistantMessage: (message: string) => {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: message,
          status: 'done',
        };
        return assistantMessage;
      },
      abortRequest: () => {
        const abortController = get().abortController;
        if (abortController) {
          abortController.abort();
          get().setAbortController(null);
          get().setLoading(false);
        }
      },
      chatOpenAI: async (message: string) => {
        if (!message.trim()) return;
        const { provider, model } = get().currentModel;
        if (!provider || !model) {
          messageApi.error('请先选择模型');
          return;
        }

        // 创建用户消息
        const userMessage: Message = get().generateUserMessage(message);
        // 添加到消息列表
        get().addMessage(userMessage);
        // 创建中止控制器
        const abortController = new AbortController();
        get().setAbortController(abortController);
        get().setLoading(true);
        // 为助手消息创建一个占位符
        const assistantMessage: Message = get().generateAssistantMessage('');
        get().addMessage(assistantMessage);
        // 清空输入框
        set({ inputValue: '' });
        // 调用API
        await streamToOpenAI(
          get().messages,
          provider.apiKey,
          provider.baseUrl,
          model,
          abortController.signal,
          (content) => {
            // 更新消息内容
            get().updateMessage(assistantMessage.id, {
              content,
              status: 'loading',
            });
          },
          () => {
            // 完成回调
            get().updateMessage(assistantMessage.id, { status: 'done' });
            get().setLoading(false);
            get().setAbortController(null);
          },
          (error) => {
            // 错误回调
            get().updateMessage(assistantMessage.id, {
              content: `请求失败: ${error.message}`,
              status: 'error',
            });
            get().setLoading(false);
            get().setAbortController(null);
            messageApi.error('发送消息失败，请重试');
          }
        );
      },
      retryChatOpenAI: async () => {
        const selectedMessageIndex = get().selectedMessageIndex;
        if (selectedMessageIndex < 0) return;
        const messagesToRetry = get().messages.slice(0, selectedMessageIndex);
        const { provider, model } = get().currentModel;
        if (!provider || !model) {
          messageApi.error('请先选择模型');
          return;
        }

        // 创建中止控制器
        const abortController = new AbortController();
        get().setAbortController(abortController);
        get().setLoading(true);

        // 获取对应助手消息
        const assistantMessage = messagesToRetry[selectedMessageIndex];
        // 调用API
        await streamToOpenAI(
          messagesToRetry,
          provider.apiKey,
          provider.baseUrl,
          model,
          abortController.signal,
          (content) => {
            // 更新消息内容
            get().updateMessage(assistantMessage.id, {
              content,
              status: 'loading',
            });
          },
          () => {
            // 完成回调
            get().updateMessage(assistantMessage.id, { status: 'done' });
            get().setLoading(false);
            get().setAbortController(null);
          },
          (error) => {
            // 错误回调
            get().updateMessage(assistantMessage.id, {
              content: `请求失败: ${error.message}`,
              status: 'error',
            });
            get().setLoading(false);
            get().setAbortController(null);
            messageApi.error('发送消息失败，请重试');
          }
        );
      },
      copyMessage: () => {
        const selectedMessageIndex = get().selectedMessageIndex;
        if (selectedMessageIndex < 0) return;
        const message = get().messages[selectedMessageIndex];
        navigator.clipboard.writeText(message.content)
          .then(() => messageApi.success('已复制到剪贴板'))
          .catch((err) => {
            console.error('复制失败:', err);
            messageApi.error('复制失败');
          });
      }
    }),
    {
      name: 'chat-storage',
      storage: localStorageAdapter,
    }
  )
);

// 导出选择器
export const useMessages = () => useChatStore((state) => state.messages);
export const useChatLoading = () => useChatStore((state) => state.loading);
export const useSelectedMessageIndex = () =>
  useChatStore((state) => state.selectedMessageIndex);
