import React from 'react';
import { createRoot } from 'react-dom/client';
import { App, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import OptionsPage from '../../components/OptionsPage';
import '../../styles/global.css';

// 创建应用根节点
const root = createRoot(document.getElementById('root')!);

// 渲染选项页面
root.render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 4,
        },
      }}
    >
      <App>
        <OptionsPage />
      </App>
    </ConfigProvider>
  </React.StrictMode>
);
