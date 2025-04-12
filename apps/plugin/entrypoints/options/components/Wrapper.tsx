import { Divider, Typography } from 'antd';
import styled from 'styled-components';

const { Title, Text, Paragraph } = Typography;

export const StyledSection = styled.div`
  margin-bottom: 24px;
`;

export const StyledTitle = styled(Title)`
  margin: 0 !important;
`;

export const StyledDivider = styled(Divider)`
  margin: 24px 0;
`;
