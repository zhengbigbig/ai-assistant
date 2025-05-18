import { TranslationProviderType } from '@/entrypoints/stores/configStore';
import { DeleteOutlined, EyeInvisibleOutlined, EyeTwoTone, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Space, Table, Tooltip, Typography } from 'antd';
import React, { useState } from 'react';

const { TextArea } = Input;
const { Text } = Typography;

interface ProviderConfigModalProps {
  open: boolean;
  provider: TranslationProviderType | null;
  onCancel: () => void;
  onSave: () => void;
}

interface HeaderItem {
  key: string;
  value: string;
  id: string;
}

// 默认系统提示词模板
const DEFAULT_SYSTEM_PROMPT = '你是一个专业的翻译助手，请将用户输入的文本翻译成{{targetLanguage}}，只返回翻译结果，不要添加任何解释或额外内容。';

// 默认请求头配置示例
const DEFAULT_HEADERS = [
  { key: 'HTTP-Referer', value: 'https://your-site.com', id: '1' },
  { key: 'X-Title', value: 'Your Site Name', id: '2' }
];

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

  // 组件挂载或provider变更时，重置表单
  React.useEffect(() => {
    if (provider) {
      // 设置基础表单字段
      form.setFieldsValue({
        id: provider.id,
        name: provider.name,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        model: provider.model,
        systemPrompt: provider.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      });

      // 处理headers数据
      if (provider.headers && Object.keys(provider.headers).length > 0) {
        const headers = Object.entries(provider.headers).map(([key, value], index) => ({
          key,
          value,
          id: `header-${index}`
        }));
        setHeaderItems(headers);
      } else {
        setHeaderItems([]);
      }
    }
  }, [form, provider, open]);

  // 判断是否为内置服务
  const isBuiltIn = provider?.isBuiltIn === true;

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

    // 调用保存方法
    onSave();
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
          disabled={isBuiltIn}
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
          disabled={isBuiltIn}
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
          disabled={isBuiltIn}
        />
      ),
    },
  ];

  return (
    <Modal
      title={provider?.name + ' 翻译配置'}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>

        <Form.Item name="name" hidden>
          <Input />
        </Form.Item>

        <Form.Item name="headers" hidden>
          <Input />
        </Form.Item>

        {isBuiltIn ? (
          <div style={{ marginBottom: 24, background: '#fffbe6', padding: '12px 16px', border: '1px solid #ffe58f', borderRadius: '4px' }}>
            <Text type="warning" style={{ display: 'flex', alignItems: 'center' }}>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              这是系统内置翻译服务，无法修改配置或删除。
            </Text>
          </div>
        ) : (
          <>
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
                disabled={isBuiltIn}
              />
            </Form.Item>

            <Form.Item
              name="baseUrl"
              label="API代理URL"
              rules={[{ required: true, message: '请输入API代理URL' }]}
            >
              <Input
                placeholder="https://api.openrouter.ai/api/v1"
                disabled={isBuiltIn}
              />
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
              <Input
                placeholder="deepseek/deepseek-chat-v3-0324:free"
                disabled={isBuiltIn}
              />
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
                disabled={isBuiltIn}
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
                  disabled={isBuiltIn}
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                >
                  添加请求头
                </Button>
                {headerItems.length === 0 && !isBuiltIn && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      提示: OpenRouter API可能需要添加 HTTP-Referer 和 X-Title 请求头
                    </Text>
                  </div>
                )}
              </div>
            </Form.Item>
          </>
        )}

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={handleSubmit} disabled={isBuiltIn}>
            保存
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ProviderConfigModal;
