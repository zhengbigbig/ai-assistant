---
title: AI Assistant UI
hero:
  title: AI Assistant UI
  description: 基于AntDesign/AntDesignX的AI助手UI组件库
  actions:
    - text: 快速开始
      link: /guide
    - text: 组件
      link: /components/SiderPanel
features:
  - title: 基于AntDesign
    emoji: 🚀
    description: 基于AntDesign和AntDesignX开发，提供丰富的UI组件
  - title: TypeScript支持
    emoji: 💪
    description: 使用TypeScript开发，提供完整的类型定义
  - title: 浏览器插件支持
    emoji: 🔌
    description: 专为浏览器插件设计的UI组件，满足AI助手的需求
---

## 安装

```bash
npm install @ai-assistant/ui
```

## 使用

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
