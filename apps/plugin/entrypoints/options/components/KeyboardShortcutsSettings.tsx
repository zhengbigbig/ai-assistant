import { DeleteOutlined, KeyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  Button,
  Flex,
  Form,
  Input,
  message,
  Tooltip,
  Typography
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import type { KeyboardShortcutsSettings as KeyboardShortcutsType } from '../../stores/configStore';
import { useConfigStore, useKeyboardShortcuts } from '../../stores/configStore';
import { Label, StyledCard, StyledSection, StyledTitle, TitleWithIcon } from './Wrapper';

const { Text } = Typography;

// 定义快捷键配置的schema
interface ShortcutOption {
  key: keyof KeyboardShortcutsType; // 对应configStore中的字段名
  label: string; // 显示的标签
  defaultValue: string; // 默认值
}

// 默认快捷键值
const DEFAULT_SHORTCUTS: Record<string, string> = {
  shortcutSendMessage: 'Enter',
  shortcutOpenSidebar: 'Ctrl+S',
  shortcutStartNewChat: '⌘+⇧+O',
  shortcutQuickQuery: '⌘+J',
  shortcutTranslatePage: '⌥+A',
};

// 快捷键配置项
const SHORTCUT_OPTIONS: ShortcutOption[] = [
  { key: 'shortcutSendMessage', label: '发送消息', defaultValue: DEFAULT_SHORTCUTS.shortcutSendMessage },
  { key: 'shortcutOpenSidebar', label: '打开侧边栏', defaultValue: DEFAULT_SHORTCUTS.shortcutOpenSidebar },
  { key: 'shortcutStartNewChat', label: '开始新聊天', defaultValue: DEFAULT_SHORTCUTS.shortcutStartNewChat },
  { key: 'shortcutQuickQuery', label: '打开快速查询', defaultValue: DEFAULT_SHORTCUTS.shortcutQuickQuery },
  { key: 'shortcutTranslatePage', label: '翻译页面', defaultValue: DEFAULT_SHORTCUTS.shortcutTranslatePage },
];

/**
 * 键盘快捷键设置组件
 * 管理插件的键盘快捷键配置
 */
const KeyboardShortcutsSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [recordingField, setRecordingField] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<KeyboardShortcutsType | null>(null);

  // 简化refs创建，不使用复杂的类型系统
  const inputRefs: Record<string, any> = {};

  // 初始化refs
  SHORTCUT_OPTIONS.forEach(option => {
    inputRefs[option.key] = useRef(null);
  });

  // 从store获取键盘快捷键设置和更新方法
  const keyboardShortcuts = useKeyboardShortcuts();
  const { updateKeyboardShortcuts } = useConfigStore();

  // 加载设置到表单
  useEffect(() => {
    if (keyboardShortcuts) {
      form.setFieldsValue({
        ...keyboardShortcuts,
      });
      setFormValues(keyboardShortcuts);
    }
  }, [form, keyboardShortcuts]);

  // 保存设置
  const handleValuesChange = (changedValues: any, allValues: any) => {
    updateKeyboardShortcuts(changedValues);
    setFormValues(prev => ({ ...prev, ...changedValues } as KeyboardShortcutsType));
    messageApi.success('设置已保存');
  };

  // 处理快捷键录入
  const handleShortcutRecording = (fieldName: string) => {
    setRecordingField(fieldName);

    // 聚焦对应的输入框
    const inputRef = inputRefs[fieldName];
    setTimeout(() => {
      const inputElement = inputRef?.current;
      if (inputElement) {
        inputElement.focus();
      }
    }, 0);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, fieldName: string) => {
    if (recordingField !== fieldName) return;

    e.preventDefault();

    // 获取按键组合
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('⇧');
    if (e.altKey) keys.push('⌥');
    if (e.metaKey) keys.push('⌘');

    // 添加实际按键
    if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
      const keyDisplay = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
      keys.push(keyDisplay);
    }

    if (keys.length > 0) {
      const shortcut = keys.join('+');

      // 更新表单字段
      form.setFieldsValue({ [fieldName]: shortcut });

      // 保存到store
      updateKeyboardShortcuts({ [fieldName]: shortcut });
      setFormValues(prev => ({ ...prev, [fieldName]: shortcut } as KeyboardShortcutsType));

      messageApi.success(`设置快捷键: ${shortcut}`);
    }
  };

  // 处理输入框失去焦点
  const handleInputBlur = () => {
    // 当输入框失去焦点时停止录制
    if (recordingField) {
      setRecordingField(null);
    }
  };

  // 清除快捷键
  const handleClearShortcut = (fieldName: string) => {
    form.setFieldsValue({ [fieldName]: '' });
    updateKeyboardShortcuts({ [fieldName]: '' });
    setFormValues(prev => ({ ...prev, [fieldName]: '' } as KeyboardShortcutsType));
    messageApi.success('已清除快捷键');
  };

  // 重置快捷键到默认值
  const handleResetShortcut = (fieldName: string) => {
    const option = SHORTCUT_OPTIONS.find(opt => opt.key === fieldName);
    if (!option) return;

    const defaultValue = option.defaultValue;
    form.setFieldsValue({ [fieldName]: defaultValue });
    updateKeyboardShortcuts({ [fieldName]: defaultValue });
    setFormValues(prev => ({ ...prev, [fieldName]: defaultValue } as KeyboardShortcutsType));
    messageApi.success('已重置为默认快捷键');
  };

  // 检查字段是否为空
  const isFieldEmpty = (fieldName: string) => {
    return !formValues?.[fieldName as keyof KeyboardShortcutsType];
  };

  // 渲染单个快捷键设置项
  const renderShortcutField = (option: ShortcutOption) => {
    const { key, label } = option;
    const isRecording = recordingField === key;
    const isEmpty = isFieldEmpty(key);

    return (
      <Flex align="center" style={{ marginBottom: 16 }} key={key}>
        <Label style={{ width: 120, marginRight: 16 }}>{label}</Label>
        <Form.Item name={key} noStyle>
          <Input
            ref={inputRefs[key]}
            style={{ width: 200 }}
            readOnly
            placeholder="点击设置快捷键"
            onClick={() => handleShortcutRecording(key)}
            onKeyDown={(e) => handleKeyDown(e, key)}
            onBlur={handleInputBlur}
            className={isRecording ? 'recording' : ''}
          />
        </Form.Item>
        {isRecording && (
          <Text type="warning" style={{ marginLeft: 8 }}>正在录制...</Text>
        )}
        {!isEmpty && !isRecording && (
          <Tooltip title="清除快捷键">
            <Button
              icon={<DeleteOutlined />}
              type="text"
              style={{ marginLeft: 8 }}
              onClick={() => handleClearShortcut(key)}
            />
          </Tooltip>
        )}
        {isEmpty && !isRecording && (
          <Tooltip title="重置为默认快捷键">
            <Button
              icon={<ReloadOutlined />}
              type="text"
              style={{ marginLeft: 8 }}
              onClick={() => handleResetShortcut(key)}
            />
          </Tooltip>
        )}
      </Flex>
    );
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
        <StyledSection>
          <TitleWithIcon>
            <KeyOutlined />
            <StyledTitle level={4}>键盘快捷键</StyledTitle>
          </TitleWithIcon>

          <StyledCard>
            <div style={{ marginBottom: 24 }}>
              <Label>快捷键设置</Label>
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  marginBottom: 16,
                  marginLeft: 10
                }}
              >
                点击输入框并按下想要的键盘组合来设置快捷键
              </Text>
            </div>

            {/* 使用schema动态渲染所有快捷键设置项 */}
            {SHORTCUT_OPTIONS.map(renderShortcutField)}
          </StyledCard>
        </StyledSection>
      </Form>

      <style>{`
        .recording {
          background-color: #f5f5f5;
          border-color: #1890ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
      `}</style>
    </>
  );
};

export default KeyboardShortcutsSettings;
