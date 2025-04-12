import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Form, Input, Switch, Button, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;

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
 * 提示词设置组件
 * 管理AI提示词模板和建议相关的配置
 */
const PromptWordsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'enablePromptSuggestions',
        'customPrompts',
      ],
      (result) => {
        form.setFieldsValue({
          enablePromptSuggestions: result.enablePromptSuggestions !== undefined ? result.enablePromptSuggestions : true,
          customPrompts: result.customPrompts || '',
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
      <StyledTitle level={3}>提示词</StyledTitle>
      <StyledDivider />

      <Form
        form={form}
        layout="vertical"
        onFinish={saveSettings}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="enablePromptSuggestions"
          label="启用提示词建议"
          valuePropName="checked"
          extra="在输入时显示提示词建议"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="customPrompts"
          label="自定义提示词"
          extra="添加您自己的提示词模板，每行一个"
        >
          <Input.TextArea
            rows={6}
            placeholder="输入自定义提示词，每行一个..."
            autoSize={{ minRows: 6, maxRows: 15 }}
          />
        </Form.Item>

        <Form.Item
          name="promptCategories"
          label="提示词分类"
          extra="为提示词添加分类标签，例如：'翻译:翻译以下内容到中文'"
        >
          <Input.TextArea
            rows={4}
            placeholder="格式：'分类:提示词'，每行一个..."
            autoSize={{ minRows: 4, maxRows: 10 }}
          />
        </Form.Item>

        <Form.Item
          name="showPromptShortcuts"
          label="显示提示词快捷方式"
          valuePropName="checked"
          extra="在聊天界面显示常用提示词的快捷按钮"
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

export default PromptWordsSettings;
