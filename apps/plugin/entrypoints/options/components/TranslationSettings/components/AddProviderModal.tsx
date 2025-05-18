import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Button, Form, Input, Modal } from 'antd';
import React from 'react';

interface AddProviderModalProps {
  open: boolean;
  onCancel: () => void;
  onAdd: () => void;
}

/**
 * 添加翻译服务提供商弹窗
 */
const AddProviderModal: React.FC<AddProviderModalProps> = ({
  open,
  onCancel,
  onAdd,
}) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title="添加翻译服务提供商"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="翻译服务名称"
          rules={[{ required: true, message: '请输入翻译服务名称' }]}
        >
          <Input placeholder="例如: 自定义翻译服务" />
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
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={onAdd}>
            添加
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddProviderModal;
