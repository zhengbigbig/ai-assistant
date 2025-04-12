import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Form, Select, Switch, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const StyledTitle = styled(Title)`
  margin-bottom: 24px;
`;

const StyledDivider = styled.div`
  height: 1px;
  background-color: #f0f0f0;
  margin: 24px 0;
`;

const SubmitButton = styled(Button)`
  margin-top: 32px;
`;

/**
 * 侧边栏设置组件
 * 管理浏览器插件侧边栏的相关配置
 */
const SidebarSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'enableSidebar',
        'sidebarWidth',
      ],
      (result) => {
        form.setFieldsValue({
          enableSidebar: result.enableSidebar !== undefined ? result.enableSidebar : true,
          sidebarWidth: result.sidebarWidth || 'medium',
        });
      }
    );
  }, [form]);

  // 保存设置
  const saveSettings = (values: any) => {
    chrome.storage.sync.set(
      values,
      () => {
        messageApi.success('设置已保存！');
      }
    );
  };

  return (
    <>
      {contextHolder}
      <StyledTitle level={3}>侧边栏</StyledTitle>
      <StyledDivider />

      <Form
        form={form}
        layout="vertical"
        onFinish={saveSettings}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="enableSidebar"
          label="启用侧边栏功能"
          valuePropName="checked"
          extra="允许在浏览器右侧显示AI助手侧边栏"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="sidebarWidth"
          label="侧边栏宽度"
          extra="设置侧边栏的默认宽度"
        >
          <Select>
            <Option value="narrow">窄</Option>
            <Option value="medium">中等</Option>
            <Option value="wide">宽</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="sidebarPosition"
          label="侧边栏位置"
          extra="设置侧边栏的显示位置"
        >
          <Select>
            <Option value="right">右侧</Option>
            <Option value="left">左侧</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="autoHideSidebar"
          label="自动隐藏侧边栏"
          valuePropName="checked"
          extra="当不使用时自动隐藏侧边栏"
        >
          <Switch />
        </Form.Item>

        <Form.Item>
          <SubmitButton
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
          >
            保存设置
          </SubmitButton>
        </Form.Item>
      </Form>
    </>
  );
};

export default SidebarSettings;
