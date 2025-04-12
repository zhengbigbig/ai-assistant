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
 * 智能菜单设置组件
 * 管理右键菜单的相关配置和选项
 */
const SmartMenuSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'enableSmartMenu',
        'smartMenuOptions',
      ],
      (result) => {
        form.setFieldsValue({
          enableSmartMenu: result.enableSmartMenu !== undefined ? result.enableSmartMenu : true,
          smartMenuOptions: result.smartMenuOptions || ['summarize', 'translate'],
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
      <StyledTitle level={3}>智能菜单</StyledTitle>
      <StyledDivider />

      <Form
        form={form}
        layout="vertical"
        onFinish={saveSettings}
        style={{ maxWidth: 800 }}
      >
        <Form.Item
          name="enableSmartMenu"
          label="启用智能菜单"
          valuePropName="checked"
          extra="允许通过右键菜单快速访问AI助手功能"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="smartMenuOptions"
          label="菜单选项"
          extra="选择显示在智能菜单中的选项"
        >
          <Select mode="multiple">
            <Option value="summarize">摘要</Option>
            <Option value="translate">翻译</Option>
            <Option value="explain">解释</Option>
            <Option value="rewrite">改写</Option>
            <Option value="analyze">分析</Option>
            <Option value="code">生成代码</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="menuDisplayOrder"
          label="菜单显示顺序"
          extra="选择菜单选项的显示顺序"
        >
          <Select>
            <Option value="alphabetical">按字母顺序</Option>
            <Option value="custom">自定义顺序</Option>
            <Option value="mostUsed">常用优先</Option>
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

export default SmartMenuSettings;
