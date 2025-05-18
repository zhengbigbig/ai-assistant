import { Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { Label, StyledCard, StyledDivider, StyledSection, StyledTitle, TitleWithIcon } from '../Wrapper';

// 重导出公共样式组件
export { Label, StyledCard, StyledDivider, StyledSection, StyledTitle, TitleWithIcon };

// TranslationSettings特有的样式组件
export const ProviderItem = styled.div<React.HTMLAttributes<HTMLDivElement>>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    border-color: #d9d9d9;
    background-color: #fafafa;
  }

  &.selected {
    border-color: #1890ff;
    background-color: #e6f7ff;
  }
`;

export const ProviderInfo = styled.div`
  display: flex;
  align-items: center;
`;

export const ProviderLogo = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;

  img {
    max-width: 100%;
    max-height: 100%;
  }
`;

export const ProviderName = styled(Typography.Text)`
  font-weight: 500;
`;

export const ProviderActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const AddProviderButton = styled.button`
  width: 100%;
  margin-top: 16px;
  border-style: dashed;
  border-color: #d9d9d9;
  background-color: #fff;
  color: rgba(0, 0, 0, 0.88);
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
`;

export const StylePreview = styled.div`
  margin: 16px 0;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background-color: #fff;
`;

export const StyleOptionLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .edit-icon {
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover .edit-icon {
    opacity: 1;
  }
`;
