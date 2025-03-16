import { Input as AntInput } from 'antd';
import type { InputProps as AntInputProps } from 'antd';
import styled from 'styled-components';

// 扩展Ant Design的Input组件
const StyledInput = styled(AntInput)`
  // 自定义样式
`;

export type InputProps = AntInputProps;

export const Input = StyledInput;
