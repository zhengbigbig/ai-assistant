import { PersistStorage } from 'zustand/middleware';

/**
 * 创建适用于zustand persist中间件的chrome.storage适配器
 * @param storageType 存储类型，可选'sync'或'local'
 * @returns 适配器对象
 */
export const createStorageAdapter = (storageType: 'sync' | 'local' = 'sync'): PersistStorage<any> => {
  // 根据传入的类型选择存储对象
  const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;

  return {
    getItem: async <T>(name: string): Promise<T | null> => {
      return new Promise((resolve) => {
        storage.get(name, (data) => {
          resolve(data[name] || null);
        });
      });
    },
    setItem: async <T>(name: string, value: T): Promise<void> => {
      return new Promise((resolve) => {
        storage.set({ [name]: value }, () => {
          resolve();
        });
      });
    },
    removeItem: async (name: string): Promise<void> => {
      return new Promise((resolve) => {
        storage.remove(name, () => {
          resolve();
        });
      });
    },
  };
};

// 创建默认的sync存储适配器(向后兼容)
const syncStorageAdapter = createStorageAdapter('sync');

// 创建local存储适配器
export const localStorageAdapter = createStorageAdapter('local');

export default syncStorageAdapter;
