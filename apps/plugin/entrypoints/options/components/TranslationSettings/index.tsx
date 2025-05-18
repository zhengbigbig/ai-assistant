import {
  ControlOutlined,
  DeleteOutlined,
  EditOutlined,
  FormOutlined,
  PlusOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import {
  App,
  Button,
  Col,
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  DISPLAY_MODE_OPTIONS,
  TARGET_LANGUAGE_OPTIONS,
  TRANSLATION_HOTKEY_OPTIONS,
} from '@/constants/config';
import type {
  CustomStyleConfig,
  ProviderType,
  TranslationSettings as TranslationSettingsType,
} from '@/entrypoints/stores/configStore';
import {
  useConfigStore,
  useProviders,
  useSelectedProvider,
  useTranslation,
} from '@/entrypoints/stores/configStore';
import { injectCustomStyleToHtml } from '@/utils/css';
import {
  Label,
  ProviderActions,
  ProviderInfo,
  ProviderItem,
  ProviderLogo,
  ProviderName,
  StyledCard,
  StyledDivider,
  StyledSection,
  StyledTitle,
  StyleOptionLabel,
  TitleWithIcon,
} from './Wrapper';
import {
  AddProviderModal,
  CustomDictionaryModal,
  CustomStyleModal,
  ProviderConfigModal,
} from './components';

const { Text, Paragraph } = Typography;

/**
 * 翻译设置组件
 * 管理页面翻译和文本翻译相关的配置
 */
const TranslationSettings: React.FC = () => {
  const [form] = Form.useForm();
  const { message: messageApi, modal } = App.useApp();
  const [forbiddenWebsite, setForbiddenWebsite] = useState<string>('');
  const [translationProviderModal, setTranslationProviderModal] =
    useState(false);
  const [currentProvider, setCurrentProvider] = useState<ProviderType | null>(
    null
  );
  const [translationProviderForm] = Form.useForm();
  const [addProviderModalVisible, setAddProviderModalVisible] = useState(false);
  const [addProviderForm] = Form.useForm();

  // 自定义词典相关状态
  const [customDictionaryModalVisible, setCustomDictionaryModalVisible] =
    useState(false);

  // 自定义样式相关状态
  const [customStyleModalVisible, setCustomStyleModalVisible] = useState(false);
  const [currentCustomStyle, setCurrentCustomStyle] =
    useState<CustomStyleConfig | null>(null);
  const [customStyleEditorMode, setCustomStyleEditorMode] = useState<
    'create' | 'edit'
  >('create');

  // 从store获取翻译设置和更新方法
  const translation = useTranslation();
  const {
    forbiddenWebsites,
    customDictionary = {},
    customStyles = [],
    displayStyle,
  } = translation;
  const currentCustomCss =
    customStyles.find((it) => it?.name === displayStyle)?.css || '';
  const {
    updateTranslation,
    addCustomDictionaryEntry,
    removeCustomDictionaryEntry,
    addCustomStyle,
    updateCustomStyle,
  } = useConfigStore();
  const providers = useProviders();
  const selectedProvider = useSelectedProvider();

  // 监听样式变化并注入
  useEffect(() => {
    if (currentCustomCss) {
      injectCustomStyleToHtml(currentCustomCss);
    }
  }, [currentCustomCss]);

  // 确保enable开关使用默认值
  const formInitialValues: TranslationSettingsType = {
    targetLanguage: 'zh-CN',
    displayMode: 'dual',
    translationService: 'google',
    displayStyle: 'underline',
    forbiddenWebsites: [],
    enableVideoSubtitleTranslation: true,
    enableInputTranslation: false,
    enableHoverTranslation: true,
    hoverHotkey: 'option',
    hoverTranslationService: 'google',
    customDictionary: {},
    customStyles: [],
  };

  // 加载设置到表单
  useEffect(() => {
    console.log('加载翻译设置', translation);
    if (translation) {
      // 合并默认值和存储的值
      const mergedValues = {
        ...translation,
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
    if (!providers.some((p) => p.id === 'google')) {
      addProvider({
        id: 'google',
        name: '谷歌翻译',
        apiKey: '',
        baseUrl: 'https://translate.googleapis.com/translate_a/single',
        models: [],
      });
    }

    // 检查是否存在智谱GLM翻译
    if (!providers.some((p) => p.id === 'glm')) {
      addProvider({
        id: 'glm',
        name: '智谱GLM翻译',
        apiKey: '',
        baseUrl: '',
        models: [],
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
  const handleTranslationProviderConfig = (
    e: React.MouseEvent,
    providerId: string
  ) => {
    e.stopPropagation(); // 阻止事件冒泡
    const provider = providers.find((p) => p.id === providerId);
    if (provider) {
      setCurrentProvider(provider);
      translationProviderForm.setFieldsValue({
        id: provider.id,
        name: provider.name,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
      });
      setTranslationProviderModal(true);
    }
  };

  // 处理删除翻译服务提供商
  const handleDeleteTranslationProvider = (
    e: React.MouseEvent,
    providerId: string
  ) => {
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
    addProviderForm.validateFields().then((values) => {
      const { addProvider } = useConfigStore.getState();
      const newProviderId = 'translation-' + Date.now().toString();

      addProvider({
        id: newProviderId,
        name: values.name,
        apiKey: values.apiKey || '',
        baseUrl: values.baseUrl || '',
        models: [],
      });

      messageApi.success('翻译服务提供商已添加');
      setAddProviderModalVisible(false);
      addProviderForm.resetFields();
    });
  };

  // 保存翻译提供商设置
  const saveTranslationProviderSettings = () => {
    translationProviderForm.validateFields().then((values) => {
      if (currentProvider) {
        // 这里使用configStore中的updateProvider方法更新提供商信息
        const { updateProvider } = useConfigStore.getState();
        updateProvider(currentProvider.id, {
          apiKey: values.apiKey,
          baseUrl: values.baseUrl,
        });
        messageApi.success('翻译服务提供商设置已保存');
        setTranslationProviderModal(false);
      }
    });
  };

  // 添加自定义词典条目
  const handleAddCustomDictionaryEntry = (keyword: string, value: string) => {
    if (!keyword) {
      messageApi.info('请输入关键词');
      return;
    }

    if (!value) {
      messageApi.info('请输入替换值');
      return;
    }

    // 检查是否已存在相同关键词
    if (keyword in customDictionary) {
      messageApi.warning('该关键词已存在');
      return;
    }

    // 添加到词典
    addCustomDictionaryEntry(keyword, value);
    messageApi.success('添加成功');
  };

  // 删除自定义词典条目
  const handleDeleteCustomDictionaryEntry = (keyword: string) => {
    removeCustomDictionaryEntry(keyword);
    messageApi.success('删除成功');
  };

  // 打开自定义词典模态框
  const openCustomDictionaryModal = () => {
    setCustomDictionaryModalVisible(true);
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

  // 打开自定义样式弹窗 - 创建新样式
  const openCustomStyleModal = () => {
    setCustomStyleEditorMode('create');
    setCurrentCustomStyle(null);
    setCustomStyleModalVisible(true);
  };

  // 打开自定义样式弹窗 - 编辑已有样式
  const openEditCustomStyleModal = (style: CustomStyleConfig) => {
    setCustomStyleEditorMode('edit');
    setCurrentCustomStyle(style);
    setCustomStyleModalVisible(true);
  };

  // 保存自定义样式
  const saveCustomStyle = (values: { name: string; css: string }) => {
    const { addCustomStyle, updateCustomStyle, updateTranslation } =
      useConfigStore.getState();

    if (customStyleEditorMode === 'create') {
      // 检查样式名称是否重复
      if (customStyles.some((style) => style.name === values.name)) {
        messageApi.error('样式名称已存在，请使用不同的名称');
        return;
      }

      // 创建新样式
      const newStyle: CustomStyleConfig = {
        name: values.name,
        css: values.css,
      };

      // 添加自定义样式（添加到最前面）
      addCustomStyle(newStyle, true);

      // 设置显示风格为新创建的样式名称
      updateTranslation({
        displayStyle: newStyle.name,
      });

      messageApi.success('自定义样式已保存');
    } else if (currentCustomStyle) {
      // 检查是否修改了名称且新名称已存在
      if (
        values.name !== currentCustomStyle.name &&
        customStyles.some((style) => style.name === values.name)
      ) {
        messageApi.error('样式名称已存在，请使用不同的名称');
        return;
      }

      // 更新已有样式
      updateCustomStyle(currentCustomStyle.name, {
        name: values.name,
        css: values.css,
      });

      // 如果修改了名称，更新当前选中的样式名称
      if (
        values.name !== currentCustomStyle.name &&
        displayStyle === currentCustomStyle.name
      ) {
        updateTranslation({
          displayStyle: values.name,
        });
      }

      messageApi.success('自定义样式已更新');
    }

    setCustomStyleModalVisible(false);
  };

  // 删除自定义样式
  const handleDeleteCustomStyle = (styleName: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这个自定义样式吗？',
      onOk: () => {
        const { removeCustomStyle } = useConfigStore.getState();
        removeCustomStyle(styleName);
        messageApi.success('自定义样式已删除');
      },
    });
  };

  // 处理重置样式
  const handleResetAllStyles = () => {
    modal.confirm({
      title: '确认重置样式',
      content: '将重置所有样式',
      onOk: () => {
        const { resetAllCustomStyles } = useConfigStore.getState();
        resetAllCustomStyles();
        messageApi.success('样式已重置');
      },
    });
  };

  return (
    <>
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
                      className={
                        translation.translationService === provider.id
                          ? 'selected'
                          : ''
                      }
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
                          onClick={(e) =>
                            handleTranslationProviderConfig(e, provider.id)
                          }
                        >
                          设置
                        </Button>
                        <Button
                          danger
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) =>
                            handleDeleteTranslationProvider(e, provider.id)
                          }
                          disabled={
                            provider.id === 'google' || provider.id === 'glm'
                          }
                        />
                      </ProviderActions>
                    </ProviderItem>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="暂无服务提供商" />
            )}

            <Button
              icon={<PlusOutlined />}
              onClick={() => setAddProviderModalVisible(true)}
              style={{ width: '100%', marginTop: 16, borderStyle: 'dashed' }}
            >
              添加翻译服务提供商
            </Button>

            <StyledDivider />

            <Flex justify="space-between" align="center">
              <Label>目标语言</Label>
              <Form.Item name="targetLanguage" noStyle>
                <Select
                  style={{ width: 200 }}
                  options={TARGET_LANGUAGE_OPTIONS}
                />
              </Form.Item>
            </Flex>

            <StyledDivider />

            <Flex justify="space-between" align="center">
              <Label>显示模式</Label>
              <Form.Item name="displayMode" noStyle>
                <Select style={{ width: 200 }} options={DISPLAY_MODE_OPTIONS} />
              </Form.Item>
            </Flex>

            <StyledDivider />

            <Flex justify="space-between" align="center">
              <Label>显示风格</Label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Form.Item name="displayStyle" noStyle>
                  <Select
                    style={{ width: 200 }}
                    options={customStyles.map((style) => {
                      return {
                        value: style.name, // 使用 id 或 name 作为值
                        label: (
                          <StyleOptionLabel>
                            <span>{style.name}</span>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              style={{marginRight:8}}
                            >
                              <EditOutlined
                                className="edit-icon"
                                onClick={() => {
                                  openEditCustomStyleModal(style);
                                }}
                                style={{ marginRight: 8 }}
                              />
                              <DeleteOutlined
                                className="edit-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteCustomStyle(style.name);
                                }}
                              />
                            </div>
                          </StyleOptionLabel>
                        ),
                      };
                    })}
                    optionLabelProp="children"
                    dropdownRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: '8px 0' }} />
                        <Button
                          type="text"
                          icon={<PlusOutlined />}
                          block
                          onClick={(e) => {
                            e.preventDefault();
                            openCustomStyleModal();
                          }}
                        >
                          添加自定义样式
                        </Button>
                      </>
                    )}
                  />
                </Form.Item>
                <Space style={{ marginLeft: 8 }}>
                  <Tooltip title="重置样式">
                    <Button
                      type="text"
                      size="small"
                      onClick={() => {
                        // 增加二次确认
                        modal.confirm({
                          title: '确认重置样式',
                          content: '将重置所有样式',
                          onOk: () => {
                            const { resetAllCustomStyles } =
                              useConfigStore.getState();
                            resetAllCustomStyles();
                            messageApi.success('样式已重置');
                          },
                        });
                      }}
                    >
                      重置
                    </Button>
                  </Tooltip>
                </Space>
              </div>
            </Flex>

            <StyledDivider />

            <Flex justify="space-between" align="center">
              <div>
                <Label>自定义词典</Label>
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                    marginTop: 4,
                  }}
                >
                  自定义词汇替换，翻译时保留特定词汇或自定义翻译结果
                </Text>
              </div>
              <Button
                type="primary"
                icon={<FormOutlined />}
                onClick={openCustomDictionaryModal}
              >
                管理词典
              </Button>
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
              <Form.Item
                name="enableHoverTranslation"
                noStyle
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Flex>

            <StyledDivider />

            <Label>触发条件</Label>
            <Flex
              align="center"
              gap={4}
              style={{ paddingLeft: 12, marginTop: 8 }}
            >
              <div style={{ width: 130 }}>当鼠标悬停并按下</div>
              <Form.Item name="hoverHotkey" noStyle>
                <Select
                  onClick={(e) => {
                    // 阻止事件
                    e.stopPropagation();
                    // 阻止默认行为
                    e.preventDefault();
                  }}
                  options={TRANSLATION_HOTKEY_OPTIONS}
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
                  {providers.map((provider) => (
                    <Select.Option key={provider.id} value={provider.id}>
                      {provider.name}
                    </Select.Option>
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
              <Form.Item
                name="enableVideoSubtitleTranslation"
                noStyle
                valuePropName="checked"
              >
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
              <Form.Item
                name="enableInputTranslation"
                noStyle
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>
      </Form>

      {/* 翻译服务提供商配置弹窗 */}
      <ProviderConfigModal
        open={translationProviderModal}
        provider={currentProvider}
        onCancel={() => setTranslationProviderModal(false)}
        onSave={saveTranslationProviderSettings}
      />

      {/* 添加翻译服务提供商弹窗 */}
      <AddProviderModal
        open={addProviderModalVisible}
        onCancel={() => setAddProviderModalVisible(false)}
        onAdd={handleAddTranslationProvider}
      />

      {/* 自定义词典管理弹窗 */}
      <CustomDictionaryModal
        open={customDictionaryModalVisible}
        onCancel={() => setCustomDictionaryModalVisible(false)}
        onAdd={handleAddCustomDictionaryEntry}
        onDelete={handleDeleteCustomDictionaryEntry}
        dictionaryData={customDictionary}
      />

      {/* 自定义样式编辑弹窗 */}
      <CustomStyleModal
        open={customStyleModalVisible}
        onCancel={() => setCustomStyleModalVisible(false)}
        onSave={saveCustomStyle}
        mode={customStyleEditorMode}
        currentStyle={currentCustomStyle}
      />
    </>
  );
};

export default TranslationSettings;
