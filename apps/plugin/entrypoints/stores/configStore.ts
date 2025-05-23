import { produce } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_CUSTOM_STYLE_TEMPLATES,
  DEFAULT_OPENAI_MODEL_PROVIDER_CONFIG,
  DEFAULT_TRANSLATION_PROVIDERS,
  DisplayMode,
  TargetLanguage,
  TranslationHotkey,
} from '../../constants/config';
import { CONFIG_STORAGE_KEY } from '../../constants/key';
import syncStorageAdapter from './storage';

// 定义模型类型接口
export interface ModelType {
  name: string;
  enabled?: boolean;
}

// 服务提供商接口
export interface ProviderType {
  name: string;
  logo?: string;
  apiKey: string;
  baseUrl: string;
  models: ModelType[];
}

// 翻译服务商接口类型
export interface TranslationProviderType {
  id: string;
  name: string;
  apiKey?: string;
  baseUrl: string;
  model?: string;
  isBuiltIn: boolean;
  systemPrompt?: string;
  headers?: Record<string, string>;
}

// 外观设置接口
export interface AppearanceSettings {
  displayMode: 'auto' | 'light' | 'dark';
  language: string;
  fontSize: number;
}

// 自定义样式配置接口
export interface CustomStyleConfig {
  name: string;
  css: string;
}

// 翻译设置接口
export interface TranslationSettings {
  targetLanguage: string;
  displayMode: 'dual' | 'replace';
  translationService: string;
  // 选中样式
  displayStyle: string;
  // 样式详情列表
  customStyles: CustomStyleConfig[];
  forbiddenWebsites: string[];
  alwaysTranslateWebsites: string[];
  enableVideoSubtitleTranslation: boolean;
  enableInputTranslation: boolean;
  enableHoverTranslation: boolean;
  hoverHotkey: string;
  hoverTranslationService: string;
  customDictionary: Record<string, string>;
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

// 键盘快捷键设置接口
export interface KeyboardShortcutsSettings {
  enableKeyboardShortcuts: boolean;
  shortcutSendMessage: string; // 发送消息
  shortcutOpenSidebar: string; // 打开侧边栏
  shortcutStartNewChat: string; // 开始新聊天
  shortcutQuickQuery: string; // 打开快速查询
  shortcutTranslatePage: string; // 翻译页面
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

  // 翻译服务提供商
  translationProviders: TranslationProviderType[];

  // 外观设置
  appearance: AppearanceSettings;

  // 朗读设置
  voice: VoiceSettings;

  // 侧边栏设置
  sidebar: SidebarSettings;

  // 划词功能设置
  textSelection: TextSelectionSettings;

  // 键盘快捷键设置
  keyboardShortcuts: KeyboardShortcutsSettings;

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

  // 外观设置操作
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;

  // 朗读设置操作
  updateVoice: (settings: Partial<VoiceSettings>) => void;

  // 侧边栏设置操作
  updateSidebar: (settings: Partial<SidebarSettings>) => void;

  // 划词功能设置操作
  updateTextSelection: (settings: Partial<TextSelectionSettings>) => void;

  // 键盘快捷键设置操作
  updateKeyboardShortcuts: (
    settings: Partial<KeyboardShortcutsSettings>
  ) => void;

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

  // 自定义词典操作
  addCustomDictionaryEntry: (key: string, value: string) => void;
  removeCustomDictionaryEntry: (key: string) => void;
  clearCustomDictionary: () => void;

  // 自定义样式操作
  addCustomStyle: (style: CustomStyleConfig, addToFront?: boolean) => void;
  updateCustomStyle: (
    name: string,
    updates: Partial<CustomStyleConfig>
  ) => void;
  removeCustomStyle: (name: string) => void;
  resetAllCustomStyles: () => void;

  // 翻译提供商操作
  addTranslationProvider: (provider: TranslationProviderType) => void;
  updateTranslationProvider: (
    id: string,
    updates: Partial<TranslationProviderType>
  ) => void;
  removeTranslationProvider: (id: string) => void;
}

// 创建持久化的zustand store
export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      // 初始状态
      providers: [DEFAULT_OPENAI_MODEL_PROVIDER_CONFIG],

