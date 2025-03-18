---
title: PromptSelector 提示词选择器
group:
  title: 浏览器插件
  order: 2
---

# PromptSelector 提示词选择器

用于选择提示词的组件，支持分类、搜索、添加、编辑和删除提示词。

## 基础用法

```tsx
import React, { useState } from 'react';
import { PromptSelector } from '@ai-assistant/ui';

export default () => {
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  
  const categories = [
    { id: 'code', name: '编程', color: 'blue' },
    { id: 'writing', name: '写作', color: 'green' },
    { id: 'translate', name: '翻译', color: 'orange' },
  ];
  
  const prompts = [
    { 
      id: '1', 
      title: '代码解释', 
      content: '请解释以下代码的功能和逻辑，并指出可能存在的问题和优化空间。',
      categoryId: 'code'
    },
    { 
      id: '2', 
      title: '翻译成中文', 
      content: '请将以下内容翻译成中文，保持原文的意思和语气。',
      categoryId: 'translate'
    },
    { 
      id: '3', 
      title: '写一篇博客', 
      content: '请以下面的主题写一篇博客文章，包含引言、正文和结论。',
      categoryId: 'writing'
    },
  ];
  
  return (
    <PromptSelector 
      prompts={prompts}
      categories={categories}
      activeCategoryId={activeCategoryId}
      onCategoryChange={setActiveCategoryId}
      onSelect={(prompt) => console.log('选择提示词:', prompt)}
      onAdd={() => console.log('添加提示词')}
      onEdit={(id) => console.log('编辑提示词:', id)}
      onDelete={(id) => console.log('删除提示词:', id)}
    />
  );
};
```

## 自定义高度

```tsx
import React from 'react';
import { PromptSelector } from '@ai-assistant/ui';

export default () => {
  const prompts = [
    { id: '1', title: '代码解释', content: '请解释以下代码的功能和逻辑...' },
    { id: '2', title: '翻译成中文', content: '请将以下内容翻译成中文...' },
    { id: '3', title: '写一篇博客', content: '请以下面的主题写一篇博客文章...' },
  ];
  
  return (
    <PromptSelector 
      prompts={prompts}
      height={300}
    />
  );
};
```

## 空状态

```tsx
import React from 'react';
import { PromptSelector } from '@ai-assistant/ui';

export default () => (
  <PromptSelector 
    prompts={[]}
    onAdd={() => console.log('添加提示词')}
  />
);
```

## API

### PromptSelector

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| prompts | 提示词列表 | `PromptItem[]` | `[]` |
| categories | 分类列表 | `PromptCategory[]` | `[]` |
| activeCategoryId | 当前选中的分类ID | `string` | - |
| onSelect | 选择提示词回调 | `(prompt: PromptItem) => void` | - |
| onAdd | 添加提示词回调 | `() => void` | - |
| onEdit | 编辑提示词回调 | `(id: string) => void` | - |
| onDelete | 删除提示词回调 | `(id: string) => void` | - |
| onToggleFavorite | 收藏/取消收藏提示词回调 | `(id: string) => void` | - |
| onCategoryChange | 切换分类回调 | `(categoryId: string) => void` | - |
| className | 自定义类名 | `string` | - |
| style | 自定义样式 | `CSSProperties` | - |
| height | 列表高度 | `number \| string` | `400` |

### PromptItem

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| id | 提示词ID | `string` | - |
| title | 提示词标题 | `string` | - |
| content | 提示词内容 | `string` | - |
| categoryId | 提示词分类ID | `string` | - |
| isFavorite | 是否收藏 | `boolean` | `false` |

### PromptCategory

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| id | 分类ID | `string` | - |
| name | 分类名称 | `string` | - |
| color | 分类颜色 | `string` | - | 
