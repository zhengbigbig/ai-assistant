import { StateStorage } from 'zustand/middleware';
// 创建chrome.storage适配器
const chromeStorageAdapter: StateStorage = {
  getItem: async (name) => {
    return new Promise((resolve) => {
      chrome.storage.local.get(name, (data) => {
        resolve(data[name] || null);
      });
    });
  },
  setItem: async (name, value) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [name]: value }, () => {
        resolve(true);
      });
    });
  },
  removeItem: async (name) => {
    return new Promise((resolve) => {
      chrome.storage.local.remove(name, () => {
        resolve(true);
      });
    });
  },
};

export default chromeStorageAdapter;
