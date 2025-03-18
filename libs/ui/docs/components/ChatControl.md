---
title: ChatControl 聊天控制
group:
  title: 浏览器插件
  order: 2
---

# ChatControl 聊天控制

用于控制聊天功能的组件，包括开始/停止生成回复和其他控制选项。

## 基础用法

```tsx
import React, { useState } from 'react';
import { ChatControl } from '@ai-assistant/ui';

export default () => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = () => {
    setIsGenerating(true);
    // 模拟生成过程
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };
  
  const handleStop = () => {
    setIsGenerating(false);
  };
  
  return (
    <ChatControl 
      isGenerating={isGenerating}
      onGenerate={handleGenerate}
      onStop={handleStop}
    />
  );
};
```

## 带控制选项

```tsx
import React, { useState } from 'react';
import { ChatControl } from '@ai-assistant/ui';
import { 
  SettingOutlined, 
  ClearOutlined, 
  SaveOutlined,
  DownloadOutlined
} from '@ant-design/icons';

export default () => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const options = [
    { 
      key: 'settings', 
      label: '设置', 
      icon: <SettingOutlined />,
      onClick: () => alert('打开设置')
    },
    { 
      key: 'clear', 
      label: '清空聊天', 
      icon: <ClearOutlined />,
      onClick: () => alert('清空聊天')
    },
    { 
      key: 'save', 
      label: '保存聊天', 
      icon: <SaveOutlined />,
      onClick: () => alert('保存聊天')
    },
    { 
      key: 'export', 
      label: '导出聊天', 
      icon: <DownloadOutlined />,
      onClick: () => alert('导出聊天')
    },
  ];
  
  return (
    <ChatControl 
      isGenerating={isGenerating}
      onGenerate={() => setIsGenerating(true)}
      onStop={() => setIsGenerating(false)}
      options={options}
    />
  );
};
```

## 不同尺寸

```tsx
import React from 'react';
import { ChatControl } from '@ai-assistant/ui';
import { SettingOutlined, ClearOutlined } from '@ant-design/icons';

export default () => {
  const options = [
    { key: 'settings', label: '设置', icon: <SettingOutlined /> },
    { key: 'clear', label: '清空聊天', icon: <ClearOutlined /> },
  ];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ChatControl options={options} size="small" />
      <ChatControl options={options} size="middle" />
      <ChatControl options={options} size="large" />
    </div>
  );
};
```

## API

### ChatControl

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| isGenerating | 是否正在生成回复 | `boolean` | `false` |
| onGenerate | 开始生成回复回调 | `() => void` | - |
| onStop | 停止生成回调 | `() => void` | - |
| options | 控制选项 | `ChatControlOption[]` | `[]` |
| size | 按钮大小 | `'small' \| 'middle' \| 'large'` | `'middle'` |
| className | 自定义类名 | `string` | - |
| style | 自定义样式 | `CSSProperties` | - |

### ChatControlOption

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| key | 选项唯一标识 | `string` | - |
| label | 选项标签 | `ReactNode` | - |
| icon | 选项图标 | `ReactNode` | - |
| disabled | 是否禁用 | `boolean` | `false` |
| onClick | 选项点击回调 | `() => void` | - | 
