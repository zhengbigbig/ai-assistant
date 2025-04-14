import {
  CodeOutlined,
  GlobalOutlined,
  LinkOutlined,
  PictureOutlined,
  PlusOutlined,
  SearchOutlined,
  YoutubeOutlined
} from '@ant-design/icons';
import {
  Button,
  Flex,
  Form,
  Input,
  message,
  Radio,
  Space,
  Select,
  Switch,
  Tag,
  Typography
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useConfigStore, useWebHelper } from '../../stores/configStore';
import type { WebHelperSettings } from '../../stores/configStore';
import {
  Label,
  StyledCard,
  StyledDivider,
  StyledSection,
  StyledTitle,
  TitleWithIcon
} from './Wrapper';

const { Text, Paragraph, Title } = Typography;

/**
 * 网页助手设置组件
 * 管理网页内容增强和分析相关的配置
 */
const WebHelperSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [allowedWebsite, setAllowedWebsite] = useState<string>('');
  const [formValues, setFormValues] = useState<WebHelperSettings | null>(null);

  // 从store获取网页助手设置和更新方法
  const webHelper = useWebHelper();
  const { allowedWebsites } = webHelper;
  const { updateWebHelper } = useConfigStore();

  // 确保enable开关使用默认值
  const formInitialValues: WebHelperSettings = {
    enableForSearch: true,
    searchAnswerDisplay: 'always',
    enableForYoutube: true,
    enableForLinks: true,
    enableForImages: true,
    enableForCode: true,
    enableInputCompletion: true,
    allowedWebsites: ['docs.google.com'],
    enableForArticle: false,
    articleAnswerDisplay: 'always',
    showSidePanel: true,
    sidePanelPosition: 'right',
    chatLanguage: 'zh-CN'
  };

  // 加载设置到表单
  useEffect(() => {
    console.log('加载网页助手设置', webHelper);
    if (webHelper) {
      // 合并默认值和存储的值
      const mergedValues = {
        ...formInitialValues,
        ...webHelper
      };
      form.setFieldsValue(mergedValues);
      setFormValues(mergedValues);
    }
  }, [form, webHelper]);

  // 保存设置
  const handleValuesChange = (changedValues: any, allValues: any) => {
    console.log('保存网页助手设置', changedValues, allValues);
    updateWebHelper(changedValues);
    setFormValues(allValues);
    messageApi.success('设置已保存');
  };

  // 添加允许网站
  const handleAddAllowedWebsite = () => {
    if (!allowedWebsite) {
      messageApi.info('请先设置允许的网站');
      return;
    }

    const websiteList = allowedWebsites || [];

    if (websiteList.includes(allowedWebsite)) {
      messageApi.error('该网站已在列表中');
      return;
    }

    const newAllowedWebsites = [...websiteList, allowedWebsite];
    updateWebHelper({ allowedWebsites: newAllowedWebsites });
    setAllowedWebsite('');
  };

  // 移除允许网站
  const handleRemoveAllowedWebsite = (site: string) => {
    const newAllowedWebsites = (allowedWebsites || []).filter(
      (s: string) => s !== site
    );
    updateWebHelper({ allowedWebsites: newAllowedWebsites });
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
        {/* 用于搜索的设置 */}
        <StyledSection>
          <TitleWithIcon>
            <SearchOutlined />
            <StyledTitle level={4}>用于搜索</StyledTitle>
          </TitleWithIcon>

          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>
                在搜索结果旁显示AI答案
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  在搜索结果页面右侧显示AI生成的响应内容
                </Text>
              </Label>
              <Form.Item name="enableForSearch" noStyle valuePropName="checked">
                <Switch />
              </Form.Item>
            </Flex>
            {formValues?.enableForSearch && (
              <>
                <Form.Item name="searchAnswerDisplay" noStyle>
                  <Radio.Group
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      marginLeft: 12,
                    }}
                  >
                    <Radio value="always">总是</Radio>
                    <Radio value="whenHovered">当查询词被鼠标悬停时</Radio>
                    <Radio value="whenClicked">当点击问答按钮时</Radio>
                  </Radio.Group>
                </Form.Item>
              </>
            )}
          </StyledCard>
        </StyledSection>

        {/* 用于YouTube的设置 */}
        <StyledSection>
          <TitleWithIcon>
            <YoutubeOutlined />
            <StyledTitle level={4}>用于YouTube</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>
                在YouTube上显示摘要面板
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  允许在视频播放网站上提供视频摘要和亮点
                </Text>
              </Label>
              <Form.Item name="enableForYoutube" noStyle valuePropName="checked">
                <Switch />
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>

        {/* 用于链接预览的设置 */}
        <StyledSection>
          <TitleWithIcon>
            <LinkOutlined />
            <StyledTitle level={4}>用于链接预览</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>
                拖动链接时显示链接预览窗口
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  当鼠标拖动链接时，会显示预览页面信息
                </Text>
              </Label>
              <Form.Item name="enableForLinks" noStyle valuePropName="checked">
                <Switch />
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>

        {/* 用于图片的设置 */}
        <StyledSection>
          <TitleWithIcon>
            <PictureOutlined />
            <StyledTitle level={4}>用于图片</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>
                在图像悬停时显示AI工具
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  允许使用AI分析和处理图像内容
                </Text>
              </Label>
              <Form.Item name="enableForImages" noStyle valuePropName="checked">
                <Switch />
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>

        {/* 用于代码的设置 */}
        <StyledSection>
          <TitleWithIcon>
            <CodeOutlined />
            <StyledTitle level={4}>用于代码</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>
                在代码块中显示解释代码按钮
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  允许快速解析和解释网页中的代码片段
                </Text>
              </Label>
              <Form.Item name="enableForCode" noStyle valuePropName="checked">
                <Switch />
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>

        {/* 输入框设置 */}
        <StyledSection>
          <TitleWithIcon>
            <GlobalOutlined />
            <StyledTitle level={4}>输入框</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>
                在输入框中显示光标以增强写作
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  帮助用户在输入框中快速编写和完善内容
                </Text>
              </Label>
              <Form.Item name="enableInputCompletion" noStyle valuePropName="checked">
                <Switch />
              </Form.Item>
            </Flex>

            <StyledDivider />

            <Label>在网站上已禁用</Label>
            <Paragraph style={{ padding: '0 12px' }}>
              在这些网站上将不会使用网页助手功能
            </Paragraph>

            <div style={{ padding: '0 12px', marginBottom: 16 }}>
              <Space size={[0, 8]} wrap>
                {(allowedWebsites || []).map((site: string) => (
                  <Tag
                    key={site}
                    closable
                    onClose={() => handleRemoveAllowedWebsite(site)}
                    style={{ marginBottom: 8 }}
                  >
                    {site}
                  </Tag>
                ))}
              </Space>
            </div>

            <Flex style={{ padding: '0 12px' }}>
              <Input
                placeholder="输入网站域名 (例如: docs.google.com)"
                value={allowedWebsite}
                onChange={(e) => setAllowedWebsite(e.target.value)}
                style={{ marginRight: 8 }}
                onPressEnter={handleAddAllowedWebsite}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddAllowedWebsite}
              >
                添加
              </Button>
            </Flex>
          </StyledCard>
        </StyledSection>
      </Form>
    </>
  );
};

export default WebHelperSettings;
