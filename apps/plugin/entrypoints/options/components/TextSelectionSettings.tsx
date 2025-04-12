import {
  ControlOutlined,
  GlobalOutlined,
  PlusOutlined
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
import React from 'react';
import { useConfigStore, useTextSelection } from '../../stores/configStore';
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
 * 划词助手设置组件
 * 管理划词功能和划词助手相关配置
 */
const TextSelectionSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [forbiddenWebsite, setForbiddenWebsite] = React.useState<string>('');

  // 从store获取划词助手设置和更新方法
  const textSelection = useTextSelection();
  const { forbiddenWebsites } = textSelection;
  const { updateTextSelection } = useConfigStore();

  // 加载设置到表单
  React.useEffect(() => {
    form.setFieldsValue({
      ...textSelection,
    });
  }, [form, textSelection]);

  // 保存设置
  const handleValuesChange = (changedValues: any, allValues: any) => {
    updateTextSelection(changedValues);
    messageApi.success('设置已保存');
  };

  // 添加禁用网站
  const handleAddForbiddenWebsite = () => {
    if (!forbiddenWebsite) {
      messageApi.info('请先设置禁用网站');
      return
    };

    if (forbiddenWebsites.includes(forbiddenWebsite)) {
      messageApi.error('该网站已在列表中');
      return;
    }

    const newForbiddenWebsites = [
      ...forbiddenWebsites,
      forbiddenWebsite,
    ];
    updateTextSelection({ forbiddenWebsites: newForbiddenWebsites });
  };

  // 移除禁用网站
  const handleRemoveForbiddenWebsite = (site: string) => {
    const newForbiddenWebsites = forbiddenWebsites.filter(
      (s: string) => s !== site
    );
    form.setFieldsValue({ forbiddenWebsites: newForbiddenWebsites });
    updateTextSelection({ forbiddenWebsites: newForbiddenWebsites });
  };

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        style={{ maxWidth: 800 }}
      >
        {/* 划词助手基本设置 */}
        <StyledSection>
          <TitleWithIcon>
            <ControlOutlined />
            <StyledTitle level={4}>开关</StyledTitle>
          </TitleWithIcon>

          <StyledCard>
            <Flex justify="space-between" align="center">
              <Label>
                网页文本划词
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  为网页上的选中文本提供快速操作菜单
                </Text>
              </Label>
              <Form.Item
                name="enableTextSelection"
                noStyle
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Flex>
            <StyledDivider />
            <Flex justify="space-between" align="center">
              <Label>
                写作文本划词
                <Text
                  type="secondary"
                  style={{
                    display: 'block',
                    fontWeight: 400,
                  }}
                >
                  为输入框中选中文本提供快速操作菜单
                </Text>
              </Label>
              <Form.Item
                name="enableWriteTextSelection"
                noStyle
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Flex>
          </StyledCard>
        </StyledSection>

        <StyledSection>
          <TitleWithIcon>
            <ControlOutlined />
            <StyledTitle level={4}>显示</StyledTitle>
          </TitleWithIcon>
          <StyledCard>
            <Label>触发条件</Label>
            <Form.Item name="triggerCondition" noStyle>
              <Radio.Group
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginLeft: 12,
                }}
              >
                <Radio value="selectText">当选择文本时</Radio>
                <Radio value="selectTextAndHotkey">
                  <Flex align="center" gap={4}>
                    <div style={{ width: 115 }}>当选择文本并按下</div>
                    <Form.Item name="hotkey" noStyle>
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
                    <div>时</div>
                  </Flex>
                </Radio>
              </Radio.Group>
            </Form.Item>
            <StyledDivider />
            <Flex justify="space-between" align="center">
              <Label>管理划词助手的提示词</Label>
              <Button
                icon={<GlobalOutlined />}
                onClick={() => {
                  // TODO
                }}
              >
                去设置
              </Button>
            </Flex>
          </StyledCard>
        </StyledSection>

        <StyledSection>
          <StyledCard>
            <Label>在网站上已禁用</Label>
            <Paragraph style={{ padding: '0 12px' }}>
              在这些网站上将不会显示划词助手
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
                  )
                )}
              </Space>
            </div>

            <Flex style={{ padding: '0 12px' }}>
              <Input
                placeholder="输入网站域名 (例如: example.com)"
                value={forbiddenWebsite}
                onChange={(e) => setForbiddenWebsite(e.target.value)}
                style={{ marginRight: 8 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleAddForbiddenWebsite()}
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

export default TextSelectionSettings;
