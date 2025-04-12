// stores/screenshotStore.ts
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { localStorageAdapter } from './storage'

interface ScreenshotState {
  // 状态
  isSelecting: boolean;
  lastScreenshot: string | null;

  // 操作方法
  startSelection: () => void;
  cancelSelection: () => void;
  finishSelection: () => void;
  finishCapture: (imageUrl: string | null) => void;
}

export const useScreenshotStore = create<ScreenshotState>()(
  persist(
    (set) => ({
      // 初始状态
      isSelecting: false,
      lastScreenshot: null,

      // 方法
      startSelection: () => set({ isSelecting: true }),
      cancelSelection: () => set({ isSelecting: false }),
      finishSelection: () => set({ isSelecting: false }),
      finishCapture: (imageUrl) => set({
        lastScreenshot: imageUrl
      }),
    }),
    {
      name: 'screenshot-storage', // 本地存储的键名
      storage: localStorageAdapter,
    }
  )
)
