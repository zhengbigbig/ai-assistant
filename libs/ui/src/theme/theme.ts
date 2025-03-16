import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

// 默认主题配置
export const defaultTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 4,
  },
  algorithm: theme.defaultAlgorithm,
};

// 暗色主题配置
export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 4,
  },
  algorithm: theme.darkAlgorithm,
};
