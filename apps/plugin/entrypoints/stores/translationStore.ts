import { produce } from 'immer';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TRANSLATE_STORAGE_KEY } from '../constants/key';
import syncStorageAdapter from './storage';

// 定义需要翻译的文本片段接口
export interface PieceToTranslate {
  isTranslated: boolean;
  parentElement: Element | null;
  topElement: Element | null;
  bottomElement: Element | null;
  nodes: Node[];
}

// 定义需要翻译的属性接口
export interface AttributeToTranslate {
  node: Element;
  original: string;
  attrName: string;
  isTranslated?: boolean;
}

// 定义需要恢复的节点接口
export interface NodeToRestore {
  node: Node;
  original: string;
}

// 翻译状态接口
export interface TranslationState {
  // 创建上下文对象，用于在整个翻译过程中传递信息
  ctx: {
    tabUrl: string;
    tabHostName: string;
    tabUrlWithoutSearch: string;
  };

  // 页面语言状态: "original" | "translated"
  pageLanguageState: string;

  // 原始页面语言
  originalTabLanguage: string;

  // 当前页面语言
  currentPageLanguage: string;

  // 翻译状态追踪计数器
  fooCount: number;

  // 需要翻译的文本片段、属性和需要恢复的节点
  piecesToTranslate: PieceToTranslate[];
  attributesToTranslate: AttributeToTranslate[];
  nodesToRestore: NodeToRestore[];

  // 动态节点管理
  newNodes: Element[];
  removedNodes: Element[];

  // 页面可见性
  pageIsVisible: boolean;

  // 当前索引
  currentIndex: number;

  // 压缩映射
  compressionMap: Map<number, string>;

  // 初始化上下文
  initCtx: () => void;

  // 设置当前索引
  setCurrentIndex: (index: number) => void;

  // 设置压缩映射
  setCompressionMap: (map: Map<number, string>) => void;

  // 添加压缩映射
  addCompressionMap: (key: number, value: string) => void;

  // 设置页面语言状态
  setPageLanguageState: (state: string) => void;

  // 设置原始页面语言
  setOriginalTabLanguage: (language: string) => void;

  // 设置当前页面语言
  setCurrentPageLanguage: (language: string) => void;

  // 设置翻译服务
  setCurrentPageTranslatorService: (service: string) => void;

  // 增加翻译状态计数器
  incrementFooCount: () => void;

  // 设置需要翻译的文本片段
  setPiecesToTranslate: (pieces: PieceToTranslate[]) => void;

  // 添加需要翻译的文本片段
  addPieceToTranslate: (piece: PieceToTranslate) => void;

  // 更新特定片段的翻译状态
  updatePieceTranslated: (index: number, isTranslated: boolean) => void;

  // 清空需要翻译的文本片段
  clearPiecesToTranslate: () => void;

  // 设置需要翻译的属性
  setAttributesToTranslate: (attributes: AttributeToTranslate[]) => void;

  // 添加需要翻译的属性
  addAttributeToTranslate: (attribute: AttributeToTranslate) => void;

  // 更新特定属性的翻译状态
  updateAttributeTranslated: (index: number, isTranslated: boolean) => void;

  // 清空需要翻译的属性
  clearAttributesToTranslate: () => void;

  // 添加需要恢复的节点
  addNodeToRestore: (node: NodeToRestore) => void;

  // 清空需要恢复的节点
  clearNodesToRestore: () => void;

  // 添加新节点
  addNewNode: (node: Element) => void;

  // 添加被移除的节点
  addRemovedNode: (node: Element) => void;

  // 清空新节点和被移除节点
  clearNodes: () => void;

  // 设置页面可见性
  setPageIsVisible: (isVisible: boolean) => void;

  // 重置翻译状态（恢复到初始状态）
  resetTranslationState: () => void;
}