      // 翻译服务提供商初始化
      translationProviders: DEFAULT_TRANSLATION_PROVIDERS,

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
        forbiddenWebsites: [
          'baidu.com',
          'gitlab.com',
          'bitbucket.org',
          'stackoverflow.com',
          'github.dev',
          'codepen.io',
          'codesandbox.io',
          'replit.com',
          'jsfiddle.net',
        ],
      },

      // 键盘快捷键设置默认值
      keyboardShortcuts: {
        enableKeyboardShortcuts: true,
        shortcutSendMessage: 'Enter',
        shortcutOpenSidebar: 'Ctrl+S',
        shortcutStartNewChat: '⌘+⇧+O',
        shortcutQuickQuery: '⌘+J',
        shortcutTranslatePage: '⌥+A',
      },

      // 提示词设置默认值
      promptWords: {
        enablePromptSuggestions: true,
        showPromptShortcuts: true,
        promptWords: [
          {
            id: '1',
            name: '翻译成中文',
            content: '翻译以下内容到中文',
            category: '翻译',
            order: 0,
            scenes: ['聊天/提问', '阅读'],
          },
          {
            id: '2',
            name: '内容总结',
            content: '总结以下内容的要点',
            category: '总结',
            order: 1,
            scenes: ['聊天/提问', '阅读'],
          },
          {
            id: '3',
            name: '改善写作',
            content: '改善以下写作',
            category: '改善写作',
            order: 2,
            scenes: ['写作'],
          },
          {
            id: '4',
            name: '语法纠正',
            content: '纠正语法错误',
            category: '纠正语法',
            order: 3,
            scenes: ['写作'],
          },
          {
            id: '5',
            name: '问题回答',
            content: '回答此问题',
            category: '回答此问题',
            order: 4,
            scenes: ['聊天/提问'],
          },
          {
            id: '6',
            name: '代码解释',
            content: '解释代码',
            category: '解释代码',
            order: 5,
            scenes: ['聊天/提问', '阅读'],
          },
          {
            id: '7',
            name: '行动事项',
            content: '列出行动事项',
            category: '列出行动事项',
            order: 6,
            scenes: ['阅读'],
          },
          {
            id: '8',
            name: '内容精简',
            content: '压缩长度',
            category: '压缩长度',
            order: 7,
            scenes: ['写作'],
          },
          {
            id: '9',
            name: '内容扩展',
            content: '扩展长度',
            category: '扩展长度',
            order: 8,
            scenes: ['写作'],
          },
        ],
      },

      // 翻译设置默认值
      translation: {
        targetLanguage: TargetLanguage.ZH_CN,
        displayMode: DisplayMode.DUAL,
        translationService: 'google',
        displayStyle: DEFAULT_CUSTOM_STYLE_TEMPLATES[0].name,
        customStyles: DEFAULT_CUSTOM_STYLE_TEMPLATES,
        forbiddenWebsites: [
          'github.com',
          'gitlab.com',
          'bitbucket.org',
          'stackoverflow.com',
          'github.dev',
          'codepen.io',
          'codesandbox.io',
          'replit.com',
          'jsfiddle.net',
        ],
        alwaysTranslateWebsites: [],
        enableVideoSubtitleTranslation: true,
        enableInputTranslation: false,
        enableHoverTranslation: true,
        hoverHotkey: TranslationHotkey.OPTION,
        hoverTranslationService: 'google',
        customDictionary: {},
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
        chatLanguage: 'zh-CN',
      },

      // 账户信息 - 默认为null
      account: null,

      // 提供商操作
      addProvider: (provider: ProviderType) =>
        set(
          produce((state: ConfigState) => {
            state.providers.push(provider);
          })
        ),

      updateProvider: (id: string, updates: Partial<ProviderType>) =>
        set(
          produce((state: ConfigState) => {
            const providerIndex = state.providers.findIndex(
              (p: ProviderType) => p.name === id
            );
            if (providerIndex !== -1) {
              state.providers[providerIndex] = {
                ...state.providers[providerIndex],
                ...updates,
              };
            }
          })
        ),

      removeProvider: (id: string) =>
        set(
          produce((state: ConfigState) => {
            state.providers = state.providers.filter(
              (p: ProviderType) => p.name !== id
            );
          })
        ),

      // 外观设置操作
      updateAppearance: (settings: Partial<AppearanceSettings>) =>
        set(
          produce((state: ConfigState) => {
            state.appearance = {
              ...state.appearance,
              ...settings,
            };
          })
        ),

      // 朗读设置操作
      updateVoice: (settings: Partial<VoiceSettings>) =>
        set(
          produce((state: ConfigState) => {
            state.voice = {
              ...state.voice,
              ...settings,
            };
          })
        ),

      // 侧边栏设置操作
      updateSidebar: (settings: Partial<SidebarSettings>) =>
        set(
          produce((state: ConfigState) => {
            state.sidebar = {
              ...state.sidebar,
              ...settings,
            };
          })
        ),

      // 划词功能设置操作
      updateTextSelection: (settings: Partial<TextSelectionSettings>) =>
        set(
          produce((state: ConfigState) => {
            state.textSelection = {
              ...state.textSelection,
              ...settings,
            };
          })
        ),

      // 键盘快捷键设置操作
      updateKeyboardShortcuts: (settings: Partial<KeyboardShortcutsSettings>) =>
        set(
          produce((state: ConfigState) => {
            const oldShortcutTranslatePage =
              state.keyboardShortcuts.shortcutTranslatePage;
            state.keyboardShortcuts = {
              ...state.keyboardShortcuts,
              ...settings,
            };

            // 检查翻译页面快捷键是否发生变化
            if (
              settings.shortcutTranslatePage &&
              settings.shortcutTranslatePage !== oldShortcutTranslatePage
            ) {
              try {
                // 通知背景脚本更新菜单
                chrome.runtime.sendMessage({
                  action: 'configChanged',
                  change: 'shortcutTranslatePage',
                  value: settings.shortcutTranslatePage,
                });
              } catch (e) {
                console.error('通知背景脚本更新菜单失败:', e);
              }
            }
          })
        ),

      // 提示词操作
      updatePromptWords: (settings: Partial<PromptWordsSettings>) =>
        set(
          produce((state: ConfigState) => {
            state.promptWords = {
              ...state.promptWords,
              ...settings,
            };
          })
        ),

      addPromptWord: (promptWord: Omit<PromptWordItem, 'id' | 'order'>) =>
        set(
          produce((state: ConfigState) => {
            const newId = Date.now().toString();
            const maxOrder =
              state.promptWords.promptWords.length > 0
                ? Math.max(
                    ...state.promptWords.promptWords.map(
                      (p: PromptWordItem) => p.order
                    )
                  )
                : -1;

            state.promptWords.promptWords.push({
              ...promptWord,
              id: newId,
              order: maxOrder + 1,
            });
          })
        ),

      updatePromptWord: (id: string, updates: Partial<PromptWordItem>) =>
        set(
          produce((state: ConfigState) => {
            const index = state.promptWords.promptWords.findIndex(
              (p: PromptWordItem) => p.id === id
            );
            if (index !== -1) {
              state.promptWords.promptWords[index] = {
                ...state.promptWords.promptWords[index],
                ...updates,
              };
            }
          })
        ),

      removePromptWord: (id: string) =>
        set(
          produce((state: ConfigState) => {
            state.promptWords.promptWords =
              state.promptWords.promptWords.filter(
                (p: PromptWordItem) => p.id !== id
              );
          })
        ),

      reorderPromptWords: (promptWords: PromptWordItem[]) =>
        set(
          produce((state: ConfigState) => {
            state.promptWords.promptWords = promptWords;
          })
        ),

      // 翻译设置操作
      updateTranslation: (settings: Partial<TranslationSettings>) =>
        set(
          produce((state: ConfigState) => {
            const oldTargetLanguage = state.translation.targetLanguage;
            state.translation = {
              ...state.translation,
              ...settings,
            };

            // 检查目标语言是否发生变化
            if (
              settings.targetLanguage &&
              settings.targetLanguage !== oldTargetLanguage
            ) {
              try {
                // 通知背景脚本更新菜单
                chrome.runtime.sendMessage({
                  action: 'configChanged',
                  change: 'targetLanguage',
                  value: settings.targetLanguage,
                });
              } catch (e) {
                console.error('通知背景脚本更新菜单失败:', e);
              }
            }
          })
        ),

      // 网页助手设置操作
      updateWebHelper: (settings: Partial<WebHelperSettings>) =>
        set(
          produce((state: ConfigState) => {
            state.webHelper = {
              ...state.webHelper,
              ...settings,
            };
          })
        ),

      // 账户操作
      updateAccount: (account: Partial<AccountInfo>) =>
        set(
          produce((state: ConfigState) => {
            state.account = {
              ...state.account,
              ...account,
            } as AccountInfo;
          })
        ),

      logout: () =>
        set(
          produce((state: ConfigState) => {
            state.account = null;
          })
        ),

      // 自定义词典操作
      addCustomDictionaryEntry: (key: string, value: string) => {
        if (!key.trim()) return;

        set(
          produce((state) => {
            // 确保customDictionary已初始化
            if (!state.translation.customDictionary) {
              state.translation.customDictionary = {};
            }

            // 添加或更新条目
            state.translation.customDictionary[key.trim()] = value.trim();
          })
        );
      },

      removeCustomDictionaryEntry: (key: string) => {
        set(
          produce((state) => {
            if (
              state.translation.customDictionary &&
              key in state.translation.customDictionary
            ) {
              delete state.translation.customDictionary[key];
            }
          })
        );
      },

      clearCustomDictionary: () => {
        set(
          produce((state) => {
            state.translation.customDictionary = {};
          })
        );
      },

      // 自定义样式操作
      addCustomStyle: (style: CustomStyleConfig, addToFront?: boolean) =>
        set(
          produce((state: ConfigState) => {
            if (addToFront) {
              // 添加到数组最前面
              state.translation.customStyles.unshift(style);
            } else {
              // 添加到数组末尾
              state.translation.customStyles.push(style);
            }
          })
        ),

      updateCustomStyle: (name: string, updates: Partial<CustomStyleConfig>) =>
        set(
          produce((state: ConfigState) => {
            const styleIndex = state.translation.customStyles.findIndex(
              (s) => s.name === name
            );
            if (styleIndex !== -1) {
              state.translation.customStyles[styleIndex] = {
                ...state.translation.customStyles[styleIndex],
                ...updates,
              };
            }
          })
        ),

      removeCustomStyle: (name: string) =>
        set(
          produce((state: ConfigState) => {
            state.translation.customStyles =
              state.translation.customStyles.filter((s) => s.name !== name);
            state.translation.displayStyle =
              state.translation.customStyles[0].name;
          })
        ),

      resetAllCustomStyles: () =>
        set(
          produce((state: ConfigState) => {
            state.translation.customStyles = DEFAULT_CUSTOM_STYLE_TEMPLATES;
          })
        ),

      // 翻译提供商操作
      addTranslationProvider: (provider: TranslationProviderType) =>
        set(
          produce((state: ConfigState) => {
            state.translationProviders.push(provider);
          })
        ),

      updateTranslationProvider: (
        id: string,
        updates: Partial<TranslationProviderType>
      ) =>
        set(
          produce((state: ConfigState) => {
            const providerIndex = state.translationProviders.findIndex(
              (p: TranslationProviderType) => p.id === id
            );
            if (providerIndex !== -1) {
              state.translationProviders[providerIndex] = {
                ...state.translationProviders[providerIndex],
                ...updates,
              };
            }
          })
        ),

      removeTranslationProvider: (id: string) =>
        set(
          produce((state: ConfigState) => {
            state.translationProviders = state.translationProviders.filter(
              (p: TranslationProviderType) => p.id !== id
            );
          })
        ),
    }),
    {
      name: CONFIG_STORAGE_KEY,
      storage: syncStorageAdapter,
    }
  )
);

// 导出便捷的钩子函数，用于获取特定配置
export const useProviders = () => useConfigStore((state) => state.providers);
export const useTranslationProviders = () =>
  useConfigStore((state) => state.translationProviders);

export const useAppearance = () => useConfigStore((state) => state.appearance);
export const useVoice = () => useConfigStore((state) => state.voice);
export const useSidebar = () => useConfigStore((state) => state.sidebar);
export const useTextSelection = () =>
  useConfigStore((state) => state.textSelection);
export const useAccount = () => useConfigStore((state) => state.account);
export const usePromptWords = () =>
  useConfigStore((state) => state.promptWords);
export const useTranslation = () =>
  useConfigStore((state) => state.translation);
export const useWebHelper = () => useConfigStore((state) => state.webHelper);
export const useKeyboardShortcuts = () =>
  useConfigStore((state) => state.keyboardShortcuts);
