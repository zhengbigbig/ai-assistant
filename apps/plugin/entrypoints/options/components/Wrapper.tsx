import { Divider, Space, Typography } from 'antd';
import styled from 'styled-components';

const { Title } = Typography;

export const StyledSection = styled.div`
  margin-bottom: 24px;
  background-color: #fff;
  border-radius: 8px;
  .ant-form-item {
    margin-bottom: 0;
  }
`;

export const StyledTitle = styled(Title)`
  margin: 0 !important;
  font-size: 24px !important;
`;

export const TitleWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  .anticon {
    font-size: 20px;
  }
`;

export const StyledDivider = styled(Divider)`
  margin: 16px 0;
`;

export const StyledCard = styled.div`
  padding: 16px;
  border-radius: 8px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
`;

export const Label = styled.div`
  font-size: 16px;
  font-weight: 500;
  padding: 12px;
`;
