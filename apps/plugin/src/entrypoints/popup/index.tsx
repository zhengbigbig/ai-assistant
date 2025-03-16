import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from 'antd';
import styled from 'styled-components';

const PopupContainer = styled.div`
  width: 320px;
  padding: 16px;
`;

const Popup: React.FC = () => {
  return (
    <PopupContainer>
      <h1>AI Assistant</h1>
      <p>点击下方按钮打开侧边栏</p>
      <Button type="primary">打开侧边栏</Button>
    </PopupContainer>
  );
};

// 确保DOM已经加载完成
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<Popup />);
  }
});

// 默认导出
export default {};
