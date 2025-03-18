---
title: ModelSwitcher 模型切换器
group:
  title: 浏览器插件
  order: 2
---

# ModelSwitcher 模型切换器

用于切换不同的AI模型的下拉选择器组件。

## 基础用法

```tsx
import React, { useState } from 'react';
import { ModelSwitcher } from '@ai-assistant/ui';
import { RobotOutlined, ThunderboltOutlined, ExperimentOutlined } from '@ant-design/icons';

export default () => {
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  
  const models = [
    { 
      key: 'gpt-4', 
      name: 'GPT-4', 
      icon: <ThunderboltOutlined />, 
      description: '最强大的模型，适合复杂任务' 
    },
    { 
      key: 'gpt-3.5', 
      name: 'GPT-3.5', 
      icon: <RobotOutlined />, 
      description: '平衡性能与速度的模型' 
    },
    { 
      key: 'claude', 
      name: 'Claude', 
      icon: <ExperimentOutlined />, 
      description: '擅长长文本理解和创意写作' 
    },
  ];
  
  return (
    <ModelSwitcher 
      models={models} 
      value={selectedModel}
      onChange={(key) => setSelectedModel(key)}
    />
  );
};
```

## 不同尺寸

```tsx
import React from 'react';
import { ModelSwitcher } from '@ai-assistant/ui';
import { RobotOutlined } from '@ant-design/icons';

export default () => {
  const models = [
    { key: 'gpt-4', name: 'GPT-4', description: '最强大的模型' },
    { key: 'gpt-3.5', name: 'GPT-3.5', description: '平衡性能与速度' },
  ];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ModelSwitcher models={models} size="small" />
      <ModelSwitcher models={models} size="middle" />
      <ModelSwitcher models={models} size="large" />
    </div>
  );
};
```

## 禁用选项

```tsx
import React from 'react';
import { ModelSwitcher } from '@ai-assistant/ui';

export default () => {
  const models = [
    { key: 'gpt-4', name: 'GPT-4', description: '最强大的模型' },
    { key: 'gpt-3.5', name: 'GPT-3.5', description: '平衡性能与速度' },
    { key: 'claude', name: 'Claude', description: '需要订阅后使用', disabled: true },
  ];
  
  return <ModelSwitcher models={models} />;
};
```

## API

### ModelSwitcher

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| models | 模型选项列表 | `ModelOption[]` | `[]` |
| value | 当前选中的模型key | `string` | - |
| onChange | 模型切换回调 | `(modelKey: string) => void` | - |
| size | 按钮大小 | `'small' \| 'middle' \| 'large'` | `'middle'` |
| className | 自定义类名 | `string` | - |
| style | 自定义样式 | `CSSProperties` | - |
| dropdownWidth | 下拉菜单宽度 | `number` | `240` |

### ModelOption

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| key | 模型唯一标识 | `string` | - |
| name | 模型名称 | `string` | - |
| icon | 模型图标 | `ReactNode` | - |
| description | 模型描述 | `string` | - |
| disabled | 是否禁用 | `boolean` | `false` | 
