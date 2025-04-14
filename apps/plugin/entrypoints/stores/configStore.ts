import { create } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { produce } from 'immer';
import syncStorageAdapter from './storage';

// 定义模型类型接口
export interface ModelType {
  id: string;
  name: string;
  value: string;
  description?: string;
  enabled?: boolean;
}

// 服务提供商接口
export interface ProviderType {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  models: ModelType[];
}

// 外观设置接口
export interface AppearanceSettings {
  displayMode: 'auto' | 'light' | 'dark';
  language: string;
  fontSize: number;
}

// 翻译设置接口
export interface TranslationSettings {
  targetLanguage: string;
  displayMode: 'dual' | 'replace';
  translationService: string;
  displayStyle: 'underline' | 'background' | 'border';
  forbiddenWebsites: string[];
  enableVideoSubtitleTranslation: boolean;
  enableInputTranslation: boolean;
  enableHoverTranslation: boolean;
  hoverHotkey: string;
  hoverTranslationService: string;
}

// 网页助手设置接口
export interface WebHelperSettings {
  enableForSearch: boolean;
  searchAnswerDisplay: 'always' | 'whenHovered' | 'whenClicked';
  enableForYoutube: boolean;
  enableForLinks: boolean;
  enableForImages: boolean;
  enableForCode: boolean;
  enableInputCompletion: boolean;
  allowedWebsites: string[];
  enableForArticle?: boolean;
  articleAnswerDisplay?: 'always' | 'whenClicked';
  showSidePanel?: boolean;
  sidePanelPosition?: 'left' | 'right';
  chatLanguage?: 'zh-CN' | 'zh-TW' | 'en-US';
}

// 朗读设置接口
export interface VoiceSettings {
  voiceType: string;
  voiceSpeed: number;
}

// 侧边栏设置接口
export interface SidebarSettings {
  // 聊天设置
  restoreChat: 'always' | 'restore' | 'auto';
  scrollBehavior: 'bottom' | 'auto';
  showSiderIcon: boolean;
  autoSelectText: boolean;
}

// 划词功能设置接口
export interface TextSelectionSettings {
  enableTextSelection: boolean;
  enableWriteTextSelection: boolean;
  hotkey: string;
  triggerCondition: 'selectText' | 'selectTextAndPressHotkey';
  forbiddenWebsites: string[];
}

// 提示词设置接口
export interface PromptWordItem {
  id: string;
  name: string; // 提示词名称
  content: string;
  category?: string;
  order: number;
  scenes?: string[]; // 应用场景，如"聊天/提问"、"阅读"、"写作"等
}

export interface PromptWordsSettings {
  enablePromptSuggestions: boolean;
  showPromptShortcuts: boolean;
  promptWords: PromptWordItem[];
}

// 账户信息接口
export interface AccountInfo {
  name: string;
  email: string;
  avatar?: string;
}

// 完整配置存储接口
export interface ConfigState {
  // AI 提供商相关
  providers: ProviderType[];
  selectedProvider: string | null;

  // 外观设置
  appearance: AppearanceSettings;

  // 朗读设置
  voice: VoiceSettings;

  // 侧边栏设置
  sidebar: SidebarSettings;

  // 划词功能设置
  textSelection: TextSelectionSettings;

  // 提示词设置
  promptWords: PromptWordsSettings;

  // 翻译设置
  translation: TranslationSettings;

  // 网页助手设置
  webHelper: WebHelperSettings;

  // 账户信息
  account: AccountInfo | null;

  // 提供商操作
  addProvider: (provider: ProviderType) => void;
  updateProvider: (id: string, updates: Partial<ProviderType>) => void;
  removeProvider: (id: string) => void;
  setSelectedProvider: (id: string | null) => void;

  // 模型操作
  addModel: (providerId: string, model: ModelType) => void;
  updateModel: (providerId: string, modelId: string, updates: Partial<ModelType>) => void;
  removeModel: (providerId: string, modelId: string) => void;
  toggleModelEnabled: (providerId: string, modelId: string, enabled: boolean) => void;

  // 外观设置操作
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;

