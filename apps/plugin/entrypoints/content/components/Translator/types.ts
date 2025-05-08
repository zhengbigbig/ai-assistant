// 定义翻译文本项接口
export interface TranslationTextItem {
  text: string;
  nodeId: number;
}

// 特殊网站规则接口
export interface SpecialRule {
  name?: string;
  hostname?: string | string[];
  regex?: string | string[];
  selectors?: string | string[];
  containerSelectors?: string | string[];
  noTranslateSelectors?: string | string[];
  detectLanguage?: boolean;
  blockElements?: string[];
  iframeContainer?: string;
  style?: string;
  brToParagraph?: boolean;
}
