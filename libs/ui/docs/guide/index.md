---
title: 快速开始
order: 1
nav:
  title: 指南
  order: 1
---

# 快速开始

AI Assistant UI 是一个基于 AntDesign 和 AntDesignX 的 React 组件库，专为 AI 助手应用设计，特别适用于浏览器插件开发。

## 安装

使用 npm 安装：

```bash
npm install @ai-assistant/ui
```

或者使用 yarn：

```bash
yarn add @ai-assistant/ui
```

## 基本使用

```tsx
import React from 'react';
import { SiderPanel, ModelSwitcher, ReadPageButton } from '@ai-assistant/ui';

export default () => (
  <SiderPanel title="AI助手">
    <div style={{ marginBottom: '16px' }}>
      <ModelSwitcher 
        models={[
          { key: 'gpt-4', name: 'GPT-4', description: '最强大的模型' },
          { key: 'gpt-3.5', name: 'GPT-3.5', description: '平衡性能与速度' },
        ]} 
      />
    </div>
    <ReadPageButton onClick={() => console.log('阅读页面')} />
  </SiderPanel>
);
```

## 组件概览

AI Assistant UI 提供了以下组件：

### 浏览器插件组件

- **SiderPanel**: 浏览器插件的侧边面板容器
- **ModelSwitcher**: 切换AI模型的下拉选择器
- **ReadPageButton**: 阅读当前页面的按钮
- **ChatControl**: 控制聊天功能的组件
- **ChatHistory**: 显示聊天历史记录的组件
- **PromptSelector**: 选择提示词的组件
- **MentionModel**: 在文本中提及模型的组件

## 与 AntDesignX 集成

AI Assistant UI 可以与 AntDesignX 无缝集成，使用 AntDesignX 提供的 AI 组件：

```tsx
import React from 'react';
import { SiderPanel } from '@ai-assistant/ui';
import { Bubble, Sender } from '@ant-design/x';

export default () => (
  <SiderPanel title="AI助手">
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Bubble 
          type="ai" 
          content="你好，我是AI助手，有什么可以帮助你的？" 
        />
        <Bubble 
          type="user" 
          content="请帮我解释React Hooks的原理" 
        />
        <Bubble 
          type="ai" 
          content="React Hooks是React 16.8引入的新特性，它允许你在不编写class的情况下使用state以及其他的React特性..." 
        />
      </div>
      <div style={{ marginTop: '16px' }}>
        <Sender 
          onSend={(value) => console.log('发送消息:', value)} 
          placeholder="输入消息..." 
        />
      </div>
    </div>
  </SiderPanel>
);
```

## 浏览器插件开发

在浏览器插件开发中使用 AI Assistant UI：

```tsx
import React, { useState } from 'react';
import { 
  SiderPanel, 
  ModelSwitcher, 
  ReadPageButton, 
  ChatControl, 
  ChatHistory 
} from '@ai-assistant/ui';
import { Bubble, Sender } from '@ant-design/x';

export default () => {
  const [messages, setMessages] = useState([
    { type: 'ai', content: '你好，我是AI助手，有什么可以帮助你的？' }
  ]);
  
  const handleSend = (value) => {
    // 添加用户消息
    setMessages([...messages, { type: 'user', content: value }]);
    
    // 模拟AI回复
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: `我收到了你的消息: "${value}"` 
      }]);
    }, 1000);
  };
  
  return (
    <SiderPanel title="AI助手" width={320} height="100vh">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <ModelSwitcher 
            models={[
              { key: 'gpt-4', name: 'GPT-4' },
              { key: 'gpt-3.5', name: 'GPT-3.5' },
            ]} 
            size="small"
          />
          <ReadPageButton size="small" />
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', marginBottom: '16px' }}>
          {messages.map((msg, index) => (
            <Bubble 
              key={index}
              type={msg.type} 
              content={msg.content} 
            />
          ))}
        </div>
        
        <div>
          <Sender 
            onSend={handleSend} 
            placeholder="输入消息..." 
          />
        </div>
        
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <ChatControl 
            options={[
              { key: 'clear', label: '清空聊天', onClick: () => setMessages([]) },
            ]}
            size="small"
          />
        </div>
      </div>
    </SiderPanel>
  );
}; 
