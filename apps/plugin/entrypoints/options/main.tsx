import React from 'react';
import { createRoot } from 'react-dom/client';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import '../../styles/global.css';

// 创建应用根节点
const root = createRoot(document.getElementById('root')!);

// 渲染选项页面
root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6e59f2',
          borderRadius: 8,
          fontSize: 12,
        },
      }}
      componentSize="small"
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
);
