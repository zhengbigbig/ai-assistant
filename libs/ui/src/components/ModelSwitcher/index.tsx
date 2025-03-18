import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Dropdown, Space, Typography } from 'antd';
import { DownOutlined, RobotOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Text } = Typography;

export interface ModelOption {
  /**
   * 模型唯一标识
   */
  key: string;
  /**
   * 模型名称
   */
  name: string;
  /**
   * 模型图标
   */
  icon?: React.ReactNode;
  /**
   * 模型描述
   */
  description?: string;
  /**
   * 是否禁用
   */
  disabled?: boolean;
}

export interface ModelSwitcherProps {
  /**
   * 模型选项列表
   */
  models: ModelOption[];
  /**
   * 当前选中的模型key
   */
  value?: string;
  /**
   * 模型切换回调
   */
  onChange?: (modelKey: string) => void;
  /**
   * 按钮大小
   */
  size?: 'small' | 'middle' | 'large';
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
  /**
   * 下拉菜单宽度
   */
  dropdownWidth?: number;
}

const StyledButton = styled(Button)`
  display: flex;
  align-items: center;

  .anticon {
    margin-right: 4px;
  }
`;

interface ModelItemProps {
  className?: string;
  children?: React.ReactNode;
}

const ModelItem = styled.div<ModelItemProps>`
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    background-color: #f5f5f5;
  }

  &.selected {
    background-color: #e6f7ff;
  }

  .model-icon {
    margin-right: 8px;
    font-size: 16px;
  }

  .model-info {
    display: flex;
    flex-direction: column;
  }

  .model-name {
    font-weight: 500;
  }

  .model-description {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
  }
`;

/**
 * ModelSwitcher组件 - 用于切换AI模型
 *
 * @param props - 组件属性
 * @returns React组件
 *
 * @example
 * ```tsx
 * const models = [
 *   { key: 'gpt-4', name: 'GPT-4', description: '最强大的模型' },
 *   { key: 'gpt-3.5', name: 'GPT-3.5', description: '平衡性能与速度' },
 * ];
 *
 * <ModelSwitcher
 *   models={models}
 *   value="gpt-4"
 *   onChange={(key) => console.log('选择模型:', key)}
 * />
 * ```
 */
export const ModelSwitcher: React.FC<ModelSwitcherProps> = ({
  models,
  value,
  onChange,
  size = 'middle',
  className,
  style,
  dropdownWidth = 240,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(value || (models.length > 0 ? models[0].key : ''));

  const handleModelSelect = (modelKey: string) => {
    setSelectedModel(modelKey);
    onChange?.(modelKey);
  };

  const currentModel = models.find(model => model.key === selectedModel) || models[0];

  const items: MenuProps['items'] = models.map(model => ({
    key: model.key,
    disabled: model.disabled,
    label: (
      <ModelItem className={model.key === selectedModel ? 'selected' : ''}>
        <div className="model-icon">
          {model.icon || <RobotOutlined />}
        </div>
        <div className="model-info">
          <Text className="model-name">{model.name}</Text>
          {model.description && (
            <Text className="model-description">{model.description}</Text>
          )}
        </div>
      </ModelItem>
    ),
  }));

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => handleModelSelect(key),
        selectedKeys: [selectedModel],
      }}
      trigger={['click']}
      placement="bottomRight"
      dropdownRender={(menu) => (
        <div style={{ width: dropdownWidth }}>
          {menu}
        </div>
      )}
    >
      <StyledButton
        type="default"
        size={size}
        className={className}
        style={style}
      >
        <Space>
          {currentModel?.icon || <RobotOutlined />}
          {currentModel?.name || '选择模型'}
          <DownOutlined />
        </Space>
      </StyledButton>
    </Dropdown>
  );
};

export default ModelSwitcher;
