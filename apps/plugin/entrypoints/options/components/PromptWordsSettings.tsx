import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  Typography,
  Form,
  Input,
  Switch,
  Button,
  message,
  Tabs,
  List,
  Card,
  Space,
  Flex,
  Modal,
  Tooltip,
  Select,
  Checkbox,
  Row,
  Col,
  Tag,
  Empty,
  CheckboxProps,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  MessageOutlined,
  BookOutlined,
  FormOutlined,
  SaveOutlined,
  DragOutlined,
  MenuOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  useConfigStore,
  usePromptWords,
  PromptWordItem,
} from '../../stores/configStore';
import {
  Label,
  StyledCard,
  StyledDivider,
  StyledSection,
  StyledTitle,
  TitleWithIcon,
} from './Wrapper';

const { Title, Text } = Typography;
const { CheckableTag } = Tag;

const DraggableItem = styled.div<{ isDragging: boolean }>`
  padding: 8px 12px;
  border: 1px solid ${(props) => (props.isDragging ? '#6E59F2' : '#f0f0f0')};
  border-radius: 6px;
  margin-bottom: 8px;
  background-color: ${(props) =>
    props.isDragging ? 'rgba(110, 89, 242, 0.05)' : '#fff'};
  box-shadow: ${(props) =>
    props.isDragging ? '0 0 8px rgba(0, 0, 0, 0.1)' : 'none'};
  opacity: ${(props) => (props.isDragging ? 0.7 : 1)};
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
  transition: all 0.3s;

  &:hover {
    border-color: #d9d9d9;
  }
`;

const ItemContent = styled.div`
  flex: 1;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 8px;
`;

const PromptItem = styled.div`
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 12px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s;

  &:hover {
    border-color: #d9d9d9;
    background-color: #fafafa;
  }
`;

const EmptyPromptList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  background-color: #fafafa;
  border-radius: 8px;

  .anticon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #d9d9d9;
  }
`;

const AddButton = styled(Button)`
  margin-top: 16px;
`;

const CategoryTag = styled(Tag)`
  margin-right: 8px;
`;

const SceneCheckboxGroup = styled.div`
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

// 拖拽项组件
interface DraggablePromptItemProps {
  id: string;
  index: number;
  item: PromptWordItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
}

const DraggablePromptItem: React.FC<DraggablePromptItemProps> = ({
  id,
  index,
  item,
  onEdit,
  onDelete,
  moveItem,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'prompt-item',
    item: () => ({ id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'prompt-item',
    hover: (dragItem: { id: string; index: number }, monitor) => {
      if (!ref.current) {
        return;
      }

      // 不要替换自己的位置
      const dragIndex = dragItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }

      // 鼠标位置相对于被hover元素的位置
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // 向下拖动时，仅在鼠标超过元素的一半高度时移动
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // 向上拖动时，仅在鼠标超过元素的一半高度时移动
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // 执行移动
      moveItem(dragIndex, hoverIndex);

      // 重要：更新拖动项的索引，确保动画流畅
      dragItem.index = hoverIndex;
    },
  });

  // 将drag和drop函数应用到同一个引用上，使元素既可以拖动也可以接收放置
  drag(drop(ref));

  return (
    <DraggableItem ref={ref} isDragging={isDragging}>
      <MenuOutlined style={{ color: '#999' }} />
      <ItemContent>
        <Tooltip title={item.content}>
          <Text>{item.name}</Text>
        </Tooltip>
      </ItemContent>
      <ItemActions>
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(id)}
          danger
          size="small"
        />
      </ItemActions>
    </DraggableItem>
  );
};

/**
 * 适用场景，受控组件
 */
const SceneCheckbox = ({
  value,
  onChange,
}: {
  value?: string[];
  onChange?: (v: string[]) => void;
}) => {
  const ALL_OPTIONS = ['聊天/提问', '阅读', '写作'];

  const checkAll = value?.length === ALL_OPTIONS.length;
  const indeterminate =
    value && value?.length > 0 && value?.length < ALL_OPTIONS.length;

  const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
    onChange?.(e.target.checked ? ALL_OPTIONS : []);
  };

  return (
    <Space>
      <Checkbox
        indeterminate={indeterminate}
        onChange={onCheckAllChange}
        checked={checkAll}
      >
        全选
      </Checkbox>
      <Checkbox.Group
        style={{ width: '100%' }}
        value={value}
        onChange={onChange}
        options={ALL_OPTIONS}
      />
    </Space>
  );
};

