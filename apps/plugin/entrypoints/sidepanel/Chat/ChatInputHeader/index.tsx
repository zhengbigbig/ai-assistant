import { useChatStore } from '@/entrypoints/stores/chatStore';
import { useSessionStore } from '@/entrypoints/stores/sessionStore';
import {
  HistoryOutlined,
  LinkOutlined,
  PlusOutlined,
  ReadOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Attachments } from '@ant-design/x';
import { Button, Flex, message, Select, Space, Tooltip } from 'antd';
import { useEffect } from 'react';
import { useProviders } from '../../../stores/configStore';
import SessionDrawer from './SessionDrawer';

export default function ChatInputHeader() {
  const providers = useProviders();
  const { setCurrentModel, clearMessages } = useChatStore();
  const { setShowSessionDrawer, createNewSession } = useSessionStore();
  const currentModel = useChatStore((state) => state.currentModel);

  useEffect(() => {
    if (!currentModel.provider && providers.length > 0) {
      setCurrentModel({
        provider: providers[0],
        model: providers[0].models[0].name,
      });
    }
  }, [currentModel, providers, setCurrentModel]);

  // 处理新建会话
  const handleNewSession = () => {
    createNewSession();
    // 清空当前聊天消息，让chatStore准备好接收新会话
    clearMessages();
  };

  return (
    <Flex style={{ marginBottom: 6 }} gap={6} justify="space-between">
      <Space>
        <Select
          variant="filled"
          placeholder="选择模型"
          style={{ width: 150 }}
          popupMatchSelectWidth={false}
          options={providers.map((provider) => ({
            label: provider.name,
            value: provider.name,
            options: provider.models
              ?.filter((model) => model.enabled)
              ?.map((model) => ({
                label: model.name,
                value: model.name,
                parent: provider,
              })),
          }))}
          value={currentModel.model}
          onChange={(v, opt: any) => {
            setCurrentModel({
              provider: opt?.parent,
              model: v,
            });
          }}
          listHeight={400}
          styles={{
            popup: {
              root: {
                padding: '8px 0',
              },
            },
          }}
        />
        <Space size={0}>
          <Attachments
            beforeUpload={() => false}
            onChange={({ file }) => {
              message.info(`Mock upload: ${file.name}`);
            }}
          >
            <Tooltip title="上传文件">
              <Button type="text" icon={<LinkOutlined />} />
            </Tooltip>
          </Attachments>
          <Tooltip title="阅读页面">
            <Button type="text" icon={<ReadOutlined />} />
          </Tooltip>
        </Space>
      </Space>
      <Space size={0}>
        <Tooltip title="设置">
          <Button type="text" icon={<ToolOutlined />} />
        </Tooltip>
        <Tooltip title="历史会话">
          <Button
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => setShowSessionDrawer(true)}
          />
        </Tooltip>
        <Tooltip title="新会话" placement="topLeft">
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={handleNewSession}
          />
        </Tooltip>
      </Space>
      <SessionDrawer />
    </Flex>
  );
}
