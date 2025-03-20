import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // 配置优化依赖选项
  optimizeDeps: {
    exclude: [
      // 排除可能导致问题的依赖
      'react-dom/client',
    ],
  },
});