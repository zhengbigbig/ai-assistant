import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { Card } from 'antd';

export interface SiderPanelProps {
  /**
   * 面板标题
   */
  title?: string;
  /**
   * 面板内容
   */
  children?: ReactNode;
  /**
   * 面板宽度
   */
  width?: number | string;
  /**
   * 面板高度
   */
  height?: number | string;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
}

const StyledPanel = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: ${(props) => (typeof props.width === 'number' ? `${props.width}px` : props.width)};
  height: ${(props) => (typeof props.height === 'number' ? `${props.height}px` : props.height)};
  overflow: auto;

  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
    min-height: 48px;
  }

  .ant-card-body {
    padding: 16px;
  }
`;

/**
 * SiderPanel组件 - 浏览器插件的侧边面板容器
 *
 * @param props - 组件属性
 * @returns React组件
 *
 * @example
 * ```tsx
 * <SiderPanel title="Sider面板" width={320}>
 *   <div>面板内容</div>
 * </SiderPanel>
 * ```
 */
export const SiderPanel: React.FC<SiderPanelProps> = ({
  title,
  children,
  width = 320,
  height = '100%',
  className,
  style,
}) => {
  return (
    <StyledPanel
      title={title}
      width={width}
      height={height}
      className={className}
      style={style}
      bordered={false}
    >
      {children}
    </StyledPanel>
  );
};

export default SiderPanel;
