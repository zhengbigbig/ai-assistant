import {
  ApiOutlined,
  ControlOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  GlobalOutlined,
  PlusOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import {
  Button,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useConfigStore, useProviders, useSelectedProvider, useTranslation } from '../../stores/configStore';
import type { ProviderType, TranslationSettings } from '../../stores/configStore';
import {
  Label,
  StyledCard,
  StyledDivider,
  StyledSection,
  StyledTitle,
  TitleWithIcon,
} from './Wrapper';

const { Text, Paragraph } = Typography;

// 样式化组件
const ProviderItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    border-color: #d9d9d9;
    background-color: #fafafa;
  }

  &.selected {
    border-color: #1890ff;
    background-color: #e6f7ff;
  }
`;

const ProviderInfo = styled.div`
  display: flex;
  align-items: center;
`;

const ProviderLogo = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;

  img {
    max-width: 100%;
    max-height: 100%;
  }
`;

const ProviderName = styled(Text)`
  font-weight: 500;
`;

const ProviderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const AddProviderButton = styled(Button)`
  width: 100%;
  margin-top: 16px;
  border-style: dashed;
`;

/**
 * 翻译设置组件
 * 管理页面翻译和文本翻译相关的配置
 */
const TranslationSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [forbiddenWebsite, setForbiddenWebsite] = useState<string>('');
  const [translationProviderModal, setTranslationProviderModal] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<ProviderType | null>(null);
  const [translationProviderForm] = Form.useForm();
  const [addProviderModalVisible, setAddProviderModalVisible] = useState(false);
  const [addProviderForm] = Form.useForm();

  // 从store获取翻译设置和更新方法
  const translation = useTranslation();
  const { forbiddenWebsites } = translation;
  const { updateTranslation } = useConfigStore();
  const providers = useProviders();
  const selectedProvider = useSelectedProvider();

  // 确保enable开关使用默认值
  const formInitialValues: TranslationSettings = {
    targetLanguage: 'zh-CN',
    displayMode: 'dual',
    translationService: 'google',
    displayStyle: 'underline',
    forbiddenWebsites: [],
    enableVideoSubtitleTranslation: true,
    enableInputTranslation: false,
    enableHoverTranslation: true,
    hoverHotkey: 'option',
    hoverTranslationService: 'google'
  };

  // 加载设置到表单
  useEffect(() => {
    console.log('加载翻译设置', translation);
    if (translation) {
      // 合并默认值和存储的值
      const mergedValues = {
        ...formInitialValues,
        ...translation
      };
      form.setFieldsValue(mergedValues);
    }

    // 确保默认翻译服务存在
    ensureDefaultTranslationServices();
  }, [form, translation]);

  // 确保默认翻译服务存在
  const ensureDefaultTranslationServices = () => {
    const { providers, addProvider } = useConfigStore.getState();

    // 检查是否存在谷歌翻译
    if (!providers.some(p => p.id === 'google')) {
      addProvider({
        id: 'google',
        name: '谷歌翻译',
        apiKey: '',
        baseUrl: 'https://translate.googleapis.com/translate_a/single',
        models: []
      });
    }

    // 检查是否存在智谱GLM翻译
    if (!providers.some(p => p.id === 'glm')) {
      addProvider({
        id: 'glm',
        name: '智谱GLM翻译',
        apiKey: '',
        baseUrl: '',
        models: []
      });
    }
  };

  // 保存设置
  const handleValuesChange = (changedValues: any, allValues: any) => {
    console.log('保存翻译设置', changedValues, allValues);
    updateTranslation(changedValues);
    messageApi.success('设置已保存');
  };

  // 添加禁用网站
  const handleAddForbiddenWebsite = () => {
    if (!forbiddenWebsite) {
      messageApi.info('请先设置禁用网站');
      return;
    }

    const websiteList = forbiddenWebsites || [];

    if (websiteList.includes(forbiddenWebsite)) {
      messageApi.error('该网站已在列表中');
      return;
    }

    const newForbiddenWebsites = [...websiteList, forbiddenWebsite];
    updateTranslation({ forbiddenWebsites: newForbiddenWebsites });
    setForbiddenWebsite('');
  };

  // 移除禁用网站
  const handleRemoveForbiddenWebsite = (site: string) => {
    const newForbiddenWebsites = (forbiddenWebsites || []).filter(
      (s: string) => s !== site
    );
    updateTranslation({ forbiddenWebsites: newForbiddenWebsites });
  };

  // 处理翻译服务提供商配置点击
  const handleTranslationProviderConfig = (e: React.MouseEvent, providerId: string) => {
    e.stopPropagation(); // 阻止事件冒泡
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      setCurrentProvider(provider);
      translationProviderForm.setFieldsValue({
        id: provider.id,
        name: provider.name,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl
      });
      setTranslationProviderModal(true);
    }
  };

  // 处理删除翻译服务提供商
  const handleDeleteTranslationProvider = (e: React.MouseEvent, providerId: string) => {
    e.stopPropagation(); // 阻止事件冒泡

    // 不允许删除默认的谷歌和智谱翻译
    if (providerId === 'google' || providerId === 'glm') {
      messageApi.warning('默认翻译服务不允许删除');
      return;
    }

    const { removeProvider } = useConfigStore.getState();
    removeProvider(providerId);

    // 如果删除的是当前选中的翻译服务，则切换到谷歌翻译
    if (translation.translationService === providerId) {
      updateTranslation({ translationService: 'google' });
    }

    // 如果删除的是当前悬停翻译服务，则切换到谷歌翻译
    if (translation.hoverTranslationService === providerId) {
      updateTranslation({ hoverTranslationService: 'google' });
    }

    messageApi.success('翻译服务已删除');
  };

  // 设置翻译服务
  const handleSetTranslationService = (providerId: string) => {
    updateTranslation({ translationService: providerId });
    messageApi.success('已设置翻译服务');
  };

  // 添加翻译服务提供商
  const handleAddTranslationProvider = () => {
    addProviderForm.validateFields().then(values => {
      const { addProvider } = useConfigStore.getState();
      const newProviderId = 'translation-' + Date.now().toString();

      addProvider({
        id: newProviderId,
        name: values.name,
        apiKey: values.apiKey || '',
        baseUrl: values.baseUrl || '',
        models: []
      });

      messageApi.success('翻译服务提供商已添加');
      setAddProviderModalVisible(false);
      addProviderForm.resetFields();
    });
  };

  // 保存翻译提供商设置
  const saveTranslationProviderSettings = () => {
    translationProviderForm.validateFields().then(values => {
      if (currentProvider) {
        // 这里使用configStore中的updateProvider方法更新提供商信息
        const { updateProvider } = useConfigStore.getState();
        updateProvider(currentProvider.id, {
          apiKey: values.apiKey,
          baseUrl: values.baseUrl
        });
        messageApi.success('翻译服务提供商设置已保存');
        setTranslationProviderModal(false);
      }
    });
  };

  // 渲染提供商图标
  const renderProviderLogo = (providerName: string) => {
    // 显示provider名称的第一个字母作为logo
    return (
      <div
        style={{
          width: 24,
          height: 24,
          backgroundColor: '#1890ff',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
        }}
      >
        {providerName.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        style={{ maxWidth: 800 }}
        initialValues={formInitialValues}
      >
        {/* 页面翻译设置部分 */}
        <StyledSection>
          <TitleWithIcon>
            <TranslationOutlined />
            <StyledTitle level={4}>页面翻译</StyledTitle>
          </TitleWithIcon>

          <StyledCard>
            <Label>翻译服务</Label>
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              选择用于翻译的服务提供商，不同的提供商可能有不同的翻译质量和速度
            </Paragraph>

            {providers.length > 0 ? (
              <Row gutter={[16, 16]}>
                {providers.map((provider) => (
                  <Col span={12} key={provider.id}>
                    <ProviderItem
                      className={translation.translationService === provider.id ? 'selected' : ''}
                      onClick={() => handleSetTranslationService(provider.id)}
                    >
                      <ProviderInfo>
                        <ProviderLogo>
                          {renderProviderLogo(provider.name)}
                        </ProviderLogo>
                        <ProviderName>{provider.name}</ProviderName>
                      </ProviderInfo>
                      <ProviderActions>
                        <Button
                          type="primary"
                          size="small"
                          onClick={(e) => handleTranslationProviderConfig(e, provider.id)}
                        >
                          设置
                        </Button>
                        <Button
                          danger
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => handleDeleteTranslationProvider(e, provider.id)}
                          disabled={provider.id === 'google' || provider.id === 'glm'}
                        />
                      </ProviderActions>
                    </ProviderItem>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="暂无服务提供商" />
            )}

            <AddProviderButton
              icon={<PlusOutlined />}
              onClick={() => setAddProviderModalVisible(true)}
            >
              添加翻译服务提供商
            </AddProviderButton>

            <StyledDivider />

            <Flex justify="space-between" align="center">
              <Label>目标语言</Label>
              <Form.Item name="targetLanguage" noStyle>
                <Select style={{ width: 200 }}>
                  <Select.Option value="zh-CN">简体中文</Select.Option>
                  <Select.Option value="en-US">英语（美国）</Select.Option>
                  <Select.Option value="ja-JP">日语</Select.Option>
                  <Select.Option value="ko-KR">韩语</Select.Option>
                  <Select.Option value="fr-FR">法语</Select.Option>
                  <Select.Option value="de-DE">德语</Select.Option>
                  <Select.Option value="ru-RU">俄语</Select.Option>
                  <Select.Option value="es-ES">西班牙语</Select.Option>
                  <Select.Option value="it-IT">意大利语</Select.Option>
                  <Select.Option value="pt-PT">葡萄牙语</Select.Option>
                </Select>
              </Form.Item>
            </Flex>

            <StyledDivider />

            <Flex justify="space-between" align="center">
              <Label>显示模式</Label>
              <Form.Item name="displayMode" noStyle>
                <Select style={{ width: 200 }}>
                  <Select.Option value="dual">双语对照</Select.Option>
                  <Select.Option value="replace">替换原文</Select.Option>
                </Select>
              </Form.Item>
            </Flex>

            <StyledDivider />

            <Flex justify="space-between" align="center">
              <Label>显示风格</Label>
              <Form.Item name="displayStyle" noStyle>
                <Select style={{ width: 200 }}>
                  <Select.Option value="underline">虚线下划线</Select.Option>
                  <Select.Option value="background">背景色</Select.Option>
                  <Select.Option value="border">虚线边框</Select.Option>
                </Select>
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>

        {/* 永不翻译的网址 */}
        <StyledSection>
          <StyledCard>
            <Label>永不翻译的网址</Label>
            <Paragraph style={{ padding: '0 12px' }}>
              在这些网站上将不会启用页面翻译功能
            </Paragraph>

            <div style={{ padding: '0 12px', marginBottom: 16 }}>
              <Space size={[0, 8]} wrap>
                {(forbiddenWebsites || []).map((site: string) => (
                  <Tag
                    key={site}
                    closable
                    onClose={() => handleRemoveForbiddenWebsite(site)}
                    style={{ marginBottom: 8 }}
                  >
                    {site}
                  </Tag>
                ))}
              </Space>
            </div>

            <Flex style={{ padding: '0 12px' }}>
              <Input
                placeholder="输入网站域名 (例如: example.com)"
                value={forbiddenWebsite}
                onChange={(e) => setForbiddenWebsite(e.target.value)}
                style={{ marginRight: 8 }}
                onPressEnter={handleAddForbiddenWebsite}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddForbiddenWebsite}
              >
                添加
              </Button>
            </Flex>
          </StyledCard>
        </StyledSection>

        {/* 鼠标悬停翻译设置 */}
        <StyledSection>
          <TitleWithIcon>
            <ControlOutlined />
            <StyledTitle level={4}>鼠标悬停翻译</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>
                启用鼠标悬停翻译
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  允许通过鼠标悬停快速翻译页面中的文本段落
                </Text>
              </Label>
              <Form.Item name="enableHoverTranslation" noStyle valuePropName="checked">
                <Switch />
              </Form.Item>
            </Flex>

            <StyledDivider />

            <Label>触发条件</Label>
            <Flex align="center" gap={4} style={{ paddingLeft: 12, marginTop: 8 }}>
              <div style={{ width: 130 }}>当鼠标悬停并按下</div>
              <Form.Item name="hoverHotkey" noStyle>
                <Select
                  onClick={(e) => {
                    // 阻止事件
                    e.stopPropagation();
                    // 阻止默认行为
                    e.preventDefault();
                  }}
                  options={[
                    { label: '⌥ Option', value: 'option' },
                    { label: '⌘ Command', value: 'command' },
                    { label: '⇧ Shift', value: 'shift' },
                  ]}
                  style={{ width: 150 }}
                />
              </Form.Item>
              <div>时翻译/还原该段</div>
            </Flex>

            <StyledDivider />

            <Flex justify="space-between" align="center">
              <Label>悬停翻译服务</Label>
              <Form.Item name="hoverTranslationService" noStyle>
                <Select style={{ width: 200 }}>
                  {providers.map(provider => (
                    <Select.Option key={provider.id} value={provider.id}>{provider.name}</Select.Option>
                  ))}
                  <Select.Option value="default">默认AI服务</Select.Option>
                </Select>
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>

        {/* 字幕翻译设置部分 */}
        <StyledSection>
          <TitleWithIcon>
            <TranslationOutlined />
            <StyledTitle level={4}>字幕翻译</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>
                在YouTube和Netflix上显示双语控制
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  允许在视频播放网站上控制字幕翻译功能
                </Text>
              </Label>
              <Form.Item name="enableVideoSubtitleTranslation" noStyle valuePropName="checked">
                <Switch />
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>

        {/* 输入翻译设置部分 */}
        <StyledSection>
          <TitleWithIcon>
            <TranslationOutlined />
            <StyledTitle level={4}>输入翻译</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>
                使用触发键翻译输入文本
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  在任何网页的输入框中翻译并替换文本
                </Text>
              </Label>
              <Form.Item name="enableInputTranslation" noStyle valuePropName="checked">
                <Switch />
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>
      </Form>

      {/* 翻译服务提供商配置弹窗 */}
      <Modal
        title={currentProvider?.name + " 翻译配置"}
        open={translationProviderModal}
        onCancel={() => setTranslationProviderModal(false)}
        footer={null}
        width={500}
      >
        <Form form={translationProviderForm} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="name" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API key"
            rules={[{ required: true, message: '请输入API密钥' }]}
          >
            <Input.Password
              placeholder="请输入您的API密钥"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item name="baseUrl" label="API代理URL（可选）">
            <Input placeholder="https://api.provider.com/v1" />
          </Form.Item>

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <Button onClick={() => setTranslationProviderModal(false)}>
              取消
            </Button>
            <Button type="primary" onClick={saveTranslationProviderSettings}>
              保存
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 添加翻译服务提供商弹窗 */}
      <Modal
        title="添加翻译服务提供商"
        open={addProviderModalVisible}
        onCancel={() => setAddProviderModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={addProviderForm} layout="vertical">
          <Form.Item
            name="name"
            label="翻译服务名称"
            rules={[{ required: true, message: '请输入翻译服务名称' }]}
          >
            <Input placeholder="例如: 自定义翻译服务" />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API key"
          >
            <Input.Password
              placeholder="请输入您的API密钥"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item name="baseUrl" label="API代理URL">
            <Input placeholder="https://api.example.com/v1" />
          </Form.Item>

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <Button onClick={() => setAddProviderModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" onClick={handleAddTranslationProvider}>
              添加
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default TranslationSettings;
