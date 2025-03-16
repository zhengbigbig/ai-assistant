import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'AI Assistant',
    description: 'AI助手浏览器插件',
    version: '0.1.0',
    permissions: ['storage', 'tabs'],
  },
  srcDir: 'src',
  outDir: 'dist',
  entrypointsDir: 'entrypoints',
});
