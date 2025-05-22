import { ModelType, ProviderType } from '@/entrypoints/stores/configStore';
import { sendToOpenAISync } from '@/utils/openai';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Switch,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  ConnectionCheckSection,
  ModalTitle,
  ModelActions,
  ModelInfo,
  ModelItem,
  ModelListHeader,
  ModelName,
} from '../Wrapper';

const { Text } = Typography;

interface ProviderConfigModalProps {
  open: boolean;
  provider: ProviderType | null;
  onCancel: () => void;
  onSave: (values: ProviderType) => void;
  isAddingProvider?: boolean;
}

interface EditingModel {
  name: string;
}

/**
 * AI服务提供商配置弹窗
 */
const ProviderConfigModal: React.FC<ProviderConfigModalProps> = ({
  open,
  provider,
  onCancel,
  onSave,
  isAddingProvider = false,
}) => {
  const [models, setModels] = useState<ModelType[]>([]);
  const [form] = Form.useForm();
  const [isConnectionChecking, setIsConnectionChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'success' | 'error' | null
  >(null);
  const [connectionMessage, setConnectionMessage] = useState<string>('');
  const [editingModel, setEditingModel] = useState<EditingModel | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [newModelName, setNewModelName] = useState('');

  // 组件挂载或provider变更时，重置表单
  useEffect(() => {
    if (provider) {
      form.setFieldsValue({
        name: provider.name || '',
        apiKey: provider.apiKey || '',
        baseUrl: provider.baseUrl || 'https://api.openai.com/v1',
      });
      setModels(provider.models);

      // 新增服务配置时清空检测状态
      if (isAddingProvider) {
        setConnectionStatus(null);
        setConnectionMessage('');
        setModels([]);
      }
    }
  }, [form, provider, open, isAddingProvider]);

  // 处理连接检查
  const handleConnectionCheck = async () => {
    const apiKey = form.getFieldValue('apiKey');
    const baseUrl = form.getFieldValue('baseUrl');


    if (!apiKey) {
      setConnectionStatus('error');
      setConnectionMessage('请输入API密钥');
      return;
    }

    setIsConnectionChecking(true);
    setConnectionStatus(null);
    setConnectionMessage('');

    try {
      // 首先获取可用模型列表
      const firstModel = models?.[0];

      if (!firstModel) {
        setConnectionStatus('error');
        setConnectionMessage('没有可用模型');
        return;
      }

      // 使用选定的模型发送测试请求
      const testResponse = await sendToOpenAISync(
        [{ role: 'user', content: '你好，这是一个连接测试。请回复"连接成功"。', id: `test-${Date.now()}` }],
        apiKey,
        baseUrl,
        firstModel.name
      );

      // 连接成功，显示模型回复
      setConnectionStatus('success');
      setConnectionMessage(`连接成功！模型回复: ${testResponse.substring(0, 100)}${testResponse.length > 100 ? '...' : ''}`);

    } catch (error) {
      console.error('API连接检查失败:', error);
      setConnectionStatus('error');
      setConnectionMessage(error instanceof Error ? error.message : '连接失败，请检查API密钥和URL');
    } finally {
      setIsConnectionChecking(false);
    }
  };

  // 开始编辑模型
  const startEditingModel = (model: ModelType) => {
    setEditingModel({ name: model.name });
    setEditingName(model.name);
  };

  // 保存编辑中的模型
  const saveEditingModel = () => {
    if (!editingModel || !provider || !editingName.trim()) {
      return;
    }

    // 调用外部方法更新模型名称
    setModels(models.map(model => model.name === editingModel.name ? { ...model, name: editingName } : model));

    // 退出编辑模式
    setEditingModel(null);
    setEditingName('');
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingModel(null);
    setEditingName('');
  };

  // 保存新模型
  const saveNewModel = () => {
    if (!newModelName.trim()) return;

    setModels([...models, { name: newModelName, enabled: true }]);
    setNewModelName('');
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      closeIcon={<CloseOutlined />}
    >
      <Form form={form} layout="vertical">
        <ModalTitle>{isAddingProvider ? '添加服务提供商' : provider?.name}</ModalTitle>

        {isAddingProvider && (
          <Form.Item
            name="name"
            label="服务提供商名称"
            rules={[{ required: true, message: '请输入服务提供商名称' }]}
          >
            <Input placeholder="请输入服务提供商名称" />
          </Form.Item>
        )}

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
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>

        <ConnectionCheckSection>
          <Text>检查连接</Text>
          <div style={{ margin: '8px 0 16px 0', color: 'rgba(0, 0, 0, 0.45)' }}>
            检查您的API密钥和代理URL是否有效。系统将发送一个测试请求来验证连接。
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Button
              type="default"
              onClick={handleConnectionCheck}
              loading={isConnectionChecking}
              style={{
                color:
                  connectionStatus === 'success'
                    ? '#52c41a'
                    : connectionStatus === 'error'
                    ? '#ff4d4f'
                    : undefined,
                borderColor:
                  connectionStatus === 'success'
                    ? '#52c41a'
                    : connectionStatus === 'error'
                    ? '#ff4d4f'
                    : undefined,
              }}
            >
              检查连接
            </Button>
            {connectionStatus && connectionMessage && (
              <div style={{
                color: connectionStatus === 'success' ? '#52c41a' : '#ff4d4f',
                marginTop: '8px',
                fontSize: '14px',
                wordBreak: 'break-word'
              }}>
                {connectionMessage}
              </div>
            )}
          </div>
        </ConnectionCheckSection>

        <div style={{ margin: '24px 0' }}>
          <div style={{ height: 1, background: '#f0f0f0' }} />
        </div>

        <ModelListHeader>
          <Text strong>模型列表 （{provider?.name}提供商，{models?.length || 0}个模型可用）</Text>
        </ModelListHeader>

        {/* 添加新模型的输入框 */}
        <ModelItem>
          <ModelInfo>
            <Input
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              placeholder="输入新模型名称并点击添加"
              style={{ width: '100%' }}
              size="small"
            />
          </ModelInfo>
          <ModelActions>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={saveNewModel}
              disabled={!newModelName.trim()}
            >
              添加
            </Button>
          </ModelActions>
        </ModelItem>

        {models.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            {models.map((model) => {
              const isEditing = editingModel?.name === model.name;

              return (
                <ModelItem key={model.name}>
                  <ModelInfo>
                    {isEditing ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        style={{ width: '100%' }}
                        autoFocus
                        size="small"
                      />
                    ) : (
                      <ModelName>{model.name}</ModelName>
                    )}
                  </ModelInfo>
                  <ModelActions>
                    {isEditing ? (
                      <>
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={saveEditingModel}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={cancelEditing}
                        />
                      </>
                    ) : (
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => startEditingModel(model)}
                      />
                    )}

                    <Popconfirm
                      title="确定要删除该模型吗？"
                      onConfirm={() => setModels(models.filter(m => m.name !== model.name))}
                      okText="是"
                      cancelText="否"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                    <Switch
                      checked={model.enabled}
                      onChange={(checked) =>
                        setModels(models.map(m => m.name === model.name ? { ...m, enabled: checked } : m))
                      }
                    />
                  </ModelActions>
                </ModelItem>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 0',
              color: 'rgba(0, 0, 0, 0.25)',
            }}
          >
            暂无模型
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button type="primary" onClick={()=>{
            onSave?.({
              name: form.getFieldValue('name'),
              apiKey: form.getFieldValue('apiKey'),
              baseUrl: form.getFieldValue('baseUrl'),
              models
            })
          }}>
            {isAddingProvider ? '添加' : '保存'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ProviderConfigModal;
