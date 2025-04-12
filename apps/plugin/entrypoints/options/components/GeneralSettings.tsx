import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  GlobalOutlined,
  LogoutOutlined,
  PlusOutlined,
  SettingOutlined,
  SoundOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Switch,
  Tooltip,
  Typography
} from 'antd';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  ModelType,
  ProviderType,
  useAccount,
  useAppearance,
  useConfigStore,
  useProviders,
  useSelectedProvider,
  useVoice,
} from '../../stores/configStore';
import { StyledDivider, StyledSection, StyledTitle } from './Wrapper';

const { Text, Paragraph } = Typography;
const { Option } = Select;

const UserInfo = styled.div`
  margin-left: 16px;
  flex: 1;
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
`;

const LogoutButton = styled(Button)`
  color: #ff4d4f;
  border-color: #ff4d4f;

  &:hover {
    color: #ff7875;
    border-color: #ff7875;
  }
`;

const ProviderItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;

  &:hover {
    border-color: #d9d9d9;
    background-color: #fafafa;
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

const ModalTitle = styled.div`
  font-size: 28px;
  font-weight: 500;
  margin-bottom: 24px;
`;

const ConnectionCheckSection = styled.div`
  margin: 16px 0;
`;

const ModelItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;

  &:hover {
    border-color: #d9d9d9;
    background-color: #fafafa;
  }
`;

const ModelInfo = styled.div`
  flex: 1;
`;

const ModelName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const ModelDescription = styled.div`
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
`;

const ModelActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ModelListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const AddProviderButton = styled(Button)`
  width: 100%;
  margin-top: 16px;
  border-style: dashed;
`;

const ProviderActions = styled.div`
  display: flex;
  gap: 8px;
`;

/**
 * 通用配置组件
 * 管理账户、API访问、外观和语言等基本设置
 */
const GeneralSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [providerForm] = Form.useForm();
  const [addProviderForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isInitializing, setIsInitializing] = useState(true);
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [addProviderModalVisible, setAddProviderModalVisible] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<ProviderType | null>(
    null
  );
  const [isConnectionChecking, setIsConnectionChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'success' | 'error' | null
  >(null);
  const [newCustomLogo, setNewCustomLogo] = useState<string>('');
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [isEditingModel, setIsEditingModel] = useState(false);
  const [currentEditingModel, setCurrentEditingModel] =
    useState<ModelType | null>(null);
  const [modelForm] = Form.useForm();

  // 从store获取数据和方法
  const providers = useProviders();
  const selectedProvider = useSelectedProvider();
  const appearance = useAppearance();
  const voice = useVoice();
  const account = useAccount();
  const {
    addProvider,
    updateProvider,
    removeProvider,
    setSelectedProvider,
    addModel,
    updateModel,
    removeModel,
    toggleModelEnabled,
    updateAppearance,
    updateVoice,
    logout,
  } = useConfigStore();

  // 模型列表状态
  const [currentModels, setCurrentModels] = useState<ModelType[]>([]);

  // 初始加载
  useEffect(() => {
    // 初始化表单值
    form.setFieldsValue({
      displayMode: appearance.displayMode,
      language: appearance.language,
      fontSize: appearance.fontSize,
      voiceType: voice.voiceType,
      voiceSpeed: voice.voiceSpeed,
    });

    setIsInitializing(false);
  }, [form, appearance, voice]);

  // 处理加载初始数据
  useEffect(() => {
    // 如果存在当前选中的提供商，加载其模型数据
    const currentSelectedProvider = providers.find(
      (p) => p.id === selectedProvider
    );
    if (currentSelectedProvider) {
      setCurrentModels(currentSelectedProvider.models || []);
    }
  }, [providers, selectedProvider]);

  // 保存设置
  const saveSettings = (changedValues: any, allValues: any) => {
    // 初始化时不触发保存
    if (isInitializing) return;

    // 更新外观设置
    if (
      changedValues.displayMode !== undefined ||
      changedValues.language !== undefined ||
      changedValues.fontSize !== undefined
    ) {
      updateAppearance({
        displayMode: allValues.displayMode,
        language: allValues.language,
        fontSize: allValues.fontSize,
      });
    }

    // 更新朗读设置
    if (
      changedValues.voiceType !== undefined ||
      changedValues.voiceSpeed !== undefined
    ) {
      updateVoice({
        voiceType: allValues.voiceType,
        voiceSpeed: allValues.voiceSpeed,
      });
    }

    messageApi.success('设置已保存！', 1);
  };

  // 处理添加新模型
  const handleAddModel = () => {
    setIsAddingModel(true);
    modelForm.resetFields();
  };

  // 打开编辑模型对话框
  const handleEditModel = (model: ModelType) => {
    setCurrentEditingModel(model);
    setIsEditingModel(true);
    modelForm.setFieldsValue({
      name: model.name,
      value: model.value,
      description: model.description || '',
      enabled: model.enabled,
    });
  };

  // 保存模型编辑或添加
  const handleSaveModel = () => {
    modelForm
      .validateFields()
      .then((values) => {
        if (!currentProvider) return;

        if (isEditingModel && currentEditingModel) {
          // 编辑现有模型
          updateModel(currentProvider.id, currentEditingModel.id, {
            name: values.name,
            value: values.value,
            description: values.description,
            enabled: values.enabled,
          });

          messageApi.success('模型已更新');

          // 更新本地状态
          setCurrentModels((prev) =>
            prev.map((model) =>
              model.id === currentEditingModel.id
                ? {
                    ...model,
                    name: values.name,
                    value: values.value,
                    description: values.description,
                    enabled: values.enabled,
                  }
                : model
            )
          );
        } else {
          // 添加新模型
          const newModelId = `custom-model-${Date.now()}`;
          const newModel: ModelType = {
            id: newModelId,
            name: values.name,
            value: values.value,
            description: values.description,
            enabled: values.enabled,
          };

          addModel(currentProvider.id, newModel);
          messageApi.success('模型已添加');

          // 更新本地状态
          setCurrentModels((prev) => [...prev, newModel]);
        }

        modelForm.resetFields();
        setIsAddingModel(false);
        setIsEditingModel(false);
        setCurrentEditingModel(null);
      })
      .catch((err) => {
        console.error('验证表单失败:', err);
      });
  };

  // 处理删除模型
  const handleDeleteModel = (modelId: string) => {
    if (!currentProvider) return;

    removeModel(currentProvider.id, modelId);
    messageApi.success('模型已删除');

    // 更新本地状态
    setCurrentModels((prev) => prev.filter((model) => model.id !== modelId));
  };

  // 处理AI提供商选择
  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    // 加载当前提供商的模型
    const provider = providers.find((p) => p.id === providerId);
    if (provider) {
      setCurrentModels(provider.models || []);
    }
  };

  // 处理配置按钮点击
  const handleConfigClick = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;

    setCurrentProvider(provider);
    setCurrentModels(provider.models || []);

    providerForm.setFieldsValue({
      apiKey: provider.apiKey || '',
      baseUrl: provider.baseUrl || 'https://api.openai.com/v1',
    });

    setProviderModalVisible(true);
  };

  // 处理删除提供商
  const handleDeleteProvider = (providerId: string) => {
    removeProvider(providerId);
    messageApi.success('已删除服务提供商', 1);
  };

  // 处理连接检查
  const handleConnectionCheck = () => {
    const apiKey = providerForm.getFieldValue('apiKey');
    const baseUrl = providerForm.getFieldValue('baseUrl');

    if (!apiKey) {
      messageApi.error('请输入API密钥');
      return;
    }

    setIsConnectionChecking(true);
    setConnectionStatus(null);

    // 模拟API连接检查过程
    setTimeout(() => {
      if (apiKey.startsWith('sk-')) {
        setConnectionStatus('success');
        messageApi.success('连接成功！');
      } else {
        setConnectionStatus('error');
        messageApi.error('连接失败，请检查API密钥和代理URL');
      }
      setIsConnectionChecking(false);
    }, 1500);
  };

  // 处理模型开关状态变化
  const handleModelSwitchChange = (modelId: string, checked: boolean) => {
    if (!currentProvider) return;

    toggleModelEnabled(currentProvider.id, modelId, checked);

    // 更新本地状态
    setCurrentModels((prev) =>
      prev.map((model) =>
        model.id === modelId ? { ...model, enabled: checked } : model
      )
    );
  };

  // 保存提供商设置
  const saveProviderSettings = () => {
    providerForm
      .validateFields()
      .then((values) => {
        if (currentProvider) {
          updateProvider(currentProvider.id, {
            apiKey: values.apiKey,
            baseUrl: values.baseUrl,
          });

          messageApi.success(`${currentProvider.name}设置已保存！`);
          setProviderModalVisible(false);
        }
      })
      .catch((err) => {
        console.error('验证表单失败:', err);
      });
  };

  // 添加新的提供商
  const handleAddProvider = () => {
    addProviderForm
      .validateFields()
      .then((values) => {
        const id = `custom-provider-${Date.now()}`;
        const newProvider: ProviderType = {
          id,
          name: values.name,
          apiKey: values.apiKey,
          baseUrl: values.baseUrl,
          models: [],
        };

        addProvider(newProvider);
        addProviderForm.resetFields();
        setNewCustomLogo('');
        setAddProviderModalVisible(false);
        messageApi.success('已添加新的服务提供商', 1);
      })
      .catch((err) => {
        console.error('验证添加提供商表单失败:', err);
      });
  };

  // 预览Logo URL
  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCustomLogo(e.target.value);
  };

  // 处理侧边栏位置点击
  const handleSidebarPositionClick = () => {
    if (chrome.sidePanel) {
      chrome.tabs.create({ url: 'chrome://settings/sidePanel' });
    } else {
      messageApi.error(
        '您的浏览器不支持侧边栏设置，请升级到Chrome 114或更高版本'
      );
    }
  };

  // 处理退出登录点击
  const handleLogout = () => {
    logout();
    messageApi.info('已退出登录');
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
      {/* 账户设置部分 */}
      <StyledSection>
        <StyledTitle level={4}>账户</StyledTitle>
        <StyledDivider />

        <Card size="small" hoverable>
          <Flex align="center" justify="space-between">
            <Avatar
              size={64}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#6e59f2' }}
            >
              {account?.name?.charAt(0) || ''}
            </Avatar>
            <UserInfo>
              <Text strong style={{ fontSize: 16 }}>
                {account?.name || '访客用户'}
              </Text>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {account?.email || '未登录'}
              </Paragraph>
            </UserInfo>
            <UserActions>
              <LogoutButton onClick={handleLogout} icon={<LogoutOutlined />}>
                {account ? '退出登录' : '登录'}
              </LogoutButton>
            </UserActions>
          </Flex>
        </Card>
      </StyledSection>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={saveSettings}
        style={{ maxWidth: 800 }}
      >
        {/* AI访问设置部分 */}
        <StyledSection>
          <StyledTitle level={4}>AI访问</StyledTitle>
          <StyledDivider />

          <Card size="small" hoverable>
            <Label>服务提供商</Label>
            <div>
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                您的AI密钥会本地存储在您的浏览器中，绝不会发送到其他地方。注意：由于技术原因，某些功能仅限于Sider模式。
              </Paragraph>

              {providers.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {providers.map((provider) => (
                    <Col span={12} key={provider.id}>
                      <ProviderItem>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfigClick(provider.id);
                            }}
                          >
                            设置
                          </Button>
                          <Popconfirm
                            title="确定要删除该提供商吗？"
                            okText="是"
                            cancelText="否"
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              handleDeleteProvider(provider.id);
                            }}
                          >
                            <Button
                              danger
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>
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
                添加服务提供商
              </AddProviderButton>
            </div>
          </Card>
        </StyledSection>

        {/* 外观设置部分 */}
        <StyledSection>
          <TitleWithIcon>
            <SettingOutlined />
            <StyledTitle level={4}>外观</StyledTitle>
          </TitleWithIcon>
          <StyledDivider />
          <Card size="small" hoverable>
            <Flex justify="space-between" align="center">
              <Label>显示模式</Label>
              <Form.Item name="displayMode" noStyle>
                <Select
                  style={{ width: 200 }}
                  options={[
                    {
                      label: '自动',
                      value: 'auto',
                    },
                    {
                      label: '明亮',
                      value: 'light',
                    },
                    {
                      label: '暗黑',
                      value: 'dark',
                    },
                  ]}
                />
              </Form.Item>
            </Flex>

            <Flex justify="space-between" align="center">
              <Label>显示语言</Label>
              <Form.Item name="language" noStyle>
                <Select style={{ width: 200 }}>
                  <Option value="zh-CN">简体中文</Option>
                  <Option value="en-US">English</Option>
                </Select>
              </Form.Item>
            </Flex>
          </Card>
        </StyledSection>
        <StyledSection>
          <Card size="small" hoverable>
            <Flex justify="space-between" align="center">
              <Label>消息字体大小</Label>
              <Form.Item name="fontSize" noStyle>
                <Select
                  options={[
                    {
                      label: '12px',
                      value: 12,
                    },
                    {
                      label: '14px',
                      value: 14,
                    },
                    {
                      label: '16px',
                      value: 16,
                    },
                    {
                      label: '18px',
                      value: 18,
                    },
                    {
                      label: '20px',
                      value: 20,
                    },
                  ]}
                  style={{ width: 200 }}
                />
              </Form.Item>
            </Flex>
          </Card>
        </StyledSection>
        <StyledSection>
          <Card size="small" hoverable>
            <Flex justify="space-between" align="center">
              <Label>侧边栏位置</Label>
              <Button
                icon={<GlobalOutlined />}
                onClick={handleSidebarPositionClick}
              >
                打开浏览器侧边栏设置
              </Button>
            </Flex>
          </Card>
        </StyledSection>
        {/* 朗读设置部分 */}
        <StyledSection>
          <TitleWithIcon>
            <SoundOutlined />
            <StyledTitle level={4}>朗读</StyledTitle>
          </TitleWithIcon>
          <StyledDivider />

          <Card size="small" hoverable>
            <Flex justify="space-between" align="center">
              <Label>朗读语音</Label>
              <Form.Item name="voiceType" noStyle>
                <Select style={{ width: 200 }}>
                  <Option value="robot">Robot</Option>
                </Select>
              </Form.Item>
            </Flex>
            <Flex justify="space-between" align="center">
              <Label>朗读速度</Label>
              <Form.Item name="voiceSpeed" noStyle>
                <Select
                  style={{ width: 200 }}
                  options={[
                    {
                      label: '0.25x',
                      value: 0.25,
                    },
                    {
                      label: '0.5x',
                      value: 0.5,
                    },
                    {
                      label: '0.75x',
                      value: 0.75,
                    },
                    {
                      label: '1.0x',
                      value: 1,
                    },
                    {
                      label: '1.25x',
                      value: 1.25,
                    },
                    {
                      label: '1.5x',
                      value: 1.5,
                    },
                    {
                      label: '1.75x',
                      value: 1.75,
                    },
                    {
                      label: '2.0x',
                      value: 2,
                    },
                  ]}
                />
              </Form.Item>
            </Flex>
          </Card>
        </StyledSection>
      </Form>

      {/* 提供商配置弹窗 */}
      <Modal
        title={null}
        open={providerModalVisible}
        onCancel={() => setProviderModalVisible(false)}
        footer={null}
        width={600}
        closeIcon={<CloseOutlined />}
      >
        <Form form={providerForm} layout="vertical">
          <ModalTitle>{currentProvider?.name}</ModalTitle>

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
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <ConnectionCheckSection>
            <Text>检查连接</Text>
            <Paragraph type="secondary" style={{ margin: '8px 0 16px 0' }}>
              检查您的API密钥和代理URL（如果使用）是否有效。
            </Paragraph>
            <Button
              type="default"
              onClick={handleConnectionCheck}
              loading={isConnectionChecking}
              style={{
                color:
                  connectionStatus === 'success'
                    ? '#52c41a'
                    : connectionStatus === 'error'
                    ? '#ff4d4f'
                    : undefined,
                borderColor:
                  connectionStatus === 'success'
                    ? '#52c41a'
                    : connectionStatus === 'error'
                    ? '#ff4d4f'
                    : undefined,
              }}
            >
              检查
            </Button>
          </ConnectionCheckSection>

          <Divider style={{ margin: '24px 0' }} />

          <ModelListHeader>
            <Text strong>模型列表 （{currentModels.length}个模型可用）</Text>
            <Tooltip title="添加自定义模型">
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={handleAddModel}
              />
            </Tooltip>
          </ModelListHeader>

          {currentModels.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              {currentModels.map((model) => (
                <ModelItem key={model.id}>
                  <ModelInfo>
                    <ModelName>{model.name}</ModelName>
                    <ModelDescription>
                      {model.description || model.value}
                    </ModelDescription>
                  </ModelInfo>
                  <ModelActions>
                    <Switch
                      checked={model.enabled}
                      onChange={(checked) =>
                        handleModelSwitchChange(model.id, checked)
                      }
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditModel(model)}
                    />
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteModel(model.id)}
                    />
                  </ModelActions>
                </ModelItem>
              ))}
            </div>
          ) : (
            <Empty description="暂无模型" style={{ margin: '24px 0' }} />
          )}

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <Button type="primary" onClick={saveProviderSettings}>
              保存
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 添加/编辑模型弹窗 */}
      <Modal
        title={isEditingModel ? '编辑模型' : '添加模型'}
        open={isAddingModel || isEditingModel}
        onCancel={() => {
          setIsAddingModel(false);
          setIsEditingModel(false);
          setCurrentEditingModel(null);
          modelForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={modelForm}
          layout="vertical"
          initialValues={{
            enabled: true,
          }}
        >
          <Form.Item
            name="name"
            label="模型名称"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="例如: GPT-4" />
          </Form.Item>

          <Form.Item
            name="value"
            label="模型值"
            rules={[{ required: true, message: '请输入模型值' }]}
            tooltip="模型的实际API值，例如'gpt-4-1106-preview'"
          >
            <Input placeholder="例如: gpt-4-1106-preview" />
          </Form.Item>

          <Form.Item name="description" label="模型描述">
            <Input placeholder="例如: OpenAI最强大的模型" />
          </Form.Item>

          <Form.Item name="enabled" valuePropName="checked" label="启用模型">
            <Switch />
          </Form.Item>

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <Button
              onClick={() => {
                setIsAddingModel(false);
                setIsEditingModel(false);
                setCurrentEditingModel(null);
                modelForm.resetFields();
              }}
            >
              取消
            </Button>
            <Button type="primary" onClick={handleSaveModel}>
              保存
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 添加提供商弹窗 */}
      <Modal
        title="添加服务提供商"
        open={addProviderModalVisible}
        onCancel={() => setAddProviderModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={addProviderForm} layout="vertical">
          <Form.Item
            name="name"
            label="提供商名称"
            rules={[{ required: true, message: '请输入提供商名称' }]}
          >
            <Input placeholder="例如: Custom AI" />
          </Form.Item>

          <Form.Item
            name="logoUrl"
            label="Logo URL"
            help="提供商的图标URL，不填则使用默认图标"
          >
            <Input
              placeholder="https://example.com/logo.png"
              onChange={handleLogoUrlChange}
              suffix={
                newCustomLogo ? (
                  <img
                    src={newCustomLogo}
                    alt="Logo预览"
                    width="16"
                    height="16"
                    style={{ marginRight: 8 }}
                  />
                ) : null
              }
            />
          </Form.Item>

          <Form.Item name="apiKey" label="API key">
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
            <Button type="primary" onClick={handleAddProvider}>
              添加
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default GeneralSettings;
