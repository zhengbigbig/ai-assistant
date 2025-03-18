import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Dropdown, Space, Typography, Avatar, Tooltip } from 'antd';
import {
  RobotOutlined,
  UserOutlined,
  PlusOutlined,
  DownOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Text } = Typography;

export interface ModelInfo {
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
   * 模型头像URL
   */
  avatar?: string;
  /**
   * 模型描述
   */
  description?: string;
  /**
   * 是否禁用
   */
  disabled?: boolean;
}

export interface MentionModelProps {
  /**
   * 可用模型列表
   */
  models: ModelInfo[];
  /**
   * 当前选中的模型key
   */
  value?: string;
  /**
   * 模型选择回调
   */
  onChange?: (modelKey: string) => void;
  /**
   * 按钮大小
   */
  size?: 'small' | 'middle' | 'large';
  /**
   * 按钮类型
   */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  /**
   * 是否显示为图标按钮
   */
  iconOnly?: boolean;
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
  /**
   * 提示文本
   */
  tooltip?: string;
}

interface StyledButtonProps {
  $iconOnly?: boolean;
}

const StyledButton = styled(Button)<StyledButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  ${props => props.$iconOnly && `
    width: 32px;
    padding: 0;
  `}
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

  .model-avatar {
    margin-right: 8px;
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
 * MentionModel组件 - 用于在文本中提及模型
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
 * <MentionModel
 *   models={models}
 *   value="gpt-4"
 *   onChange={(key) => console.log('选择模型:', key)}
 * />
 * ```
 */
export const MentionModel: React.FC<MentionModelProps> = ({
  models,
  value,
  onChange,
  size = 'middle',
  type = 'default',
  iconOnly = false,
  className,
  style,
  dropdownWidth = 240,
  tooltip,
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
        <Avatar
          className="model-avatar"
          size="small"
          icon={model.icon || <RobotOutlined />}
          src={model.avatar}
        />
        <div className="model-info">
          <Text className="model-name">{model.name}</Text>
          {model.description && (
            <Text className="model-description">{model.description}</Text>
          )}
        </div>
      </ModelItem>
    ),
  }));

  const button = (
    <StyledButton
      type={type}
      size={size}
      className={className}
      style={style}
      $iconOnly={iconOnly}
    >
      {iconOnly ? (
        currentModel?.icon || <RobotOutlined />
      ) : (
        <Space>
          {currentModel?.icon || <RobotOutlined />}
          {currentModel?.name || '选择模型'}
          <DownOutlined />
        </Space>
      )}
    </StyledButton>
  );

  const dropdownButton = (
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
      {button}
    </Dropdown>
  );

  return tooltip ? (
    <Tooltip title={tooltip}>
      {dropdownButton}
    </Tooltip>
  ) : dropdownButton;
};

export default MentionModel;
