import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';
import { createRoot } from 'react-dom/client';
import SidePanel from '.';
import '../../styles/global.css';

// 创建应用根节点
const root = createRoot(document.getElementById('root')!);

// 渲染侧边栏应用
root.render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
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
      <SidePanel />
    </ConfigProvider>
  </React.StrictMode>
);
