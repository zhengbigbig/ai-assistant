import { useChatStore } from '@/entrypoints/stores/chatStore';
import { Flex, Select } from 'antd';
import { useProviders } from '../../../stores/configStore';

export default function ChatInputHeader() {
  const providers = useProviders();
  const { setCurrentModel } = useChatStore();
  const currentModel = useChatStore((state) => state.currentModel);

  return (
    <Flex style={{ marginBottom: 6 }}>
      <Select
        variant="filled"
        placeholder="选择模型"
        style={{ width: 160 }}
        popupMatchSelectWidth={false}
        options={providers.map((provider) => ({
          label: provider.name,
          value: provider.name,
          options: provider.models
            ?.filter((model) => model.enabled)
            ?.map((model) => ({
              label: <Flex>{model.name}</Flex>,
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
    </Flex>
  );
}
