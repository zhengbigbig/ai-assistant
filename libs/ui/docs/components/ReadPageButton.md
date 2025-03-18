---
title: ReadPageButton 阅读页面按钮
group:
  title: 浏览器插件
  order: 2
---

# ReadPageButton 阅读页面按钮

用于触发阅读当前页面内容的按钮组件。

## 基础用法

```tsx
import React from 'react';
import { ReadPageButton } from '@ai-assistant/ui';

export default () => (
  <ReadPageButton onClick={() => alert('开始阅读页面')} />
);
```

## 自定义文本和图标

```tsx
import React from 'react';
import { ReadPageButton } from '@ai-assistant/ui';
import { FileSearchOutlined } from '@ant-design/icons';

export default () => (
  <ReadPageButton 
    text="分析此页面" 
    icon={<FileSearchOutlined />}
    onClick={() => alert('开始分析页面')} 
  />
);
```

## 不同尺寸和类型

```tsx
import React from 'react';
import { ReadPageButton } from '@ai-assistant/ui';

export default () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <ReadPageButton size="small" />
    <ReadPageButton size="middle" />
    <ReadPageButton size="large" />
    
    <ReadPageButton type="default" text="默认按钮" />
    <ReadPageButton type="primary" text="主要按钮" />
    <ReadPageButton type="dashed" text="虚线按钮" />
    <ReadPageButton type="link" text="链接按钮" />
    <ReadPageButton type="text" text="文本按钮" />
  </div>
);
```

## 加载状态和禁用状态

```tsx
import React, { useState } from 'react';
import { ReadPageButton } from '@ai-assistant/ui';

export default () => {
  const [loading, setLoading] = useState(false);
  
  const handleClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('页面阅读完成');
    }, 2000);
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ReadPageButton 
        loading={loading} 
        onClick={handleClick}
        text={loading ? '正在阅读...' : '阅读此页'}
      />
      <ReadPageButton disabled text="禁用状态" />
    </div>
  );
};
```

## API

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| text | 按钮文本 | `string` | `'阅读此页'` |
| tooltip | 按钮提示文本 | `string` | `'分析并阅读当前页面内容'` |
| icon | 按钮图标 | `ReactNode` | `<ReadOutlined />` |
| type | 按钮类型 | `'primary' \| 'default' \| 'dashed' \| 'link' \| 'text'` | `'primary'` |
| size | 按钮大小 | `'small' \| 'middle' \| 'large'` | `'middle'` |
| loading | 是否加载中 | `boolean` | `false` |
| disabled | 是否禁用 | `boolean` | `false` |
| onClick | 点击回调 | `() => void` | - |
| className | 自定义类名 | `string` | - |
| style | 自定义样式 | `CSSProperties` | - | 