/**
 * 提示词设置组件
 * 管理AI提示词模板和建议相关的配置
 */
const PromptWordsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTab, setActiveTab] = useState('list');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptWordItem | null>(
    null
  );
  const [configTab, setConfigTab] = useState('chat');
  const [selectPromptModalVisible, setSelectPromptModalVisible] =
    useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [nameValidateStatus, setNameValidateStatus] = useState<
    '' | 'error' | 'warning' | 'validating' | 'success' | undefined
  >('');
  const [nameHelpText, setNameHelpText] = useState<string>('');

  // 从store获取提示词设置和更新方法
  const promptWords = usePromptWords();
  const {
    updatePromptWords,
    addPromptWord,
    updatePromptWord,
    removePromptWord,
    reorderPromptWords,
  } = useConfigStore();

  // 处理表单值变更
  const handleValuesChange = (changedValues: any) => {
    updatePromptWords(changedValues);
    messageApi.success('设置已保存');
  };

  // 检查名称是否重复
  const checkNameExists = (name: string, currentId?: string) => {
    return promptWords.promptWords.some(
      (p) => p.name === name && p.id !== currentId
    );
  };

  // 处理名称变更并检查重复
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (name && checkNameExists(name, editingPrompt?.id)) {
      setNameValidateStatus('error');
      setNameHelpText('提示词名称已存在，请使用其他名称');
    } else {
      setNameValidateStatus('');
      setNameHelpText('');
    }
  };

  // 打开添加提示词弹窗
  const showAddPromptModal = () => {
    setEditingPrompt(null);
    setNameValidateStatus('');
    setNameHelpText('');
    setIsModalVisible(true);
  };

  // 打开编辑提示词弹窗
  const showEditPromptModal = (id: string) => {
    const prompt = promptWords.promptWords.find((p) => p.id === id);
    if (prompt) {
      setEditingPrompt(prompt);
      setNameValidateStatus('');
      setNameHelpText('');
      setIsModalVisible(true);
    }
  };

  // 删除提示词
  const handleDeletePrompt = (id: string) => {
    removePromptWord(id);
    messageApi.success('提示词已删除');
  };

  // 从配置中删除提示词
  const handleRemoveFromConfig = (id: string) => {
    // 这里只需要从配置中移除，不需要删除提示词本身
    // 实际实现时可能需要修改提示词的应用场景属性
    const prompt = promptWords.promptWords.find((p) => p.id === id);
    if (prompt) {
      const scenes = [...(prompt.scenes || [])];
      const sceneToRemove =
        configTab === 'chat'
          ? '聊天/提问'
          : configTab === 'reading'
          ? '阅读'
          : '写作';

      const updatedScenes = scenes.filter((scene) => scene !== sceneToRemove);

      updatePromptWord(id, { ...prompt, scenes: updatedScenes });
      messageApi.success('已从配置中移除');
    }
  };

  // 添加或更新提示词
  const handleSavePrompt = (values: any) => {
    // 检查名称是否重复
    if (checkNameExists(values.name, editingPrompt?.id)) {
      setNameValidateStatus('error');
      setNameHelpText('提示词名称已存在，请使用其他名称');
      return;
    }

    if (editingPrompt) {
      // 更新
      updatePromptWord(editingPrompt.id, values);
      messageApi.success('提示词已更新');
    } else {
      // 添加
      addPromptWord(values);
      messageApi.success('提示词已添加');
    }
    setIsModalVisible(false);
  };

  // 打开选择提示词弹窗
  const showSelectPromptModal = () => {
    setSelectedPrompts([]);
    setSelectPromptModalVisible(true);
  };

  // 处理提示词选择变更
  const handlePromptSelectionChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPrompts([...selectedPrompts, id]);
    } else {
      setSelectedPrompts(selectedPrompts.filter((itemId) => itemId !== id));
    }
  };

  // 添加选中的提示词到当前配置
  const handleAddSelectedPrompts = () => {
    const sceneToAdd =
      configTab === 'chat'
        ? '聊天/提问'
        : configTab === 'reading'
        ? '阅读'
        : '写作';

    // 更新每个选中提示词的应用场景
    selectedPrompts.forEach((id) => {
      const prompt = promptWords.promptWords.find((p) => p.id === id);
      if (prompt) {
        const scenes = [...(prompt.scenes || [])];
        if (!scenes.includes(sceneToAdd)) {
          updatePromptWord(id, {
            ...prompt,
            scenes: [...scenes, sceneToAdd],
          });
        }
      }
    });

    setSelectPromptModalVisible(false);
    messageApi.success('提示词已添加到配置');
  };

  // 根据应用场景筛选提示词
  const getChatPrompts = useCallback(() => {
    return promptWords.promptWords
      .filter((p) => p.scenes?.includes('聊天/提问'))
      .sort((a, b) => a.order - b.order);
  }, [promptWords.promptWords]);

  const getReadingPrompts = useCallback(() => {
    return promptWords.promptWords
      .filter((p) => p.scenes?.includes('阅读'))
      .sort((a, b) => a.order - b.order);
  }, [promptWords.promptWords]);

  const getWritingPrompts = useCallback(() => {
    return promptWords.promptWords
      .filter((p) => p.scenes?.includes('写作'))
      .sort((a, b) => a.order - b.order);
  }, [promptWords.promptWords]);

  // 移动提示词（拖拽排序）
  const movePromptItem = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      // 根据当前选择的场景获取相应的提示词
      let itemsToSort;
      if (configTab === 'chat') {
        itemsToSort = getChatPrompts();
      } else if (configTab === 'reading') {
        itemsToSort = getReadingPrompts();
      } else {
        itemsToSort = getWritingPrompts();
      }

      // 创建一个副本进行操作
      const sortedItems = [...itemsToSort];
      const draggedItem = sortedItems[dragIndex];

      // 从数组中删除拖拽项
      sortedItems.splice(dragIndex, 1);
      // 将拖拽项插入到新位置
      sortedItems.splice(hoverIndex, 0, draggedItem);

      // 获取所有提示词的副本并更新顺序
      const allItems = promptWords.promptWords.map((item) => {
        // 如果当前项在排序列表中，更新其order值
        const sortedIndex = sortedItems.findIndex(
          (sortedItem) => sortedItem.id === item.id
        );
        if (sortedIndex !== -1) {
          return {
            ...item,
            order: sortedIndex,
          };
        }
        // 否则保持原来的值
        return item;
      });

      // 更新store
      reorderPromptWords(allItems);
    },
    [
      configTab,
      getChatPrompts,
      getReadingPrompts,
      getWritingPrompts,
      promptWords.promptWords,
      reorderPromptWords,
    ]
  );

  // 渲染提示词列表（全部提示词）
  const renderAllPromptsList = () => {
    if (promptWords.promptWords.length === 0) {
      return (
        <EmptyPromptList>
          <MessageOutlined />
          <Text>暂无提示词</Text>
          <Text type="secondary">点击下方的按钮添加新的提示词</Text>
        </EmptyPromptList>
      );
    }

    return (
      <div>
        {promptWords.promptWords.map((item) => (
          <PromptItem key={item.id}>
            <ItemContent>
              <div>
                <Text style={{ fontWeight: 500 }}>{item.name}</Text>
              </div>
              <div style={{ marginTop: 4 }}>
                <Tooltip title={item.content}>
                  <Text
                    type="secondary"
                    ellipsis
                    style={{ maxWidth: '300px', display: 'inline-block' }}
                  >
                    {item.content}
                  </Text>
                </Tooltip>
              </div>
              <div style={{ marginTop: 4 }}>
                {item.scenes?.map((scene) => (
                  <CategoryTag key={scene} color="green">
                    {scene}
                  </CategoryTag>
                ))}
              </div>
            </ItemContent>
            <ItemActions>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => showEditPromptModal(item.id)}
                size="small"
              />
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => handleDeletePrompt(item.id)}
                danger
                size="small"
              />
            </ItemActions>
          </PromptItem>
        ))}
      </div>
    );
  };

  // 渲染提示词配置列表（根据场景筛选后的）
  const renderConfigPromptList = (items: PromptWordItem[]) => {
    if (items.length === 0) {
      return (
        <EmptyPromptList>
          <MessageOutlined />
          <Text>暂无提示词配置</Text>
          <Text type="secondary">请从提示词列表中添加提示词到此场景</Text>
        </EmptyPromptList>
      );
    }

    return (
      <div>
        {items.map((item, index) => (
          <DraggablePromptItem
            key={item.id}
            id={item.id}
            index={index}
            item={item}
            onEdit={showEditPromptModal}
            onDelete={handleRemoveFromConfig}
            moveItem={movePromptItem}
          />
        ))}
      </div>
    );
  };

  // 选择提示词弹窗中的空状态处理
  const renderEmptyPromptSelection = () => {
    return <Empty description="没有可添加的提示词" />;
  };

  // 主选项卡配置
  const mainTabItems = [
    {
      key: 'list',
      label: '提示词列表',
      children: (
        <>
          {renderAllPromptsList()}
          <AddButton
            type="dashed"
            icon={<PlusOutlined />}
            onClick={showAddPromptModal}
            block
          >
            添加提示词
          </AddButton>
        </>
      ),
    },
    {
      key: 'config',
      label: '提示词配置',
      children: (
        <DndProvider backend={HTML5Backend}>
          <Tabs
            activeKey={configTab}
            onChange={setConfigTab}
            style={{ marginBottom: 16 }}
            items={[
              {
                key: 'chat',
                label: '聊天/提问',
                children: renderConfigPromptList(getChatPrompts()),
              },
              {
                key: 'reading',
                label: '阅读',
                children: renderConfigPromptList(getReadingPrompts()),
              },
              {
                key: 'writing',
                label: '写作',
                children: renderConfigPromptList(getWritingPrompts()),
              },
            ]}
          />
          <AddButton
            type="dashed"
            icon={<PlusOutlined />}
            onClick={showSelectPromptModal}
            block
          >
            从提示词列表添加
          </AddButton>
        </DndProvider>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <StyledSection>
        <Form
          form={form}
          layout="vertical"
          initialValues={promptWords}
          onValuesChange={handleValuesChange}
          style={{ maxWidth: 800 }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ marginBottom: 16 }}
            items={mainTabItems}
          />
        </Form>
      </StyledSection>

      {/* 添加/编辑提示词弹窗 */}
      <Modal
        title={editingPrompt ? '编辑提示词' : '添加提示词'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          initialValues={editingPrompt || { name: '', content: '', scenes: [] }}
          onFinish={handleSavePrompt}
        >
          <Form.Item
            name="name"
            label="提示词名称"
            rules={[{ required: true, message: '请输入提示词名称' }]}
            validateStatus={nameValidateStatus}
            help={nameHelpText}
          >
            <Input
              placeholder="输入提示词名称..."
              onChange={handleNameChange}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="提示词内容"
            rules={[{ required: true, message: '请输入提示词内容' }]}
          >
            <Input.TextArea rows={4} placeholder="输入提示词内容..." />
          </Form.Item>

          <Form.Item
            name="scenes"
            label={
              <Space>
                <span>适用场景</span>
                <Tooltip title="选择提示词适用的场景，可多选">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <SceneCheckbox />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                disabled={nameValidateStatus === 'error'}
              >
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 选择提示词弹窗 */}
      <Modal
        title="选择提示词"
        open={selectPromptModalVisible}
        onCancel={() => setSelectPromptModalVisible(false)}
        onOk={handleAddSelectedPrompts}
        okText="添加所选提示词"
        okButtonProps={{ disabled: selectedPrompts.length === 0 }}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {promptWords.promptWords.map((item) => {
            // 过滤掉已经添加到当前场景的提示词
            const currentScene =
              configTab === 'chat'
                ? '聊天/提问'
                : configTab === 'reading'
                ? '阅读'
                : '写作';
            if (item.scenes?.includes(currentScene)) {
              return null;
            }

            return (
              <div
                key={item.id}
                style={{
                  marginBottom: '8px',
                  padding: '8px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '4px',
                }}
              >
                <Checkbox
                  checked={selectedPrompts.includes(item.id)}
                  onChange={(e) =>
                    handlePromptSelectionChange(item.id, e.target.checked)
                  }
                >
                  <div>
                    <div>
                      <strong>{item.name}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {item.content}
                    </div>
                    <div>
                      {item.scenes?.map((scene) => (
                        <Tag key={scene} color="green">
                          {scene}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Checkbox>
              </div>
            );
          })}

          {promptWords.promptWords.filter((item) => {
            const currentScene =
              configTab === 'chat'
                ? '聊天/提问'
                : configTab === 'reading'
                ? '阅读'
                : '写作';
            return !item.scenes?.includes(currentScene);
          }).length === 0 && renderEmptyPromptSelection()}
        </div>
      </Modal>
    </>
  );
};

export default PromptWordsSettings;
