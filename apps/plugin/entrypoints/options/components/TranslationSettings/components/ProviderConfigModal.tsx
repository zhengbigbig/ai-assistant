import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Button, Form, Input, Modal } from 'antd';
import React from 'react';
import { ProviderType } from '../../../../stores/configStore';

interface ProviderConfigModalProps {
  open: boolean;
  provider: ProviderType | null;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * 翻译服务提供商配置弹窗
 */
const ProviderConfigModal: React.FC<ProviderConfigModalProps> = ({
  open,
  provider,
  onCancel,
  onSave,
}) => {
  const [form] = Form.useForm();

  // 组件挂载或provider变更时，重置表单
  React.useEffect(() => {
    if (provider) {
      form.setFieldsValue({
        id: provider.id,
        name: provider.name,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
      });
    }
  }, [form, provider]);

  return (
    <Modal
      title={provider?.name + ' 翻译配置'}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <Form form={form} layout="vertical">
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
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={onSave}>
            保存
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ProviderConfigModal;
