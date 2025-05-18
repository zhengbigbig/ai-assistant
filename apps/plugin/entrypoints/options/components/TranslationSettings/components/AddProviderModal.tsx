import { DeleteOutlined, EyeInvisibleOutlined, EyeTwoTone, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Table, Tooltip, Typography } from 'antd';
import React, { useState } from 'react';

const { TextArea } = Input;
const { Text } = Typography;

// 默认系统提示词模板
const DEFAULT_SYSTEM_PROMPT = '你是一个专业的翻译助手，请将用户输入的文本翻译成{{targetLanguage}}，只返回翻译结果，不要添加任何解释或额外内容。';

interface HeaderItem {
  key: string;
  value: string;
  id: string;
}

// 默认请求头配置示例
const DEFAULT_HEADERS = [
  { key: 'HTTP-Referer', value: 'https://your-site.com', id: '1' },
  { key: 'X-Title', value: 'Your Site Name', id: '2' }
];

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
  const [headerItems, setHeaderItems] = useState<HeaderItem[]>([]);

  // 处理添加新请求头
  const handleAddHeader = () => {
    const newItem: HeaderItem = {
      key: '',
      value: '',
      id: Date.now().toString()
    };
    setHeaderItems([...headerItems, newItem]);
  };

  // 处理删除请求头
  const handleRemoveHeader = (id: string) => {
    setHeaderItems(headerItems.filter(item => item.id !== id));
  };

  // 处理请求头变更
  const handleHeaderChange = (id: string, field: 'key' | 'value', value: string) => {
    setHeaderItems(
      headerItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue({
        systemPrompt: DEFAULT_SYSTEM_PROMPT,
      });
      // 初始化两个默认请求头示例
      setHeaderItems(DEFAULT_HEADERS.map(header => ({ ...header, id: `header-${Date.now()}-${header.id}` })));
    }
  }, [form, open]);

  // 提交表单时，将headerItems转换为headers对象
  const handleSubmit = () => {
    // 将当前headers数据放入表单
    const headersObject: Record<string, string> = {};
    headerItems.forEach(item => {
      if (item.key && item.value) {
        headersObject[item.key] = item.value;
      }
    });

    form.setFieldsValue({ headers: headersObject });

    // 调用添加方法
    onAdd();
  };

  // 请求头表格列定义
  const headerColumns = [
    {
      title: '请求头名称',
      dataIndex: 'key',
      key: 'key',
      width: '40%',
      render: (_: string, record: HeaderItem) => (
        <Input
          value={record.key}
          onChange={(e) => handleHeaderChange(record.id, 'key', e.target.value)}
          placeholder="例如: HTTP-Referer"
        />
      ),
    },
    {
      title: '请求头值',
      dataIndex: 'value',
      key: 'value',
      width: '50%',
      render: (_: string, record: HeaderItem) => (
        <Input
          value={record.value}
          onChange={(e) => handleHeaderChange(record.id, 'value', e.target.value)}
          placeholder="例如: https://your-site.com"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: '10%',
      render: (_: string, record: HeaderItem) => (
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveHeader(record.id)}
        />
      ),
    },
  ];

  return (
    <Modal
      title="添加翻译服务提供商"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="翻译服务名称"
          rules={[{ required: true, message: '请输入翻译服务名称' }]}
        >
          <Input placeholder="例如: 自定义翻译服务" />
        </Form.Item>

        <Form.Item name="headers" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="apiKey"
          label="API密钥"
          rules={[{ required: true, message: '请输入API密钥' }]}
        >
          <Input.Password
            placeholder="请输入您的API密钥"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          name="baseUrl"
          label="API代理URL"
          rules={[{ required: true, message: '请输入API代理URL' }]}
        >
          <Input placeholder="https://api.openrouter.ai/api/v1" />
        </Form.Item>

        <Form.Item
          name="model"
          label={
            <span>
              模型参数
              <Tooltip title="使用的翻译模型，例如：deepseek/deepseek-chat-v3-0324:free">
                <Text type="secondary" style={{ marginLeft: 4 }}>
                  (?)
                </Text>
              </Tooltip>
            </span>
          }
          rules={[{ required: true, message: '请输入模型参数' }]}
        >
          <Input placeholder="deepseek/deepseek-chat-v3-0324:free" />
        </Form.Item>

        <Form.Item
          name="systemPrompt"
          label={
            <span>
              系统提示词
              <Tooltip title="系统提示词模板，支持{{targetLanguage}}变量，会自动替换为目标语言">
                <Text type="secondary" style={{ marginLeft: 4 }}>
                  (?)
                </Text>
              </Tooltip>
            </span>
          }
        >
          <TextArea
            placeholder={DEFAULT_SYSTEM_PROMPT}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              请求头配置
              <Tooltip title="自定义请求头，例如：HTTP-Referer, X-Title">
                <Text type="secondary" style={{ marginLeft: 4 }}>
                  (?)
                </Text>
              </Tooltip>
            </span>
          }
        >
          <div>
            <Table
              dataSource={headerItems}
              columns={headerColumns}
              pagination={false}
              rowKey="id"
              size="small"
              style={{ marginBottom: 16 }}
              locale={{ emptyText: '暂无请求头配置' }}
            />
            <Button
              type="dashed"
              onClick={handleAddHeader}
              icon={<PlusOutlined />}
              style={{ width: '100%' }}
            >
              添加请求头
            </Button>
          </div>
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
          <Button type="primary" onClick={handleSubmit}>
            添加
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddProviderModal;
