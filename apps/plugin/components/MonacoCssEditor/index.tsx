import Editor, { OnMount } from '@monaco-editor/react';
import { theme as antdTheme } from 'antd';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useRef } from 'react';
import './loader';

// 确保 Monaco CSS 语言服务类型导入
import 'monaco-editor/esm/vs/language/css/monaco.contribution';

/**
 * 自定义CSS属性提示数据
 * 包含常用CSS属性的标签、文档说明和详情
 */
const cssProperties = [
  { label: 'color', documentation: '设置文本颜色', detail: 'CSS属性' },
  {
    label: 'background-color',
    documentation: '设置背景颜色',
    detail: 'CSS属性',
  },
  { label: 'font-size', documentation: '设置字体大小', detail: 'CSS属性' },
  { label: 'font-weight', documentation: '设置字体粗细', detail: 'CSS属性' },
  { label: 'padding', documentation: '设置内边距', detail: 'CSS属性' },
  { label: 'margin', documentation: '设置外边距', detail: 'CSS属性' },
  { label: 'border', documentation: '设置边框', detail: 'CSS属性' },
  { label: 'border-radius', documentation: '设置边框圆角', detail: 'CSS属性' },
  { label: 'box-shadow', documentation: '设置盒子阴影', detail: 'CSS属性' },
  { label: 'text-shadow', documentation: '设置文本阴影', detail: 'CSS属性' },
  {
    label: 'text-decoration',
    documentation: '设置文本装饰',
    detail: 'CSS属性',
  },
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
  value?: string; // 编辑器的初始值
  onChange?: (value: string) => void; // 值变化时的回调函数
  height?: string | number; // 编辑器高度
  placeholder?: string; // 占位符文本
  isDarkMode?: boolean; // 是否使用暗色主题
}

/**
 * Monaco CSS编辑器组件
 * 提供CSS编辑功能，包含属性和颜色自动补全
 */
