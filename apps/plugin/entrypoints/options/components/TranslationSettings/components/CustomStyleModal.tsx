import { Button, Divider, Form, Input, Modal, Select } from 'antd';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  DEFAULT_CUSTOM_STYLE_TEMPLATES,
  AI_ASSISTANT_TRANSLATED,
  AI_ASSISTANT_TRANSLATED_CONTAINER,
  AI_ASSISTANT_TRANSLATED_WRAPPER,
  DEFAULT_EMPTY_TEMPLATE,
} from '@/constants/config';
import { validateCss } from '@/utils/css';
import MonacoCssEditor from '@/components/MonacoCssEditor';
import { StylePreview } from '../Wrapper';
import { PREVIEW_TEXT } from '../constants';
import { CustomStyleConfig } from '@/entrypoints/stores/configStore';

interface CustomStyleModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (values: { name: string; css: string }) => void;
  mode: 'create' | 'edit';
  currentStyle: CustomStyleConfig | null;
}

/**
 * 自定义样式编辑弹窗
 */
const CustomStyleModal: React.FC<CustomStyleModalProps> = ({
  open,
  onCancel,
  onSave,
  mode,
  currentStyle,
}) => {
  const [form] = Form.useForm();
  const [previewCss, setPreviewCss] = React.useState('');
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const shadowHostRef = useRef<HTMLDivElement | null>(null);

  // 组件挂载或currentStyle变更时，重置表单
  useEffect(() => {
    if (currentStyle && mode === 'edit') {
      form.setFieldsValue({
        name: currentStyle.name,
        css: currentStyle.css?.trim() || '',
      });
      setPreviewCss(currentStyle.css?.trim() || '');
    } else if (mode === 'create') {
      form.setFieldsValue({
        css: DEFAULT_EMPTY_TEMPLATE,
      });
      setPreviewCss(DEFAULT_EMPTY_TEMPLATE);
    }
  }, [form, currentStyle, mode, open]);

  // 预览自定义样式
  const handlePreviewCssChange = useCallback((css: string) => {
    if (!validateCss(css)) return;
    setPreviewCss(css);
  }, []);

  // 创建和更新ShadowDOM
  useEffect(() => {
    if (!open) return;

    // 确保ShadowDOM已创建
    if (shadowHostRef.current && !shadowRootRef.current) {
      shadowRootRef.current = shadowHostRef.current.attachShadow({ mode: 'open' });
    }

    // 更新ShadowDOM内的样式和内容
    if (shadowRootRef.current) {
      // 清空旧内容
      shadowRootRef.current.innerHTML = '';

      // 创建样式元素
      const styleElement = document.createElement('style');
      styleElement.textContent = previewCss;
      shadowRootRef.current.appendChild(styleElement);

      // 创建翻译后内容容器
      const translatedContainer = document.createElement('font');
      translatedContainer.className = AI_ASSISTANT_TRANSLATED_CONTAINER;
      translatedContainer.style.margin = '8px 0';
      translatedContainer.style.display = 'inline-block';

      // 创建翻译后内容
      const translatedElement = document.createElement('font');
      translatedElement.className = AI_ASSISTANT_TRANSLATED;
      translatedElement.textContent = PREVIEW_TEXT.TRANSLATED;

      // 组装DOM结构
      translatedContainer.appendChild(translatedElement);
      shadowRootRef.current.appendChild(translatedContainer);
    }
  }, [open, previewCss]);

  // 从编辑器内容中提取颜色值并实时更新
  useEffect(() => {
    if (!open) return;

    const cssEditor = form.getFieldValue('css');
    if (cssEditor) {
      handlePreviewCssChange(cssEditor);
    }
  }, [open, form, handlePreviewCssChange]);

  // 保存样式
  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave(values);
    });
  };

  return (
    <Modal
      title={mode === 'create' ? '添加自定义样式' : '编辑自定义样式'}
      open={open}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="样式名称"
          rules={[{ required: true, message: '请输入样式名称' }]}
        >
          <Input placeholder="给您的样式起个名字" />
        </Form.Item>
        <Form.Item name="template" label="样式模板">
          <Select
            options={DEFAULT_CUSTOM_STYLE_TEMPLATES.map((it) => ({
              label: it.name,
              value: it.name,
            }))}
            placeholder="选择一个模板"
            onChange={(value) => {
              const template = DEFAULT_CUSTOM_STYLE_TEMPLATES.find(
                (it) => it.name === value
              );
              const css = template?.css?.trim() || '';
              if (css) {
                form.setFieldValue('css', css);
                handlePreviewCssChange(css);
              }
            }}
          />
        </Form.Item>
        <Form.Item
          name="css"
          label="CSS样式"
          rules={[
            { required: true, message: '请输入CSS样式' },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                return validateCss(value)
                  ? Promise.resolve()
                  : Promise.reject(new Error('CSS语法错误，请检查'));
              },
            },
          ]}
        >
          <MonacoCssEditor
            height={200}
            placeholder="在此编辑CSS样式，如：color: red; background-color: #f0f0f0;"
            onChange={(value) => handlePreviewCssChange(value)}
          />
        </Form.Item>

        <Divider orientation="center">预览效果</Divider>

        <StylePreview>
          <div style={{ marginBottom: 8 }}>{PREVIEW_TEXT.ORIGINAL}</div>
          <div className={AI_ASSISTANT_TRANSLATED_WRAPPER}>
            {/* 使用ShadowDOM提供样式隔离 */}
            <div ref={shadowHostRef} />
          </div>
        </StylePreview>
      </Form>
    </Modal>
  );
};

export default CustomStyleModal;
