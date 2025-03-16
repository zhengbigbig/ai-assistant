import React from 'react';
import { Input as AntInput } from 'antd';
import type { InputProps as AntInputProps } from 'antd';
import styled from 'styled-components';

export interface InputProps extends AntInputProps {
  // 自定义属性
  customProp?: string;
}

const StyledInput = styled(AntInput)`
  // 自定义样式
  border-radius: 4px;
`;

export const Input: React.FC<InputProps> = ({ customProp, ...props }) => {
  return <StyledInput {...props} />;
};
