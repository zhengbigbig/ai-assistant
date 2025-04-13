import {
  ControlOutlined,
  GlobalOutlined,
  PlusOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import {
  Button,
  Flex,
  Form,
  Input,
  message,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useConfigStore, useTranslation } from '../../stores/configStore';
import type { TranslationSettings } from '../../stores/configStore';
import {
  Label,
  StyledCard,
  StyledDivider,
  StyledSection,
  StyledTitle,
  TitleWithIcon,
} from './Wrapper';

const { Text, Paragraph } = Typography;

/**
 * 翻译设置组件
 * 管理页面翻译和文本翻译相关的配置
 */
const TranslationSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [forbiddenWebsite, setForbiddenWebsite] = useState<string>('');

  // 从store获取翻译设置和更新方法
  const translation = useTranslation();
  const { forbiddenWebsites } = translation;
  const { updateTranslation } = useConfigStore();

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
  }, [form, translation]);

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
            <Flex justify="space-between" align="center">
              <Label>翻译服务</Label>
              <Form.Item name="translationService" noStyle>
                <Select style={{ width: 200 }}>
                  <Select.Option value="google">谷歌翻译</Select.Option>
                  <Select.Option value="glm">智谱GLM翻译</Select.Option>
                  <Select.Option value="default">默认AI服务</Select.Option>
                </Select>
              </Form.Item>
            </Flex>

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
                  <Select.Option value="google">谷歌翻译</Select.Option>
                  <Select.Option value="glm">智谱GLM翻译</Select.Option>
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
    </>
  );
};

export default TranslationSettings;
