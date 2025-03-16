import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';
import styled from 'styled-components';

// 扩展Ant Design的Button组件
const StyledButton = styled(AntButton)`
  // 自定义样式
`;

export type ButtonProps = AntButtonProps;

export const Button = StyledButton;
