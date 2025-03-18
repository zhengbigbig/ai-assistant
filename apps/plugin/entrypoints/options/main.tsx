import React from 'react';
import { createRoot } from 'react-dom/client';
import OptionsPage from '../../components/OptionsPage';
import '../../styles/global.css';

// 创建应用根节点
const root = createRoot(document.getElementById('root')!);

// 渲染选项页面
root.render(
  <React.StrictMode>
    <OptionsPage />
  </React.StrictMode>
);
