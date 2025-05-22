import { Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { Label, StyledCard, StyledDivider, StyledSection, StyledTitle, TitleWithIcon } from '../Wrapper';

// 重导出公共样式组件
export { Label, StyledCard, StyledDivider, StyledSection, StyledTitle, TitleWithIcon };

// GeneralSettings特有的样式组件
export const ProviderItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;

  &:hover {
    border-color: #d9d9d9;
    background-color: #fafafa;
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

export const UserInfo = styled.div`
  margin-left: 16px;
  flex: 1;
`;

export const UserActions = styled.div`
  display: flex;
  align-items: center;
`;

export const LogoutButton = styled.button`
  color: #ff4d4f;
  border-color: #ff4d4f;
  background: transparent;
  border: 1px solid #ff4d4f;
  border-radius: 2px;
  padding: 4px 15px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: #ff7875;
    border-color: #ff7875;
  }
`;

export const ModelItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;
  gap: 12px;

  &:hover {
    border-color: #d9d9d9;
    background-color: #fafafa;
  }
`;

export const ModelInfo = styled.div`
  flex: 1;
`;

export const ModelName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

export const ModelDescription = styled.div`
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
`;

export const ModelActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const ModelListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const ModalTitle = styled.div`
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 24px;
`;

export const ConnectionCheckSection = styled.div`
  margin: 16px 0;
`;
