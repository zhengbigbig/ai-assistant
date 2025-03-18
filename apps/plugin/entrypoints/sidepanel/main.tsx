import React from 'react';
import { createRoot } from 'react-dom/client';
import SidePanel from '../../components/SidePanel';
import '../../styles/global.css';

// 创建应用根节点
const root = createRoot(document.getElementById('root')!);

// 渲染侧边栏应用
root.render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>
);
