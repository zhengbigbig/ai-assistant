import {
  ProviderType,
  useAccount,
  useAppearance,
  useConfigStore,
  useProviders,
  useVoice
} from '@/entrypoints/stores/configStore';
import {
  ApiOutlined,
  GlobalOutlined,
  LogoutOutlined,
  PlusOutlined,
  SettingOutlined,
  SoundOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  App,
  Avatar,
  Button,
  Col,
  Flex,
  Form,
  Popconfirm,
  Row,
  Select,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  Label,
  StyledCard,
  StyledDivider,
  StyledSection,
  StyledTitle,
  TitleWithIcon,
} from '../Wrapper';
import {
  AddProviderButton,
  LogoutButton,
  ProviderActions,
  ProviderInfo,
  ProviderItem,
  ProviderLogo,
  ProviderName,
  UserActions,
  UserInfo,
} from './Wrapper';

import ProviderConfigModal from './components/ProviderConfigModal';
import {
  DISPLAY_MODE_OPTIONS,
  FONT_SIZE_OPTIONS,
  LANGUAGE_OPTIONS,
  VOICE_SPEED_OPTIONS,
  VOICE_TYPE_OPTIONS,
} from './constants';

const { Text, Paragraph } = Typography;

/**
 * 通用配置组件
 * 管理账户、API访问、外观和语言等基本设置
 */
const GeneralSettings: React.FC = () => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [isInitializing, setIsInitializing] = useState(true);

  // 提供商相关状态
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<ProviderType | null>(
    null
  );

  // 从store获取数据和方法
  const providers = useProviders();
  const appearance = useAppearance();
  const voice = useVoice();
  const account = useAccount();
  const {
    addProvider,
    updateProvider,
    removeProvider,
    updateAppearance,
    updateVoice,
    logout,
  } = useConfigStore();

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

    message.success('设置已保存！', 1);
  };

  // 处理配置按钮点击
  const handleConfigClick = (provider: ProviderType) => {
    setCurrentProvider(provider);
    setIsAddingProvider(false);
    setProviderModalVisible(true);
  };

  // 处理添加提供商点击
  const handleAddProviderClick = () => {
    // 创建一个空的提供商对象
    const emptyProvider: ProviderType = {
      name: '',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      models: [],
    };

    setCurrentProvider(emptyProvider);
    setIsAddingProvider(true);
    setProviderModalVisible(true);
  };

  // 处理删除提供商
  const handleDeleteProvider = (providerId: string) => {
    removeProvider(providerId);
    message.success('已删除服务提供商', 1);
  };

  // 保存提供商设置
  const saveProviderSettings = (values: ProviderType) => {
    if (isAddingProvider) {
      addProvider(values);
      message.success('已添加新的服务提供商', 1);
    } else if (currentProvider) {
      // 更新现有提供商
      updateProvider(currentProvider.name, {
        ...values,
      });
      message.success(`${currentProvider.name}设置已保存！`);
    }

    setProviderModalVisible(false);
    setIsAddingProvider(false);
  };

  // 处理侧边栏位置点击
  const handleSidebarPositionClick = () => {
    if (chrome.sidePanel) {
      chrome.tabs.create({ url: 'chrome://settings/sidePanel' });
    } else {
      message.error('您的浏览器不支持侧边栏设置，请升级到Chrome 114或更高版本');
    }
  };

  // 处理退出登录点击
  const handleLogout = () => {
    logout();
    message.info('已退出登录');
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
      {/* 账户设置部分 */}
      <StyledSection>
        <TitleWithIcon>
          <UserOutlined />
          <StyledTitle level={4}>账户</StyledTitle>
        </TitleWithIcon>
        <StyledCard>
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
              <LogoutButton onClick={handleLogout}>
                <LogoutOutlined />
                {account ? '退出登录' : '登录'}
              </LogoutButton>
            </UserActions>
          </Flex>
        </StyledCard>
      </StyledSection>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={saveSettings}
        style={{ maxWidth: 800 }}
      >
        {/* AI访问设置部分 */}
        <StyledSection>
          <TitleWithIcon>
            <ApiOutlined />
            <StyledTitle level={4}>AI访问</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Label>服务提供商</Label>
            <div>
              <Paragraph
                type="secondary"
                style={{ marginBottom: 16, marginLeft: 10 }}
              >
                您的AI密钥会本地存储在您的浏览器中，绝不会发送到其他地方。注意：由于技术原因，某些功能仅限于Sider模式。
              </Paragraph>

              {providers.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {providers.map((provider) => (
                    <Col span={12} key={provider.name}>
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
                              handleConfigClick(provider);
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
                              handleDeleteProvider(provider.name);
                            }}
                          >
                            <Button
                              danger
                              type="text"
                              size="small"
                              icon={<ApiOutlined />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>
                        </ProviderActions>
                      </ProviderItem>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 0',
                    color: 'rgba(0, 0, 0, 0.25)',
                  }}
                >
                  暂无服务提供商
                </div>
              )}

              <AddProviderButton onClick={handleAddProviderClick}>
                <PlusOutlined />
                添加服务提供商
              </AddProviderButton>
            </div>
          </StyledCard>
        </StyledSection>

        {/* 外观设置部分 */}
        <StyledSection>
          <TitleWithIcon>
            <SettingOutlined />
            <StyledTitle level={4}>外观</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>显示模式</Label>
              <Form.Item name="displayMode" noStyle>
                <Select style={{ width: 200 }} options={DISPLAY_MODE_OPTIONS} />
              </Form.Item>
            </Flex>
            <Flex justify="space-between" align="center">
              <Label>显示语言</Label>
              <Form.Item name="language" noStyle>
                <Select style={{ width: 200 }} options={LANGUAGE_OPTIONS} />
              </Form.Item>
            </Flex>
            <StyledDivider />
            <Flex justify="space-between" align="center">
              <Label>消息字体大小</Label>
              <Form.Item name="fontSize" noStyle>
                <Select options={FONT_SIZE_OPTIONS} style={{ width: 200 }} />
              </Form.Item>
            </Flex>
            <StyledDivider />
            <Flex justify="space-between" align="center">
              <Label>侧边栏位置</Label>
              <Button
                icon={<GlobalOutlined />}
                onClick={handleSidebarPositionClick}
              >
                打开浏览器侧边栏设置
              </Button>
            </Flex>
          </StyledCard>
        </StyledSection>
        {/* 朗读设置部分 */}
        <StyledSection>
          <TitleWithIcon>
            <SoundOutlined />
            <StyledTitle level={4}>朗读</StyledTitle>
          </TitleWithIcon>

          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>朗读语音</Label>
              <Form.Item name="voiceType" noStyle>
                <Select style={{ width: 200 }} options={VOICE_TYPE_OPTIONS} />
              </Form.Item>
            </Flex>
            <Flex justify="space-between" align="center">
              <Label>朗读速度</Label>
              <Form.Item name="voiceSpeed" noStyle>
                <Select style={{ width: 200 }} options={VOICE_SPEED_OPTIONS} />
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>
      </Form>

      {/* 提供商配置弹窗 */}
      <ProviderConfigModal
        open={providerModalVisible}
        provider={currentProvider}
        onCancel={() => {
          setProviderModalVisible(false);
          setIsAddingProvider(false);
        }}
        onSave={saveProviderSettings}
        isAddingProvider={isAddingProvider}
      />
    </>
  );
};

export default GeneralSettings;
