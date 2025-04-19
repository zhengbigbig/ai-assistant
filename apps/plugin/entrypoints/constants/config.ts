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

// 显示风格枚举
export enum DisplayStyle {
  UNDERLINE = 'underline',
  BACKGROUND = 'background',
  BORDER = 'border',
}
// 枚举对应文案对象
export const DISPLAY_STYLE_OPTIONS = [
  { value: DisplayStyle.UNDERLINE, label: '虚线下划线' },
  { value: DisplayStyle.BACKGROUND, label: '背景色' },
  { value: DisplayStyle.BORDER, label: '虚线边框' },
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
