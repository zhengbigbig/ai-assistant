import { MenuFoldOutlined, MessageOutlined } from '@ant-design/icons';
import {
  Card,
  Flex,
  Form,
  message,
  Radio,
  Switch,
  Typography
} from 'antd';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useConfigStore, useSidebar } from '../../stores/configStore';
import { StyledDivider, StyledSection, StyledTitle } from './Wrapper';

const { Text } = Typography;

const Label = styled.div`
  font-size: 16px;
  font-weight: 500;
  padding: 12px;
`;

const TitleWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * 侧边栏设置组件
 * 管理浏览器插件侧边栏的相关配置
 */
const SidebarSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 从store获取侧边栏设置和更新方法
  const sidebar = useSidebar();
  const { updateSidebar } = useConfigStore();

  // 加载设置到表单
  useEffect(() => {
    form.setFieldsValue({
      ...sidebar,
    });
  }, [form, sidebar]);

  // 保存设置
  const handleValuesChange = (changedValues: any, allValues: any) => {
    updateSidebar(changedValues);
    messageApi.success('设置已保存');
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        style={{ maxWidth: 800 }}
      >
        {/* 聊天设置部分 */}
        <StyledSection>
          <TitleWithIcon>
            <MessageOutlined />
            <StyledTitle level={4}>聊天</StyledTitle>
          </TitleWithIcon>
          <StyledDivider />

          <Card size="small" hoverable>
            <Label>当侧边栏重新打开时</Label>
            <Form.Item name="restoreChat" noStyle>
              <Radio.Group
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginLeft: 12,
                }}
              >
                <Radio value="always">始终开始新的聊天</Radio>
                <Radio value="restore">始终恢复上次的聊天</Radio>
                <Radio value="auto">自动恢复或重新开始</Radio>
              </Radio.Group>
            </Form.Item>
            <Text
              type="secondary"
              style={{
                paddingLeft: 36,
                display: 'block',
              }}
            >
              如果在10分钟内重新打开，聊天将恢复；如果超过10分钟，将开始新的聊天
            </Text>
          </Card>
        </StyledSection>

        <StyledSection>
          <Card size="small" hoverable>
            <Label>长回复的滚动行为</Label>
            <Form.Item name="scrollBehavior" noStyle>
              <Radio.Group
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginLeft: 12,
                }}
              >
                <Radio value="bottom">当回复到达顶部时暂停演示</Radio>
                <Radio value="auto">自动滚动到回复末尾</Radio>
              </Radio.Group>
            </Form.Item>
          </Card>
        </StyledSection>

        <StyledSection>
          <StyledDivider />
          <Card size="small" hoverable>
            <Flex justify="space-between" align="center">
              <Label>
                在输入框中自动引用选中的文本
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  开启时，选中文本会自动出现在输入框中以便快速操作
                </Text>
              </Label>
              <Form.Item name="autoSelectText" noStyle>
                <Switch />
              </Form.Item>
            </Flex>
          </Card>
        </StyledSection>

        <StyledSection>
          <TitleWithIcon>
            <MenuFoldOutlined />
            <StyledTitle level={4}>Sider图标</StyledTitle>
          </TitleWithIcon>
          <StyledDivider />

          <Card size="small" hoverable>
            <Flex justify="space-between" align="center">
              <Label>
                始终在页面上显示Sider图标
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  开启时，Sider图标会出现在右下角并可拖动
                </Text>
              </Label>
              <Form.Item name="showSiderIcon" noStyle>
                <Switch />
              </Form.Item>
            </Flex>
          </Card>
        </StyledSection>
      </Form>
    </>
  );
};

export default SidebarSettings;
