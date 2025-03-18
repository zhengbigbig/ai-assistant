---
title: MentionModel 提及模型
group:
  title: 浏览器插件
  order: 2
---

# MentionModel 提及模型

用于在文本中提及AI模型的组件，提供下拉选择不同的模型。

## 基础用法

```tsx
import React, { useState } from 'react';
import { MentionModel } from '@ai-assistant/ui';
import { RobotOutlined, ThunderboltOutlined, ExperimentOutlined } from '@ant-design/icons';

export default () => {
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  
  const models = [
    { 
      key: 'gpt-4', 
      name: 'GPT-4', 
      icon: <ThunderboltOutlined />, 
      description: '最强大的模型' 
    },
    { 
      key: 'gpt-3.5', 
      name: 'GPT-3.5', 
      icon: <RobotOutlined />, 
      description: '平衡性能与速度' 
    },
    { 
      key: 'claude', 
      name: 'Claude', 
      icon: <ExperimentOutlined />, 
      description: '擅长长文本理解' 
    },
  ];
  
  return (
    <MentionModel 
      models={models} 
      value={selectedModel}
      onChange={(key) => setSelectedModel(key)}
    />
  );
};
```

## 图标按钮模式

```tsx
import React from 'react';
import { MentionModel } from '@ai-assistant/ui';
import { RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';

export default () => {
  const models = [
    { key: 'gpt-4', name: 'GPT-4', icon: <ThunderboltOutlined /> },
    { key: 'gpt-3.5', name: 'GPT-3.5', icon: <RobotOutlined /> },
  ];
  
  return (
    <MentionModel 
      models={models} 
      iconOnly
      tooltip="选择模型"
    />
  );
};
```

## 不同按钮类型和尺寸

```tsx
import React from 'react';
import { MentionModel } from '@ai-assistant/ui';
import { RobotOutlined } from '@ant-design/icons';

export default () => {
  const models = [
    { key: 'gpt-4', name: 'GPT-4', description: '最强大的模型' },
    { key: 'gpt-3.5', name: 'GPT-3.5', description: '平衡性能与速度' },
  ];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <MentionModel models={models} size="small" />
        <MentionModel models={models} size="middle" />
        <MentionModel models={models} size="large" />
      </div>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <MentionModel models={models} type="default" />
        <MentionModel models={models} type="primary" />
        <MentionModel models={models} type="dashed" />
        <MentionModel models={models} type="link" />
        <MentionModel models={models} type="text" />
      </div>
    </div>
  );
};
```

## 带头像的模型

```tsx
import React from 'react';
import { MentionModel } from '@ai-assistant/ui';

export default () => {
  const models = [
    { 
      key: 'gpt-4', 
      name: 'GPT-4', 
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gpt4',
      description: '最强大的模型' 
    },
    { 
      key: 'gpt-3.5', 
      name: 'GPT-3.5', 
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gpt35',
      description: '平衡性能与速度' 
    },
    { 
      key: 'claude', 
      name: 'Claude', 
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=claude',
      description: '擅长长文本理解' 
    },
  ];
  
  return <MentionModel models={models} />;
};
```

## API

### MentionModel

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| models | 可用模型列表 | `ModelInfo[]` | `[]` |
| value | 当前选中的模型key | `string` | - |
| onChange | 模型选择回调 | `(modelKey: string) => void` | - |
| size | 按钮大小 | `'small' \| 'middle' \| 'large'` | `'middle'` |
| type | 按钮类型 | `'primary' \| 'default' \| 'dashed' \| 'link' \| 'text'` | `'default'` |
| iconOnly | 是否显示为图标按钮 | `boolean` | `false` |
| className | 自定义类名 | `string` | - |
| style | 自定义样式 | `CSSProperties` | - |
| dropdownWidth | 下拉菜单宽度 | `number` | `240` |
| tooltip | 提示文本 | `string` | - |

### ModelInfo

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| key | 模型唯一标识 | `string` | - |
| name | 模型名称 | `string` | - |
| icon | 模型图标 | `ReactNode` | - |
| avatar | 模型头像URL | `string` | - |
| description | 模型描述 | `string` | - |
| disabled | 是否禁用 | `boolean` | `false` | 
