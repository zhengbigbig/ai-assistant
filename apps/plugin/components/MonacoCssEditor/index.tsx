import Editor, { OnMount } from '@monaco-editor/react';
import { theme as antdTheme, ColorPicker } from 'antd';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import './loader';
import { createRoot } from 'react-dom/client';

interface StyledContainerProps {
  token: ReturnType<typeof antdTheme.useToken>['token'];
}

/**
 * 编辑器容器样式组件
 * 添加边框和圆角，并设置内部编辑器的padding
 */
const EditorContainer = styled.div<StyledContainerProps>`
  border: 1px solid ${props => props.token.colorBorder};
  border-radius: ${props => props.token.borderRadiusLG}px;
  overflow: hidden;

  .monaco-editor {
    padding: 8px 0;
  }

  /* 隐藏原始颜色文本 */
  .color-text-transparent {
    color: transparent !important;
    position: relative;
  }

  /* 自定义颜色块样式 */
  .color-block-container {
    display: inline-block;
    position: relative;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    vertical-align: middle;
    margin: 0 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
`;

/**
 * 颜色块组件
 */
const ColorBlock = ({ color }: { color: string }) => {
  return (
    <div
      className="color-block-container"
      style={{ backgroundColor: color }}
      title={color}
    />
  );
};

/**
 * 自定义CSS属性提示数据
 * 包含常用CSS属性的标签、文档说明和详情
 */
const cssProperties = [
  { label: 'color', documentation: '设置文本颜色', detail: 'CSS属性' },
  { label: 'background-color', documentation: '设置背景颜色', detail: 'CSS属性' },
  { label: 'font-size', documentation: '设置字体大小', detail: 'CSS属性' },
  { label: 'font-weight', documentation: '设置字体粗细', detail: 'CSS属性' },
  { label: 'padding', documentation: '设置内边距', detail: 'CSS属性' },
  { label: 'margin', documentation: '设置外边距', detail: 'CSS属性' },
  { label: 'border', documentation: '设置边框', detail: 'CSS属性' },
  { label: 'border-radius', documentation: '设置边框圆角', detail: 'CSS属性' },
  { label: 'box-shadow', documentation: '设置盒子阴影', detail: 'CSS属性' },
  { label: 'text-shadow', documentation: '设置文本阴影', detail: 'CSS属性' },
  { label: 'text-decoration', documentation: '设置文本装饰', detail: 'CSS属性' },
  { label: 'line-height', documentation: '设置行高', detail: 'CSS属性' },
  { label: 'transition', documentation: '设置过渡效果', detail: 'CSS属性' },
  { label: 'transform', documentation: '设置变换效果', detail: 'CSS属性' },
  { label: 'opacity', documentation: '设置透明度', detail: 'CSS属性' },
  { label: 'display', documentation: '设置显示类型', detail: 'CSS属性' },
  { label: 'position', documentation: '设置定位方式', detail: 'CSS属性' },
];

/**
 * 颜色建议数据
 * 提供预设颜色值的自动补全
 */
const colorSuggestions = [
  { label: '#f5f5f5', detail: '浅灰色', documentation: '浅灰色背景色' },
  { label: '#ffffff', detail: '白色', documentation: '纯白色' },
  { label: '#000000', detail: '黑色', documentation: '纯黑色' },
  { label: '#1890ff', detail: '蓝色', documentation: 'Ant Design主题蓝色' },
  { label: '#52c41a', detail: '绿色', documentation: 'Ant Design成功绿色' },
  { label: '#faad14', detail: '黄色', documentation: 'Ant Design警告黄色' },
  { label: '#ff4d4f', detail: '红色', documentation: 'Ant Design错误红色' },
  { label: 'transparent', detail: '透明', documentation: '完全透明' },
];

interface MonacoCssEditorProps {
  value?: string;               // 编辑器的初始值
  onChange?: (value: string) => void;  // 值变化时的回调函数
  height?: string | number;     // 编辑器高度
  placeholder?: string;         // 占位符文本
  isDarkMode?: boolean;         // 是否使用暗色主题
}

// 用于保存当前选取的颜色值和位置信息
interface ColorSelection {
  open: boolean;
  position: { x: number; y: number };
  color: string;
  range: monaco.Range | null;
}

// 颜色值正则表达式
const COLOR_REGEX = /(#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g;

/**
 * Monaco CSS编辑器组件
 * 提供CSS编辑功能，包含属性和颜色自动补全
 */
const MonacoCssEditor: React.FC<MonacoCssEditorProps> = ({
  value = '',
  onChange,
  height = '160px',
  isDarkMode = true
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const { token } = antdTheme.useToken();

  /**
   * 注册自定义补全提供器
   * 为CSS编辑器添加属性和颜色的自动补全功能
   * @param monacoInstance Monaco实例
   */
  const registerCompletionProvider = (monacoInstance: typeof monaco) => {
    monacoInstance.languages.registerCompletionItemProvider('css', {
      provideCompletionItems: (model: editor.ITextModel, position: monaco.Position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions = [
          ...cssProperties.map(prop => ({
            label: prop.label,
            kind: monacoInstance.languages.CompletionItemKind.Property,
            documentation: prop.documentation,
            detail: prop.detail,
            insertText: `${prop.label}: `,
            range
          })),
          ...colorSuggestions.map(color => ({
            label: color.label,
            kind: monacoInstance.languages.CompletionItemKind.Color,
            documentation: color.documentation,
            detail: color.detail,
            insertText: color.label,
            range
          }))
        ];

        return { suggestions };
      }
    });
  };

  /**
   * 初始化编辑器
   * 设置编辑器实例、注册补全提供器、添加占位符等
   * @param editor 编辑器实例
   * @param monacoInstance Monaco实例
   */
  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
    registerCompletionProvider(monacoInstance);
  };

  /**
   * 处理编辑器内容变化
   * @param value 编辑器的新值
   */
  const handleEditorChange = (value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  };

  return (
    <EditorContainer token={token}>
      <Editor
        height={height}
        defaultLanguage="css"
        theme={isDarkMode ? 'vs-dark' : 'vs'}  // 根据isDarkMode选择主题
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },        // 禁用右侧代码缩略图，减少视觉干扰
          scrollBeyondLastLine: true,        // 禁止滚动超过最后一行，更符合表单输入体验
          lineNumbers: 'on',                  // 显示行号
          roundedSelection: true,             // 使用圆角选择框
          automaticLayout: true,              // 自动调整布局大小
          fontSize: 14,                       // 设置字体大小
          colorDecorators: true,              // 颜色装饰器，CSS中的颜色值会显示对应的颜色预览
          tabSize: 2,                         // 设置 tab 缩进为 2 个空格
          suggestOnTriggerCharacters: true,   // 在触发字符时显示建议
          quickSuggestions: true,             // 快速建议
          contextmenu: true,                  // 启用右键菜单
        }}
      />
      <style>{`
        .monaco-placeholder-text {
          color: ${token.colorTextPlaceholder};
          font-style: italic;
        }
      `}</style>
    </EditorContainer>
  );
};

export default MonacoCssEditor;
