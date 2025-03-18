import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Dropdown, Space, Tooltip } from 'antd';
import {
  CommentOutlined,
  SettingOutlined,
  SendOutlined,
  StopOutlined,
  DownOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

export interface ChatControlOption {
  /**
   * 选项唯一标识
   */
  key: string;
  /**
   * 选项标签
   */
  label: React.ReactNode;
  /**
   * 选项图标
   */
  icon?: React.ReactNode;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 选项点击回调
   */
  onClick?: () => void;
}

export interface ChatControlProps {
  /**
   * 是否正在生成回复
   */
  isGenerating?: boolean;
  /**
   * 开始生成回复回调
   */
  onGenerate?: () => void;
  /**
   * 停止生成回调
   */
  onStop?: () => void;
  /**
   * 控制选项
   */
  options?: ChatControlOption[];
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
}

interface StyledContainerProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const StyledContainer = styled.div<StyledContainerProps>`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * ChatControl组件 - 用于控制聊天功能
 *
 * @param props - 组件属性
 * @returns React组件
 *
 * @example
 * ```tsx
 * const options = [
 *   { key: 'settings', label: '设置', icon: <SettingOutlined /> },
 *   { key: 'clear', label: '清空聊天', icon: <ClearOutlined /> },
 * ];
 *
 * <ChatControl
 *   isGenerating={false}
 *   onGenerate={() => console.log('开始生成')}
 *   onStop={() => console.log('停止生成')}
 *   options={options}
 * />
 * ```
 */
export const ChatControl: React.FC<ChatControlProps> = ({
  isGenerating = false,
  onGenerate,
  onStop,
  options = [],
  size = 'middle',
  className,
  style,
}) => {
  const handleActionClick = () => {
    if (isGenerating) {
      onStop?.();
    } else {
      onGenerate?.();
    }
  };

  const items: MenuProps['items'] = options.map(option => ({
    key: option.key,
    disabled: option.disabled,
    label: (
      <Space>
        {option.icon}
        {option.label}
      </Space>
    ),
    onClick: option.onClick,
  }));

  return (
    <StyledContainer className={className} style={style}>
      <Tooltip title={isGenerating ? '停止生成' : '开始聊天'}>
        <StyledButton
          type="primary"
          size={size}
          icon={isGenerating ? <StopOutlined /> : <SendOutlined />}
          onClick={handleActionClick}
        />
      </Tooltip>

      {options.length > 0 && (
        <Dropdown menu={{ items }} trigger={['click']} placement="topRight">
          <StyledButton
            type="default"
            size={size}
            icon={<SettingOutlined />}
          />
        </Dropdown>
      )}
    </StyledContainer>
  );
};

export default ChatControl;
