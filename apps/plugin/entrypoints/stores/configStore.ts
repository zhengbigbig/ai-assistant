import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

// 朗读设置接口
export interface VoiceSettings {
  voiceType: string;
  voiceSpeed: number;
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

      // 账户信息 - 默认为null
      account: null,

      // 提供商操作
      addProvider: (provider) => set(
        produce((state) => {
          state.providers.push(provider);
        })
      ),

      updateProvider: (id, updates) => set(
        produce((state) => {
          const providerIndex = state.providers.findIndex((p: ProviderType) => p.id === id);
          if (providerIndex !== -1) {
            state.providers[providerIndex] = {
              ...state.providers[providerIndex],
              ...updates
            };
          }
        })
      ),

      removeProvider: (id) => set(
        produce((state) => {
          state.providers = state.providers.filter((p: ProviderType) => p.id !== id);
          if (state.selectedProvider === id) {
            state.selectedProvider = state.providers.length > 0 ? state.providers[0].id : null;
          }
        })
      ),

      setSelectedProvider: (id) => set({ selectedProvider: id }),

      // 模型操作
      addModel: (providerId, model) => set(
        produce((state) => {
          const provider = state.providers.find((p: ProviderType) => p.id === providerId);
          if (provider) {
            provider.models.push(model);
          }
        })
      ),

      updateModel: (providerId, modelId, updates) => set(
        produce((state) => {
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

      removeModel: (providerId, modelId) => set(
        produce((state) => {
          const provider = state.providers.find((p: ProviderType) => p.id === providerId);
          if (provider) {
            provider.models = provider.models.filter((m: ModelType) => m.id !== modelId);
          }
        })
      ),

      toggleModelEnabled: (providerId, modelId, enabled) => set(
        produce((state) => {
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
      updateAppearance: (settings) => set(
        produce((state) => {
          state.appearance = {
            ...state.appearance,
            ...settings
          };
        })
      ),

      // 朗读设置操作
      updateVoice: (settings) => set(
        produce((state) => {
          state.voice = {
            ...state.voice,
            ...settings
          };
        })
      ),

      // 账户操作
      updateAccount: (account) => set(
        produce((state) => {
          state.account = {
            ...state.account,
            ...account
          };
        })
      ),

      logout: () => set(
        produce((state) => {
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
export const useAccount = () => useConfigStore(state => state.account);

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
