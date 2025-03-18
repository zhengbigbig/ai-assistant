---
title: SiderPanel 侧边面板
group:
  title: 浏览器插件
  order: 2
---

# SiderPanel 侧边面板

浏览器插件的侧边面板容器组件，用于展示内容。

## 基础用法

```tsx
import React from 'react';
import { SiderPanel } from '@ai-assistant/ui';

export default () => (
  <SiderPanel title="Sider面板" width={400}>
    <p>这是一个侧边面板容器，用于展示内容。</p>
    <p>你可以在这里放置任何内容，如聊天记录、设置选项等。</p>
  </SiderPanel>
);
```

## 自定义样式

```tsx
import React from 'react';
import { SiderPanel } from '@ai-assistant/ui';

export default () => (
  <SiderPanel 
    title="自定义样式" 
    width={400} 
    height={200}
    style={{ 
      backgroundColor: '#f5f5f5',
      marginBottom: '20px'
    }}
  >
    <p>这是一个自定义样式的侧边面板。</p>
    <p>你可以通过style属性自定义面板的样式。</p>
  </SiderPanel>
);
```

## 无标题面板

```tsx
import React from 'react';
import { SiderPanel } from '@ai-assistant/ui';

export default () => (
  <SiderPanel width={400}>
    <p>这是一个没有标题的侧边面板。</p>
    <p>当不需要标题时，可以不传入title属性。</p>
  </SiderPanel>
);
```

## API

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 面板标题 | `string` | - |
| children | 面板内容 | `ReactNode` | - |
| width | 面板宽度 | `number \| string` | `320` |
| height | 面板高度 | `number \| string` | `'100%'` |
| className | 自定义类名 | `string` | - |
| style | 自定义样式 | `CSSProperties` | - | 
