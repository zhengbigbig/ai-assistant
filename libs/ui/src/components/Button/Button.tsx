import React from 'react';
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';
import styled from 'styled-components';

export interface ButtonProps extends AntButtonProps {
  // 自定义属性
  customProp?: string;
}

const StyledButton = styled(AntButton)`
  // 自定义样式
  border-radius: 4px;
`;

export const Button: React.FC<ButtonProps> = ({ customProp, ...props }) => {
  return <StyledButton {...props} />;
};
