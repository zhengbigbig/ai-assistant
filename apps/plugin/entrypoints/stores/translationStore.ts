import { create } from 'zustand';
import { useConfigStore } from './configStore';
import { DisplayMode } from '../constants/config';

export interface ParagraphItem {
  id: string;
  element: HTMLElement;
  originalText: string;
  translatedText: string | null;
  isLoading: boolean;
  isTranslated: boolean;
  error: string | null;
}

interface TranslationState {
  // 是否正在翻译页面
  isTranslating: boolean;
  // 所有段落项
  paragraphs: ParagraphItem[];
  // 当前显示模式
  displayMode: DisplayMode;
  // 目标语言
  targetLanguage: string;

  // 设置翻译状态
  setIsTranslating: (isTranslating: boolean) => void;
  // 添加段落
  addParagraph: (paragraph: Omit<ParagraphItem, 'id'>) => void;
  // 添加多个段落
  addParagraphs: (paragraphs: Omit<ParagraphItem, 'id'>[]) => void;
  // 清空段落
  clearParagraphs: () => void;
  // 更新段落
  updateParagraph: (id: string, updates: Partial<ParagraphItem>) => void;
  // 设置段落翻译文本
  setParagraphTranslation: (id: string, translatedText: string) => void;
  // 设置段落加载状态
  setParagraphLoading: (id: string, isLoading: boolean) => void;
  // 设置段落错误
  setParagraphError: (id: string, error: string) => void;
  // 设置显示模式
  setDisplayMode: (displayMode: DisplayMode) => void;
  // 设置目标语言
  setTargetLanguage: (targetLanguage: string) => void;
}

export const useTranslationStore = create<TranslationState>()((set) => {
  // 获取配置
  const config = useConfigStore.getState();
  const configDisplayMode = config.translation.displayMode === 'dual'
    ? DisplayMode.DUAL
    : DisplayMode.REPLACE;

  return {
    isTranslating: false,
    paragraphs: [],
    displayMode: configDisplayMode,
    targetLanguage: config.translation.targetLanguage,

    setIsTranslating: (isTranslating) => set({ isTranslating }),

    addParagraph: (paragraph) => set((state) => {
      const id = `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        paragraphs: [...state.paragraphs, { ...paragraph, id }]
      };
    }),

    addParagraphs: (paragraphs) => set((state) => {
      const newParagraphs = paragraphs.map(paragraph => ({
        ...paragraph,
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      return {
        paragraphs: [...state.paragraphs, ...newParagraphs]
      };
    }),

    clearParagraphs: () => set({ paragraphs: [] }),

    updateParagraph: (id, updates) => set((state) => ({
      paragraphs: state.paragraphs.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    })),

    setParagraphTranslation: (id, translatedText) => set((state) => ({
      paragraphs: state.paragraphs.map(p =>
        p.id === id ? {
          ...p,
          translatedText,
          isLoading: false,
          isTranslated: true,
          error: null
        } : p
      )
    })),

    setParagraphLoading: (id, isLoading) => set((state) => ({
      paragraphs: state.paragraphs.map(p =>
        p.id === id ? { ...p, isLoading } : p
      )
    })),

    setParagraphError: (id, error) => set((state) => ({
      paragraphs: state.paragraphs.map(p =>
        p.id === id ? { ...p, error, isLoading: false } : p
      )
    })),

    setDisplayMode: (displayMode) => set({ displayMode }),

    setTargetLanguage: (targetLanguage) => set({ targetLanguage }),
  };
});
