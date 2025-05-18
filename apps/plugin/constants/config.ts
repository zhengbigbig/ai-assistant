import { CustomStyleConfig } from '../entrypoints/stores/configStore';
import { FREE_OPENAI_API_KEY } from './key';

// 目标语言枚举
export enum TargetLanguage {
  ZH_CN = 'zh-CN',
  EN_US = 'en-US',
  JA_JP = 'ja-JP',
  KO_KR = 'ko-KR',
  FR_FR = 'fr-FR',
  DE_DE = 'de-DE',
  RU_RU = 'ru-RU',
  ES_ES = 'es-ES',
  IT_IT = 'it-IT',
  PT_PT = 'pt-PT',
}
// 枚举对应文案对象
export const TARGET_LANGUAGE_OPTIONS = [
  { value: TargetLanguage.ZH_CN, label: '简体中文' },
  { value: TargetLanguage.EN_US, label: '英语（美国）' },
  { value: TargetLanguage.JA_JP, label: '日语' },
  { value: TargetLanguage.KO_KR, label: '韩语' },
  { value: TargetLanguage.FR_FR, label: '法语' },
  { value: TargetLanguage.DE_DE, label: '德语' },
  { value: TargetLanguage.RU_RU, label: '俄语' },
  { value: TargetLanguage.ES_ES, label: '西班牙语' },
  { value: TargetLanguage.IT_IT, label: '意大利语' },
  { value: TargetLanguage.PT_PT, label: '葡萄牙语' },
];

// 显示模式枚举
export enum DisplayMode {
  DUAL = 'dual',
  REPLACE = 'replace',
}
// 枚举对应文案对象
export const DISPLAY_MODE_OPTIONS = [
  { value: DisplayMode.DUAL, label: '双语对照' },
  { value: DisplayMode.REPLACE, label: '替换原文' },
];

// 翻译触发条件热键枚举
export enum TranslationHotkey {
  OPTION = 'option',
  COMMAND = 'command',
  SHIFT = 'shift',
}
// 枚举对应文案对象
export const TRANSLATION_HOTKEY_OPTIONS = [
  { value: TranslationHotkey.OPTION, label: '⌥ Option' },
  { value: TranslationHotkey.COMMAND, label: '⌘ Command' },
  { value: TranslationHotkey.SHIFT, label: '⇧ Shift' },
];
// 翻译节点类名
export const AI_ASSISTANT_TRANSLATED_WRAPPER =
  'ai-assistant-translated-wrapper';
export const AI_ASSISTANT_TRANSLATED_CONTAINER =
  'ai-assistant-translated-container';
export const AI_ASSISTANT_TRANSLATED = 'ai-assistant-translated';
// 自定义样式元素ID
export const CUSTOM_STYLE_ELEMENT_ID = 'ai-assistant-translated-custom-style';
// 自定义loading注入样式
export const CUSTOM_LOADING_INJECT_STYLE = 'ai-assistant-loading-icon-style'

// 添加预定义的自定义样式模板
export const DEFAULT_CUSTOM_STYLE_TEMPLATES: CustomStyleConfig[] = [
  {
    name: '虚线边框',
    css: `
.ai-assistant-translated-container {
  padding: 6px;
  border: 1px dashed #6e59f2;
}
.ai-assistant-translated {
  background-color: #faf6f5;
}
    `,
  },
  {
    name: '虚线下划线',
    css: `
.ai-assistant-translated-container {

}
.ai-assistant-translated {
  border-bottom: 1px dashed #6e59f2;
}
    `,
  },
  {
    name: '背景色',
    css: `
.ai-assistant-translated-container {

}
.ai-assistant-translated {
  background-color: #faf6f5;
}
    `,
  },

  {
    name: '学习模式',
    css: `
.ai-assistant-translated-container {

}
.ai-assistant-translated {
  filter: blur(2px);
  transition: filter 0.3s ease;
}
.ai-assistant-translated:hover {
  filter: blur(0);
}
    `,
  },
  {
    name: '透明模式',
    css: `
.ai-assistant-translated-container {

}
.ai-assistant-translated {
  opacity: 0.03;
  transition: opacity 0.3s ease;
}
.ai-assistant-translated:hover {
  opacity: 1;
}
    `,
  },
  {
    name: '马克笔',
    css: `
.ai-assistant-translated-container {

}
.ai-assistant-translated {
  background-color: #ffeb3b;
}
    `,
  },
  {
    name: '引用样式',
    css: `
.ai-assistant-translated-container {
  border-left: 4px solid #6e59f2;
  padding-left: 12px;
  margin: 8px 0;
  font-style: italic;
}
.ai-assistant-translated {

}
    `,
  },
  {
    name: '白纸阴影',
    css: `
.ai-assistant-translated-container {
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 8px;
  border-radius: 4px;
}
.ai-assistant-translated {

}
    `,
  },
  {
    name: '斜体',
    css: `
.ai-assistant-translated-container {

}
.ai-assistant-translated {
  font-style: italic;
}
    `,
  },
  {
    name: '实线下划线',
    css: `
.ai-assistant-translated-container {

}
.ai-assistant-translated {
  border-bottom: 1px solid #6e59f2;
}
    `,
  },
];

// 默认空模板
export const DEFAULT_EMPTY_TEMPLATE = `
.ai-assistant-translated-container {

}
.ai-assistant-translated {

}
.ai-assistant-translated:hover {

}
      `.trim();

// 默认openai模型
export const DEFAULT_OPENAI_MODEL_PROVIDER_CONFIG =         {
  id: 'deepseek',
  name: 'DeepSeek',
  apiKey: FREE_OPENAI_API_KEY,
  baseUrl: 'https://openrouter.ai/api/v1',
  models: [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      value: 'deepseek/deepseek-chat-v3-0324:free',
      description: '免费版本',
      enabled: true
    }
  ],
}

// 默认翻译服务提供商
export const DEFAULT_TRANSLATION_PROVIDERS = [
  {
    id: 'google',
    name: '谷歌翻译',
    apiKey: '',
    baseUrl: 'https://translate.googleapis.com/translate_a/t?anno=3&client=te&v=1.0&format=html',
    isBuiltIn: true,
  },
  {
    id: 'bing',
    name: '必应翻译',
    apiKey: '',
    baseUrl: 'https://www.bing.com/ttranslatev3?isVertical=1',
    isBuiltIn: true,
  },
  {
    id: 'deepl',
    name: 'DeepL翻译',
    apiKey: '',
    baseUrl: 'https://www.deepl.com',
    isBuiltIn: true,
  },
  {
    id: 'yandex',
    name: 'Yandex翻译',
    apiKey: '',
    baseUrl: 'https://translate.yandex.net/api/v1/tr.json/translate?srv=tr-url-widget',
    isBuiltIn: true,
  },
  {
    id: 'DeepSeek V3 Free',
    name: 'DeepSeek V3 Free',
    apiKey: FREE_OPENAI_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    isBuiltIn: false,
    model: 'deepseek/deepseek-chat-v3-0324:free',
  }
];
