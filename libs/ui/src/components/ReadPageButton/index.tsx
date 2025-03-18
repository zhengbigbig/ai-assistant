import React from 'react';
import styled from 'styled-components';
import { Button, Tooltip } from 'antd';
import { ReadOutlined } from '@ant-design/icons';

export interface ReadPageButtonProps {
  /**
   * 按钮文本
   */
  text?: string;
  /**
   * 按钮提示文本
   */
  tooltip?: string;
  /**
   * 按钮图标
   */
  icon?: React.ReactNode;
  /**
   * 按钮类型
   */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  /**
   * 按钮大小
   */
  size?: 'small' | 'middle' | 'large';
  /**
   * 是否加载中
   */
  loading?: boolean;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 点击回调
   */
  onClick?: () => void;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
}

const StyledButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;

  .anticon {
    margin-right: 4px;
  }
`;

/**
 * ReadPageButton组件 - 用于阅读当前页面
 *
 * @param props - 组件属性
 * @returns React组件
 *
 * @example
 * ```tsx
 * <ReadPageButton
 *   text="阅读此页"
 *   tooltip="分析并阅读当前页面内容"
 *   onClick={() => console.log('阅读页面')}
 * />
 * ```
 */
export const ReadPageButton: React.FC<ReadPageButtonProps> = ({
  text = '阅读此页',
  tooltip = '分析并阅读当前页面内容',
  icon = <ReadOutlined />,
  type = 'primary',
  size = 'middle',
  loading = false,
  disabled = false,
  onClick,
  className,
  style,
}) => {
  const button = (
    <StyledButton
      type={type}
      size={size}
      icon={icon}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={style}
    >
      {text}
    </StyledButton>
  );

  return tooltip ? (
    <Tooltip title={tooltip} placement="bottom">
      {button}
    </Tooltip>
  ) : button;
};

export default ReadPageButton;
