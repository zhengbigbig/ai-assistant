import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'AI Assistant',
    description: 'AI 助手浏览器插件，支持划词搜索、页面截图等功能',
    version: '0.1.0',
    action: {
      default_title: 'AI 助手 - 打开侧边栏'
    },
    side_panel: {
      default_path: 'entrypoints/sidepanel/index.html',
    },
    options_ui: {
      page: 'entrypoints/options/index.html',
      open_in_tab: true
    },
    permissions: [
      'sidePanel',
      'contextMenus',
      'activeTab',
      'scripting',
      'storage'
    ],
    commands: {
      'toggle-sidepanel': {
        suggested_key: {
          default: 'Alt+A'
        },
        description: '打开 AI Assistant 侧边栏'
      },
      'capture-screenshot': {
        suggested_key: {
          default: 'Alt+S'
        },
        description: '截取页面截图并添加到输入框'
      }
    }
  }
});
