import { defineConfig } from 'dumi';

export default defineConfig({
  outputPath: 'docs-dist',
  themeConfig: {
    name: 'AI Assistant UI',
    nav: [
      { title: '指南', link: '/guide' },
      { title: '组件', link: '/components' },
    ],
  },
});
