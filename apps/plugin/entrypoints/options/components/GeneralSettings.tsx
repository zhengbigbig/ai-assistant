import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Form, Input, Select, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
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
 * 通用配置组件
 * 管理API密钥、端点和默认模型等基本设置
 */
const GeneralSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'apiKey',
        'apiEndpoint',
        'defaultModel',
      ],
      (result) => {
        form.setFieldsValue({
          apiKey: result.apiKey || '',
          apiEndpoint: result.apiEndpoint || 'https://api.openai.com/v1',
          defaultModel: result.defaultModel || 'gpt-4',
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
      <StyledTitle level={3}>通用配置</StyledTitle>
      <StyledDivider />

      <Form
        form={form}
        layout="vertical"
        onFinish={saveSettings}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="apiKey"
          label="API 密钥"
          rules={[{ required: true, message: '请输入 API 密钥' }]}
          extra="您的 API 密钥将安全地存储在浏览器中"
        >
          <Input.Password placeholder="sk-..." />
        </Form.Item>

        <Form.Item
          name="apiEndpoint"
          label="API 端点"
          rules={[{ required: true, message: '请输入 API 端点' }]}
          extra="自定义 API 端点（用于自托管或代理）"
        >
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>

        <Form.Item
          name="defaultModel"
          label="默认模型"
          extra="设置默认使用的 AI 模型"
        >
          <Select>
            <Option value="gpt-4">GPT-4</Option>
            <Option value="gpt-3.5">GPT-3.5</Option>
            <Option value="qwen-7b">通义千问</Option>
            <Option value="llama-3">LLAMA-3</Option>
          </Select>
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

export default GeneralSettings;
