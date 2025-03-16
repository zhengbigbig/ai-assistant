import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Input } from 'antd';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  width: 100%;
  height: 100vh;
  padding: 16px;
  display: flex;
  flex-direction: column;
`;

const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const Sidebar: React.FC = () => {
  return (
    <SidebarContainer>
      <h1>AI Assistant</h1>
      <ChatContainer>
        {/* 聊天内容 */}
      </ChatContainer>
      <InputContainer>
        <Input placeholder="输入问题..." style={{ flex: 1 }} />
        <Button type="primary">发送</Button>
      </InputContainer>
    </SidebarContainer>
  );
};

// 确保DOM已经加载完成
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<Sidebar />);
  }
});

// 默认导出
export default {};
