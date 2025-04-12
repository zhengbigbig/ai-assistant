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
 * 翻译设置组件
 * 管理页面翻译和文本翻译相关的配置
 */
const TranslationSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'enableTranslation',
        'targetLanguage',
        'displayMode',
      ],
      (result) => {
        form.setFieldsValue({
          enableTranslation: result.enableTranslation !== undefined ? result.enableTranslation : true,
          targetLanguage: result.targetLanguage || 'zh-CN',
          displayMode: result.displayMode || 'dual',
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
      <StyledTitle level={3}>翻译</StyledTitle>
      <StyledDivider />

      <Form
        form={form}
        layout="vertical"
        onFinish={saveSettings}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="enableTranslation"
          label="启用页面翻译"
          valuePropName="checked"
          extra="允许翻译当前浏览的网页内容"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="targetLanguage"
          label="目标语言"
          extra="选择页面翻译的目标语言"
        >
          <Select>
            <Option value="zh-CN">简体中文</Option>
            <Option value="en-US">英语（美国）</Option>
            <Option value="ja-JP">日语</Option>
            <Option value="ko-KR">韩语</Option>
            <Option value="fr-FR">法语</Option>
            <Option value="de-DE">德语</Option>
            <Option value="ru-RU">俄语</Option>
            <Option value="es-ES">西班牙语</Option>
            <Option value="it-IT">意大利语</Option>
            <Option value="pt-PT">葡萄牙语</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="displayMode"
          label="显示模式"
          extra="选择翻译内容的显示方式"
        >
          <Select>
            <Option value="dual">双语对照</Option>
            <Option value="replace">替换原文</Option>
            <Option value="hover">悬停显示</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="autoTranslate"
          label="自动翻译"
          valuePropName="checked"
          extra="打开网页时自动进行翻译"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="translationQuality"
          label="翻译质量"
          extra="优先考虑翻译质量还是速度"
        >
          <Select>
            <Option value="high">高质量（较慢）</Option>
            <Option value="balanced">平衡</Option>
            <Option value="fast">快速（较低质量）</Option>
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

export default TranslationSettings;
