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
 * 网页助手设置组件
 * 管理网页内容增强和分析相关的配置
 */
const WebHelperSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'enableWebHelper',
        'webHelperFeatures',
      ],
      (result) => {
        form.setFieldsValue({
          enableWebHelper: result.enableWebHelper !== undefined ? result.enableWebHelper : true,
          webHelperFeatures: result.webHelperFeatures || ['contentSummary', 'keywordHighlight'],
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
      <StyledTitle level={3}>网页助手</StyledTitle>
      <StyledDivider />

      <Form
        form={form}
        layout="vertical"
        onFinish={saveSettings}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="enableWebHelper"
          label="启用网页助手"
          valuePropName="checked"
          extra="允许AI助手分析和增强网页内容"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="webHelperFeatures"
          label="网页助手功能"
          extra="选择启用的网页助手功能"
        >
          <Select mode="multiple">
            <Option value="contentSummary">内容摘要</Option>
            <Option value="keywordHighlight">关键词高亮</Option>
            <Option value="relatedInfo">相关信息</Option>
            <Option value="factCheck">事实核查</Option>
            <Option value="readability">可读性增强</Option>
            <Option value="sentiment">情感分析</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="webHelperPosition"
          label="助手位置"
          extra="选择网页助手在页面中的显示位置"
        >
          <Select>
            <Option value="topRight">右上角</Option>
            <Option value="bottomRight">右下角</Option>
            <Option value="topLeft">左上角</Option>
            <Option value="bottomLeft">左下角</Option>
            <Option value="sidePanel">侧面板</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="autoActivate"
          label="自动激活"
          valuePropName="checked"
          extra="访问网页时自动激活网页助手"
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

export default WebHelperSettings;
