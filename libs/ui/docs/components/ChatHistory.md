---
title: ChatHistory 聊天历史
group:
  title: 浏览器插件
  order: 2
---

# ChatHistory 聊天历史

用于显示聊天历史记录的组件，支持选择、编辑、删除和收藏聊天记录。

## 基础用法

```tsx
import React, { useState } from 'react';
import { ChatHistory } from '@ai-assistant/ui';

export default () => {
  const [activeId, setActiveId] = useState('1');
  
  const historyItems = [
    { 
      id: '1', 
      title: '关于React的讨论', 
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) 
    },
    { 
      id: '2', 
      title: 'TypeScript类型系统', 
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) 
    },
    { 
      id: '3', 
      title: '如何优化前端性能', 
      createdAt: new Date(), 
      isFavorite: true 
    },
  ];
  
  return (
    <ChatHistory 
      items={historyItems}
      activeId={activeId}
      onSelect={(id) => {
        setActiveId(id);
        console.log('选择聊天:', id);
      }}
      onDelete={(id) => console.log('删除聊天:', id)}
      onEdit={(id) => console.log('编辑聊天:', id)}
      onToggleFavorite={(id) => console.log('收藏/取消收藏聊天:', id)}
      onNewChat={() => console.log('新建聊天')}
    />
  );
};
```

## 自定义高度和时间格式

```tsx
import React from 'react';
import { ChatHistory } from '@ai-assistant/ui';

export default () => {
  const historyItems = [
    { id: '1', title: '关于React的讨论', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { id: '2', title: 'TypeScript类型系统', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: '3', title: '如何优化前端性能', createdAt: new Date() },
  ];
  
  return (
    <ChatHistory 
      items={historyItems}
      height={300}
      timeFormat="MM-DD HH:mm"
    />
  );
};
```

## 空状态

```tsx
import React from 'react';
import { ChatHistory } from '@ai-assistant/ui';

export default () => (
  <ChatHistory 
    items={[]}
    onNewChat={() => console.log('新建聊天')}
  />
);
```

## API

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 聊天历史记录列表 | `ChatHistoryItem[]` | `[]` |
| activeId | 当前选中的聊天记录ID | `string` | - |
| onSelect | 选择聊天记录回调 | `(id: string) => void` | - |
| onDelete | 删除聊天记录回调 | `(id: string) => void` | - |
| onEdit | 编辑聊天记录回调 | `(id: string) => void` | - |
| onToggleFavorite | 收藏/取消收藏聊天记录回调 | `(id: string) => void` | - |
| onNewChat | 创建新聊天回调 | `() => void` | - |
| className | 自定义类名 | `string` | - |
| style | 自定义样式 | `CSSProperties` | - |
| height | 列表高度 | `number \| string` | `400` |
| showTime | 是否显示时间 | `boolean` | `true` |
| timeFormat | 时间格式 | `string` | `'YYYY-MM-DD HH:mm'` |

### ChatHistoryItem

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| id | 聊天记录ID | `string` | - |
| title | 聊天标题 | `string` | - |
| createdAt | 创建时间 | `string \| Date` | - |
| updatedAt | 最后更新时间 | `string \| Date` | - |
| isFavorite | 是否收藏 | `boolean` | `false` | 
