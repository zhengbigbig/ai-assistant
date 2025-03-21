// stores/screenshotStore.ts
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import chromeStorageAdapter from './storage'

interface ScreenshotState {
  // 替代全局变量
  isSelecting: boolean
  startX: number
  startY: number
  endX: number
  endY: number
  isDragging: boolean

  // 动作方法
  startSelection: () => void
  cancelSelection: () => void
  updateSelection: (x: number, y: number) => void
  endSelection: () => void
  resetSelection: () => void
}

export const useScreenshotStore = create<ScreenshotState>()(
  persist(
    (set) => ({
      // 初始状态
      isSelecting: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      isDragging: false,

      // 方法
      startSelection: () => set({ isSelecting: true }),
      cancelSelection: () => set({ isSelecting: false }),
      updateSelection: (x, y) => set({ endX: x, endY: y }),
      endSelection: () => set({ isSelecting: false, isDragging: false }),
      resetSelection: () => set({
        startX: 0, startY: 0, endX: 0, endY: 0, isDragging: false
      }),
    }),
    {
      name: 'screenshot-storage', // 本地存储的键名
      storage: createJSONStorage(() => chromeStorageAdapter),
    }
  )
)
