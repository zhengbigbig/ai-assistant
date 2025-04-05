// stores/screenshotStore.ts
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import chromeStorageAdapter from './storage'

interface ScreenshotState {
  // 替代全局变量
  isSelecting: boolean
  // 动作方法
  cancelSelection: () => void
}

export const useScreenshotStore = create<ScreenshotState>()(
  persist(
    (set) => ({
      // 初始状态
      isSelecting: false,

      // 方法
      cancelSelection: () => set({ isSelecting: false }),
    }),
    {
      name: 'screenshot-storage', // 本地存储的键名
      storage: createJSONStorage(() => chromeStorageAdapter),
    }
  )
)