const MonacoCssEditor: React.FC<MonacoCssEditorProps> = ({
  value = '',
  onChange,
  height = '160px',
  isDarkMode = true,
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
      provideCompletionItems: (
        model: editor.ITextModel,
        position: monaco.Position
      ) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          ...cssProperties.map((prop) => ({
            label: prop.label,
            kind: monacoInstance.languages.CompletionItemKind.Property,
            documentation: prop.documentation,
            detail: prop.detail,
            insertText: `${prop.label}: `,
            range,
          })),
          ...colorSuggestions.map((color) => ({
            label: color.label,
            kind: monacoInstance.languages.CompletionItemKind.Color,
            documentation: color.documentation,
            detail: color.detail,
            insertText: color.label,
            range,
          })),
        ];

        return { suggestions };
      },
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

    // 禁用 CSS 的 emptyRules 规则
    monacoInstance.languages.css.cssDefaults.setOptions({
      validate: true,
      lint: {
        emptyRules: 'ignore', // 禁用空规则集检查
        // 以下是其他可以配置的规则，默认保持启用状态
        // 如果需要禁用其他规则，可以将对应值设为 'ignore'
        compatibleVendorPrefixes: 'warning', // 建议使用兼容的供应商前缀
        vendorPrefix: 'warning', // 建议使用供应商前缀
        duplicateProperties: 'warning', // 警告重复属性
        universalSelector: 'ignore', // 允许使用通用选择器 *
        zeroUnits: 'ignore', // 允许使用 0 值后跟单位 (例如 0px)
        importStatement: 'warning', // 警告使用 @import
        boxModel: 'warning', // 警告盒模型相关问题
        important: 'warning', // 警告使用 !important
        float: 'warning', // 警告使用 float
        idSelector: 'warning', // 警告使用 ID 选择器
        propertyIgnoredDueToDisplay: 'warning', // 警告因 display 类型导致的忽略属性
      },
      // 其他常用设置
      data: {}, // 可以提供数据给CSS验证器
    });

    // 设置编辑器容器样式，确保提示框能够正常显示
    const editorDomNode = editor.getDomNode();
    if (editorDomNode) {
      // 为编辑器添加特定的类名，方便CSS选择器定位
      editorDomNode.classList.add('monaco-css-editor');
    }

    // 设置编辑器布局选项
    editor.updateOptions({
      // 使悬浮窗口始终可见，不受容器边界限制
      fixedOverflowWidgets: true,
      // 悬浮提示更新速度
      hover: {
        delay: 300,
        sticky: true, // 鼠标悬停时保持提示显示
      },
      // 启用内置颜色选择器
      colorDecorators: true,
    });
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

  // 编辑器容器样式
  const editorContainerStyle = {
    border: `1px solid ${token.colorBorder}`,
    borderRadius: `${token.borderRadiusLG}px`,
    overflow: 'visible' as const,
    position: 'relative' as const,
    width: '100%',
  };

  // 编辑器内部样式
  const editorWrapperStyle = {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
  };

  return (
    <>
      <div style={editorContainerStyle}>
        <div style={editorWrapperStyle}>
          <Editor
            height={height}
            defaultLanguage="css"
            theme={isDarkMode ? 'vs-dark' : 'vs'} // 根据isDarkMode选择主题
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: true }, // 禁用右侧代码缩略图，减少视觉干扰
              scrollBeyondLastLine: true, // 禁止滚动超过最后一行，更符合表单输入体验
              lineNumbers: 'on', // 显示行号
              roundedSelection: true, // 使用圆角选择框
              automaticLayout: true, // 自动调整布局大小
              fontSize: 14, // 设置字体大小
              colorDecorators: true, // 颜色装饰器，CSS中的颜色值会显示对应的颜色预览
              tabSize: 2, // 设置 tab 缩进为 2 个空格
              suggestOnTriggerCharacters: true, // 在触发字符时显示建议
              quickSuggestions: true, // 快速建议
              contextmenu: true, // 启用右键菜单
              fixedOverflowWidgets: true, // 确保提示内容不被容器边界截断
              hover: {
                delay: 300,
                sticky: true, // 鼠标悬停时保持提示显示
              },
              suggest: {
                showIcons: true,
                snippetsPreventQuickSuggestions: false,
                preview: true,
              },
              padding: { top: 12 },
            }}
          />
        </div>
        <style>{`
          .monaco-placeholder-text {
            color: ${token.colorTextPlaceholder};
            font-style: italic;
          }

          /* 确保Monaco编辑器的悬浮提示不被遮挡 */
          .monaco-editor .monaco-hover {
            z-index: 50 !important;
            margin-top: 5px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          }

          /* 确保代码提示框在上层显示 */
          .monaco-editor .suggest-widget {
            z-index: 40 !important;
            margin-top: 5px !important;
          }

          /* 调整代码提示框的位置 */
          .monaco-editor .suggest-widget.docs-side {
            transform: translateY(-5px);
          }

          /* 修复提示框被边框截断的问题 */
          .monaco-editor-hover {
            margin-top: 8px;
          }

          /* 确保编辑器高度正确 */
          .monaco-css-editor {
            position: relative;
            width: 100%;
            height: 100%;
          }

          /* 修复hover提示的位置 */
          .monaco-editor .monaco-hover-content {
            max-width: 500px !important;
            word-wrap: break-word !important;
          }

          /* 提高编辑器上方悬浮元素的层级 */
          .monaco-editor .overlayWidgets {
            z-index: 30 !important;
          }

          /* 确保编辑器容器不遮挡提示 */
          .monaco-editor-container {
            overflow: visible !important;
          }

          /* 增强内置颜色选择器的样式 */
          .colorpicker-widget {
            z-index: 100 !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          }

          /* 改进颜色预览的样式 */
          .monaco-editor .colorpicker-color-decoration {
            width: 10px !important;
            height: 10px !important;
            margin-left: 4px;
            border-radius: 2px !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15) !important;
          }

          /* 为编辑器内颜色值增加悬停效果 */
          .mtk5:has(.colorpicker-color-decoration):hover {
            text-decoration: underline;
            cursor: pointer;
          }

          /* 修复内置颜色选择器在暗色主题下的显示问题 */
          .vs-dark .colorpicker-widget {
            background-color: #252526 !important;
            border-color: #454545 !important;
          }
        `}</style>
      </div>
    </>
  );
};

export default MonacoCssEditor;