  // 朗读设置操作
  updateVoice: (settings: Partial<VoiceSettings>) => void;

  // 侧边栏设置操作
  updateSidebar: (settings: Partial<SidebarSettings>) => void;

  // 划词功能设置操作
  updateTextSelection: (settings: Partial<TextSelectionSettings>) => void;

  // 提示词操作
  updatePromptWords: (settings: Partial<PromptWordsSettings>) => void;
  addPromptWord: (promptWord: Omit<PromptWordItem, 'id' | 'order'>) => void;
  updatePromptWord: (id: string, updates: Partial<PromptWordItem>) => void;
  removePromptWord: (id: string) => void;
  reorderPromptWords: (promptWords: PromptWordItem[]) => void;

  // 翻译设置操作
  updateTranslation: (settings: Partial<TranslationSettings>) => void;

  // 网页助手设置操作
  updateWebHelper: (settings: Partial<WebHelperSettings>) => void;

  // 账户操作
  updateAccount: (account: Partial<AccountInfo>) => void;
  logout: () => void;
}

// 创建持久化的zustand store
export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      // 初始状态
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          apiKey: '',
          baseUrl: 'https://api.openai.com/v1',
          models: [
            { id: 'o3-mini', name: 'o3-mini', value: 'gpt-3.5-turbo', description: '适合简单对话', enabled: true },
            { id: 'o1-mini', name: 'o1-mini', value: 'gpt-3.5-turbo', description: 'OpenAI轻量版', enabled: true },
            { id: 'o1', name: 'o1', value: 'gpt-4', description: 'OpenAI最强大模型', enabled: true },
            { id: 'o1-preview', name: 'o1-preview', value: 'gpt-3.5-turbo', description: '预览版本', enabled: true },
            { id: 'gpt-4o-mini', name: 'gpt-4o-mini', value: 'gpt-4', description: 'GPT-4o轻量版', enabled: true },
            { id: 'gpt-4o-2024-11-20', name: 'gpt-4o-2024-11-20', value: 'gpt-4', description: '最新版本', enabled: true },
          ],
        },
        {
          id: 'deepseek',
          name: 'DeepSeek',
          apiKey: '',
          baseUrl: '',
          models: [],
        },
        {
          id: 'groq',
          name: 'Groq',
          apiKey: '',
          baseUrl: '',
          models: [],
        },
        {
          id: 'ollama',
          name: 'Ollama',
          apiKey: '',
          baseUrl: '',
          models: [],
        },
      ],
      selectedProvider: 'openai',

      // 外观设置默认值
      appearance: {
        displayMode: 'auto',
        language: 'zh-CN',
        fontSize: 16,
      },

      // 朗读设置默认值
      voice: {
        voiceType: 'robot',
        voiceSpeed: 1.0,
      },

      // 侧边栏设置默认值
      sidebar: {
        restoreChat: 'auto',
        scrollBehavior: 'auto',
        showSiderIcon: true,
        autoSelectText: true,
      },

      // 划词功能设置默认值
      textSelection: {
        enableTextSelection: true,
        enableWriteTextSelection: true,
        hotkey: 'option',
        triggerCondition: 'selectText',
        forbiddenWebsites: ['google.com', 'bing.com', 'baidu.com'],
      },

      // 提示词设置默认值
      promptWords: {
        enablePromptSuggestions: true,
        showPromptShortcuts: true,
        promptWords: [
          { id: '1', name: '翻译成中文', content: '翻译以下内容到中文', category: '翻译', order: 0, scenes: ['聊天/提问', '阅读'] },
          { id: '2', name: '内容总结', content: '总结以下内容的要点', category: '总结', order: 1, scenes: ['聊天/提问', '阅读'] },
          { id: '3', name: '改善写作', content: '改善以下写作', category: '改善写作', order: 2, scenes: ['写作'] },
          { id: '4', name: '语法纠正', content: '纠正语法错误', category: '纠正语法', order: 3, scenes: ['写作'] },
          { id: '5', name: '问题回答', content: '回答此问题', category: '回答此问题', order: 4, scenes: ['聊天/提问'] },
          { id: '6', name: '代码解释', content: '解释代码', category: '解释代码', order: 5, scenes: ['聊天/提问', '阅读'] },
          { id: '7', name: '行动事项', content: '列出行动事项', category: '列出行动事项', order: 6, scenes: ['阅读'] },
          { id: '8', name: '内容精简', content: '压缩长度', category: '压缩长度', order: 7, scenes: ['写作'] },
          { id: '9', name: '内容扩展', content: '扩展长度', category: '扩展长度', order: 8, scenes: ['写作'] },
        ],
      },

      // 翻译设置默认值
      translation: {
        targetLanguage: 'zh-CN',
        displayMode: 'dual',
        translationService: 'google',
        displayStyle: 'underline',
        forbiddenWebsites: [],
        enableVideoSubtitleTranslation: true,
        enableInputTranslation: false,
        enableHoverTranslation: true,
        hoverHotkey: 'option',
        hoverTranslationService: 'google'
      },

      // 网页助手设置默认值
      webHelper: {
        enableForSearch: true,
        searchAnswerDisplay: 'always',
        enableForYoutube: true,
        enableForLinks: true,
        enableForImages: true,
        enableForCode: true,
        enableInputCompletion: true,
        allowedWebsites: ['docs.google.com'],
        enableForArticle: false,
        articleAnswerDisplay: 'always',
        showSidePanel: true,
        sidePanelPosition: 'right',
        chatLanguage: 'zh-CN'
      },

      // 账户信息 - 默认为null
      account: null,

      // 提供商操作
      addProvider: (provider: ProviderType) => set(
        produce((state: ConfigState) => {
          state.providers.push(provider);
        })
      ),

      updateProvider: (id: string, updates: Partial<ProviderType>) => set(
        produce((state: ConfigState) => {
          const providerIndex = state.providers.findIndex((p: ProviderType) => p.id === id);
          if (providerIndex !== -1) {
            state.providers[providerIndex] = {
              ...state.providers[providerIndex],
              ...updates
            };
          }
        })
      ),

      removeProvider: (id: string) => set(
        produce((state: ConfigState) => {
          state.providers = state.providers.filter((p: ProviderType) => p.id !== id);
          if (state.selectedProvider === id) {
            state.selectedProvider = state.providers.length > 0 ? state.providers[0].id : null;
          }
        })
      ),

      setSelectedProvider: (id: string | null) => set({ selectedProvider: id }),

      // 模型操作
      addModel: (providerId: string, model: ModelType) => set(
        produce((state: ConfigState) => {
          const provider = state.providers.find((p: ProviderType) => p.id === providerId);
          if (provider) {
            provider.models.push(model);
          }
        })
      ),

      updateModel: (providerId: string, modelId: string, updates: Partial<ModelType>) => set(
        produce((state: ConfigState) => {
          const provider = state.providers.find((p: ProviderType) => p.id === providerId);
          if (provider) {
            const modelIndex = provider.models.findIndex((m: ModelType) => m.id === modelId);
            if (modelIndex !== -1) {
              provider.models[modelIndex] = {
                ...provider.models[modelIndex],
                ...updates
              };
            }
          }
        })
      ),

      removeModel: (providerId: string, modelId: string) => set(
        produce((state: ConfigState) => {
          const provider = state.providers.find((p: ProviderType) => p.id === providerId);
          if (provider) {
            provider.models = provider.models.filter((m: ModelType) => m.id !== modelId);
          }
        })
      ),

      toggleModelEnabled: (providerId: string, modelId: string, enabled: boolean) => set(
        produce((state: ConfigState) => {
          const provider = state.providers.find((p: ProviderType) => p.id === providerId);
          if (provider) {
            const model = provider.models.find((m: ModelType) => m.id === modelId);
            if (model) {
              model.enabled = enabled;
            }
          }
        })
      ),

      // 外观设置操作
      updateAppearance: (settings: Partial<AppearanceSettings>) => set(
        produce((state: ConfigState) => {
          state.appearance = {
            ...state.appearance,
            ...settings
          };
        })
      ),

      // 朗读设置操作
      updateVoice: (settings: Partial<VoiceSettings>) => set(
        produce((state: ConfigState) => {
          state.voice = {
            ...state.voice,
            ...settings
          };
        })
      ),

      // 侧边栏设置操作
      updateSidebar: (settings: Partial<SidebarSettings>) => set(
        produce((state: ConfigState) => {
          state.sidebar = {
            ...state.sidebar,
            ...settings
          };
        })
      ),

      // 划词功能设置操作
      updateTextSelection: (settings: Partial<TextSelectionSettings>) => set(
        produce((state: ConfigState) => {
          state.textSelection = {
            ...state.textSelection,
            ...settings
          };
        })
      ),

      // 提示词操作
      updatePromptWords: (settings: Partial<PromptWordsSettings>) => set(
        produce((state: ConfigState) => {
          state.promptWords = {
            ...state.promptWords,
            ...settings
          };
        })
      ),

      addPromptWord: (promptWord: Omit<PromptWordItem, 'id' | 'order'>) => set(
        produce((state: ConfigState) => {
          const newId = Date.now().toString();
          const maxOrder = state.promptWords.promptWords.length > 0
            ? Math.max(...state.promptWords.promptWords.map((p: PromptWordItem) => p.order))
            : -1;

          state.promptWords.promptWords.push({
            ...promptWord,
            id: newId,
            order: maxOrder + 1
          });
        })
      ),

      updatePromptWord: (id: string, updates: Partial<PromptWordItem>) => set(
        produce((state: ConfigState) => {
          const index = state.promptWords.promptWords.findIndex((p: PromptWordItem) => p.id === id);
          if (index !== -1) {
            state.promptWords.promptWords[index] = {
              ...state.promptWords.promptWords[index],
              ...updates
            };
          }
        })
      ),

      removePromptWord: (id: string) => set(
        produce((state: ConfigState) => {
          state.promptWords.promptWords = state.promptWords.promptWords.filter((p: PromptWordItem) => p.id !== id);
        })
      ),

      reorderPromptWords: (promptWords: PromptWordItem[]) => set(
        produce((state: ConfigState) => {
          state.promptWords.promptWords = promptWords;
        })
      ),

      // 翻译设置操作
      updateTranslation: (settings: Partial<TranslationSettings>) => set(
        produce((state: ConfigState) => {
          state.translation = {
            ...state.translation,
            ...settings
          };
        })
      ),

      // 网页助手设置操作
      updateWebHelper: (settings: Partial<WebHelperSettings>) => set(
        produce((state: ConfigState) => {
          state.webHelper = {
            ...state.webHelper,
            ...settings
          };
        })
      ),

      // 账户操作
      updateAccount: (account: Partial<AccountInfo>) => set(
        produce((state: ConfigState) => {
          state.account = {
            ...state.account,
            ...account
          } as AccountInfo;
        })
      ),

      logout: () => set(
        produce((state: ConfigState) => {
          state.account = null;
        })
      ),
    }),
    {
      name: 'ai-assistant-config',
      storage: syncStorageAdapter,
    }
  )
);

// 导出便捷的钩子函数，用于获取特定配置
export const useProviders = () => useConfigStore(state => state.providers);
export const useSelectedProvider = () => useConfigStore(state => state.selectedProvider);
export const useAppearance = () => useConfigStore(state => state.appearance);
export const useVoice = () => useConfigStore(state => state.voice);
export const useSidebar = () => useConfigStore(state => state.sidebar);
export const useTextSelection = () => useConfigStore(state => state.textSelection);
export const useAccount = () => useConfigStore(state => state.account);
export const usePromptWords = () => useConfigStore(state => state.promptWords);
export const useTranslation = () => useConfigStore(state => state.translation);
export const useWebHelper = () => useConfigStore(state => state.webHelper);

// 根据当前选择的提供商获取可用模型
export const useAvailableModels = () => {
  const providers = useConfigStore(state => state.providers);
  const selectedProviderId = useConfigStore(state => state.selectedProvider);

  const selectedProvider = providers.find(p => p.id === selectedProviderId);
  if (selectedProvider) {
    return selectedProvider.models.filter(model => model.enabled !== false);
  }
  return [];
};