// 创建翻译状态存储
export const useTranslationStore = create<TranslationState>()(
  persist(
    (set) => ({
      // 初始状态
      ctx: {
        tabUrl: '',
        tabHostName: '',
        tabUrlWithoutSearch: '',
      },
      pageLanguageState: 'original',
      originalTabLanguage: 'und',
      currentPageLanguage: 'und',
      fooCount: 0,
      piecesToTranslate: [],
      attributesToTranslate: [],
      nodesToRestore: [],
      newNodes: [],
      removedNodes: [],
      pageIsVisible: document.visibilityState === 'visible',
      currentIndex: 0,
      compressionMap: new Map(),

      // 设置上下文对象
      initCtx: () => {
        // 发送给background获取上下文信息
        chrome.runtime.sendMessage({
          action: 'getCtx',
        }, (response) => {
          console.log('response', response);
          // 使用单独的 set 调用更新状态，而不是在异步回调中修改 draft
          set(state => ({
            ...state,
            ctx: response
          }));
        });
      },

      // 设置当前索引
      setCurrentIndex: (index: number) => set(produce((draft) => {
        draft.currentIndex = index;
      })),

      // 设置压缩映射
      setCompressionMap: (map: Map<number, string>) => set(produce((draft) => {
        draft.compressionMap = map;
      })),

      // 添加压缩映射
      addCompressionMap: (key: number, value: string) => set(produce((draft) => {
        draft.compressionMap.set(key, value);
      })),

      // 设置页面语言状态
      setPageLanguageState: (state) => set(produce((draft) => {
        draft.pageLanguageState = state;
      })),

      // 设置原始页面语言
      setOriginalTabLanguage: (language: any) => set(produce((draft) => {
        draft.originalTabLanguage = language;
      })),

      // 设置当前页面语言
      setCurrentPageLanguage: (language) => set(produce((draft) => {
        draft.currentPageLanguage = language;
      })),

      // 设置翻译服务
      setCurrentPageTranslatorService: (service) => set(produce((draft) => {
        draft.currentPageTranslatorService = service;
      })),

      // 增加翻译状态计数器
      incrementFooCount: () => set(produce((draft) => {
        draft.fooCount += 1;
      })),

      // 设置需要翻译的文本片段
      setPiecesToTranslate: (pieces) => set(produce((draft) => {
        draft.piecesToTranslate = pieces;
      })),

      // 添加需要翻译的文本片段
      addPieceToTranslate: (piece) => set(produce((draft) => {
        draft.piecesToTranslate.push(piece);
      })),

      // 更新特定片段的翻译状态
      updatePieceTranslated: (index, isTranslated) => set(produce((draft) => {
        if (draft.piecesToTranslate[index]) {
          draft.piecesToTranslate[index].isTranslated = isTranslated;
        }
      })),

      // 清空需要翻译的文本片段
      clearPiecesToTranslate: () => set(produce((draft) => {
        draft.piecesToTranslate = [];
      })),

      // 设置需要翻译的属性
      setAttributesToTranslate: (attributes) => set(produce((draft) => {
        draft.attributesToTranslate = attributes;
      })),

      // 添加需要翻译的属性
      addAttributeToTranslate: (attribute) => set(produce((draft) => {
        draft.attributesToTranslate.push(attribute);
      })),

      // 更新特定属性的翻译状态
      updateAttributeTranslated: (index, isTranslated) => set(produce((draft) => {
        if (draft.attributesToTranslate[index]) {
          draft.attributesToTranslate[index].isTranslated = isTranslated;
        }
      })),

      // 清空需要翻译的属性
      clearAttributesToTranslate: () => set(produce((draft) => {
        draft.attributesToTranslate = [];
      })),

      // 添加需要恢复的节点
      addNodeToRestore: (node) => set(produce((draft) => {
        draft.nodesToRestore.push(node);
      })),

      // 清空需要恢复的节点
      clearNodesToRestore: () => set(produce((draft) => {
        draft.nodesToRestore = [];
      })),

      // 添加新节点
      addNewNode: (node) => set(produce((draft) => {
        draft.newNodes.push(node);
      })),

      // 添加被移除的节点
      addRemovedNode: (node) => set(produce((draft) => {
        draft.removedNodes.push(node);
      })),

      // 清空新节点和被移除节点
      clearNodes: () => set(produce((draft) => {
        draft.newNodes = [];
        draft.removedNodes = [];
      })),

      // 设置页面可见性
      setPageIsVisible: (isVisible) => set(produce((draft) => {
        draft.pageIsVisible = isVisible;
      })),

      // 重置翻译状态（恢复到初始状态）
      resetTranslationState: () => set(produce((draft) => {
        draft.pageLanguageState = 'original';
        draft.currentPageLanguage = 'und';
        draft.piecesToTranslate = [];
        draft.attributesToTranslate = [];
        draft.nodesToRestore = [];
        draft.newNodes = [];
        draft.removedNodes = [];
        draft.fooCount += 1;
        draft.currentIndex = 0;
        draft.compressionMap = new Map();
      })),
    }),
    {
      name: TRANSLATE_STORAGE_KEY,
      storage: syncStorageAdapter,
      partialize: (state) => ({
        pageLanguageState: state.pageLanguageState,
        currentPageLanguage: state.currentPageLanguage,
        currentIndex: state.currentIndex,
        compressionMap: state.compressionMap,
      }),
    }
  )
);