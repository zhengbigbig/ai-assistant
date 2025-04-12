import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Form, Switch, Button, message, Input } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

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

const ShortcutWrapper = styled.div`
  margin-bottom: 16px;
`;

const ShortcutLabel = styled(Text)`
  display: inline-block;
  width: 140px;
  margin-right: 16px;
`;

const KeyboardKey = styled(Text)`
  display: inline-block;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-family: monospace;
  margin-right: 8px;
`;

/**
 * 键盘快捷键设置组件
 * 管理插件的键盘快捷键配置
 */
const KeyboardShortcutsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'enableKeyboardShortcuts',
        'shortcutOpenSidebar',
        'shortcutOpenMenu',
        'shortcutTranslate',
        'shortcutScreenshot',
      ],
      (result) => {
        form.setFieldsValue({
          enableKeyboardShortcuts: result.enableKeyboardShortcuts !== undefined ? result.enableKeyboardShortcuts : true,
          shortcutOpenSidebar: result.shortcutOpenSidebar || 'Alt+A',
          shortcutOpenMenu: result.shortcutOpenMenu || 'Alt+Q',
          shortcutTranslate: result.shortcutTranslate || 'Alt+T',
          shortcutScreenshot: result.shortcutScreenshot || 'Alt+S',
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
      <StyledTitle level={3}>键盘快捷键</StyledTitle>
      <StyledDivider />

      <Form
        form={form}
        layout="vertical"
        onFinish={saveSettings}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="enableKeyboardShortcuts"
          label="启用键盘快捷键"
          valuePropName="checked"
          extra="允许使用键盘快捷键操作插件"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="自定义快捷键"
          extra="您可以自定义以下操作的快捷键组合"
          style={{ marginBottom: 32 }}
        >
          <Form.Item
            name="shortcutOpenSidebar"
            label="打开侧边栏"
            style={{ marginBottom: 16 }}
          >
            <Input placeholder="Alt+A" />
          </Form.Item>

          <Form.Item
            name="shortcutOpenMenu"
            label="打开智能菜单"
            style={{ marginBottom: 16 }}
          >
            <Input placeholder="Alt+Q" />
          </Form.Item>

          <Form.Item
            name="shortcutTranslate"
            label="快速翻译"
            style={{ marginBottom: 16 }}
          >
            <Input placeholder="Alt+T" />
          </Form.Item>

          <Form.Item
            name="shortcutScreenshot"
            label="截图分析"
            style={{ marginBottom: 16 }}
          >
            <Input placeholder="Alt+S" />
          </Form.Item>
        </Form.Item>

        <Paragraph style={{ marginBottom: 24 }}>
          <Text strong>默认快捷键：</Text>
        </Paragraph>

        <ShortcutWrapper>
          <ShortcutLabel>打开侧边栏:</ShortcutLabel>
          <KeyboardKey keyboard>Alt</KeyboardKey>
          <KeyboardKey keyboard>A</KeyboardKey>
        </ShortcutWrapper>

        <ShortcutWrapper>
          <ShortcutLabel>打开智能菜单:</ShortcutLabel>
          <KeyboardKey keyboard>Alt</KeyboardKey>
          <KeyboardKey keyboard>Q</KeyboardKey>
        </ShortcutWrapper>

        <ShortcutWrapper>
          <ShortcutLabel>快速翻译:</ShortcutLabel>
          <KeyboardKey keyboard>Alt</KeyboardKey>
          <KeyboardKey keyboard>T</KeyboardKey>
        </ShortcutWrapper>

        <ShortcutWrapper>
          <ShortcutLabel>截图分析:</ShortcutLabel>
          <KeyboardKey keyboard>Alt</KeyboardKey>
          <KeyboardKey keyboard>S</KeyboardKey>
        </ShortcutWrapper>

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

export default KeyboardShortcutsSettings;
