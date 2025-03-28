import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Typography, Form, Input, Select, Switch, Button, message, Divider } from 'antd';
import {
  SettingOutlined,
  ApiOutlined,
  ToolOutlined,
  TranslationOutlined,
  InfoCircleOutlined,
  SaveOutlined
} from '@ant-design/icons';
import './styles.css';

const { Header, Content, Sider } = Layout;
const { Title, Paragraph, Link, Text } = Typography;
const { Option } = Select;

/**
 * 选项页面组件
 * 管理插件的所有配置项
 */
const OptionsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [activeMenuKey, setActiveMenuKey] = useState('api');

  // 获取主题配置
  const { token } = theme.useToken();

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'apiKey',
        'apiEndpoint',
        'enableContextMenu',
        'enableScreenshot',
        'defaultModel',
        'enableTranslation',
        'targetLanguage',
        'displayMode',
      ],
      (result) => {
        form.setFieldsValue({
          apiKey: result.apiKey || '',
          apiEndpoint: result.apiEndpoint || 'https://api.openai.com/v1',
          enableContextMenu: result.enableContextMenu !== undefined ? result.enableContextMenu : true,
          enableScreenshot: result.enableScreenshot !== undefined ? result.enableScreenshot : true,
          defaultModel: result.defaultModel || 'gpt-4',
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

  // 菜单项配置
  const menuItems = [
    {
      key: 'api',
      icon: <ApiOutlined />,
      label: 'API 设置',
    },
    {
      key: 'features',
      icon: <ToolOutlined />,
      label: '功能设置',
    },
    {
      key: 'translation',
      icon: <TranslationOutlined />,
      label: '翻译设置',
    },
    {
      key: 'about',
      icon: <InfoCircleOutlined />,
      label: '关于',
    },
  ];

  // 根据当前选中的菜单项渲染不同的内容
  const renderContent = () => {
    switch (activeMenuKey) {
      case 'api':
        return (
          <>
            <Title level={3}>API 设置</Title>
            <Divider />
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
          </>
        );

      case 'features':
        return (
          <>
            <Title level={3}>功能设置</Title>
            <Divider />
            <Form.Item
              name="enableContextMenu"
              label="启用右键菜单功能"
              valuePropName="checked"
              extra="允许通过右键菜单快速访问 AI 助手功能"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="enableScreenshot"
              label="启用截图功能"
              valuePropName="checked"
              extra="允许捕获页面截图并发送给 AI 助手"
            >
              <Switch />
            </Form.Item>
          </>
        );

      case 'translation':
        return (
          <>
            <Title level={3}>翻译设置</Title>
            <Divider />
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
          </>
        );

      case 'about':
        return (
          <>
            <Title level={3}>关于</Title>
            <Divider />
            <Paragraph>
              <Text strong>AI Assistant 版本:</Text> 0.1.0
            </Paragraph>
            <Paragraph>
              AI Assistant 是一个强大的浏览器扩展，旨在通过先进的AI技术增强您的浏览体验。
              它提供实时翻译、内容摘要、智能搜索和个性化推荐等功能。
            </Paragraph>
            <Paragraph>
              <Link href="https://github.com/ai-assistant" target="_blank">
                项目主页
              </Link>
              {' | '}
              <Link href="https://github.com/ai-assistant/issues" target="_blank">
                报告问题
              </Link>
            </Paragraph>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Header className="options-header">
        <div className="logo" />
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          AI Assistant 设置
        </Title>
      </Header>
      <Layout>
        <Sider width={230} theme="light" breakpoint="lg" collapsedWidth="0">
          <Menu
            mode="inline"
            defaultSelectedKeys={[activeMenuKey]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
            onClick={({ key }) => setActiveMenuKey(key)}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              background: token.colorBgContainer,
              borderRadius: token.borderRadiusLG,
              minHeight: 280,
            }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={saveSettings}
              style={{ maxWidth: 800 }}
            >
              {renderContent()}

              <Form.Item style={{ marginTop: 32 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  size="large"
                >
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default OptionsPage;
