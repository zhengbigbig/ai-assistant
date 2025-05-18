import Editor, { OnMount } from '@monaco-editor/react';
import { theme as antdTheme, ColorPicker, Popover } from 'antd';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useRef, useState } from 'react';
import './loader';

/**
 * 颜色选择器容器样式
 */
const colorPickerContainerStyle = {
  padding: '8px',
};


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

// 用于保存当前选取的颜色值和位置信息
interface ColorSelection {
  open: boolean;
  position: { x: number; y: number };
  color: string;
  range: monaco.Range | null;
  format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla'; // 新增：记录颜色格式
}

// 颜色值正则表达式 - 细化匹配各种格式
const HEX_REGEX = /#[0-9A-Fa-f]{3,8}/;
const RGB_REGEX = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/;
const RGBA_REGEX = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:0?\.\d+|[01])\s*\)/;
const HSL_REGEX = /hsl\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)/;
const HSLA_REGEX = /hsla\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*,\s*(?:0?\.\d+|[01])\s*\)/;
// 组合所有颜色格式为一个正则表达式，用于在文本中查找颜色值
const COLOR_REGEX = /(#[0-9A-Fa-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:0?\.\d+|[01])\s*\)|hsl\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)|hsla\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*,\s*(?:0?\.\d+|[01])\s*\))/g;

/**
 * 检测颜色格式
 * @param color 颜色字符串
 * @returns 颜色格式
 */
const detectColorFormat = (color: string): 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' => {
  if (HEX_REGEX.test(color)) return 'hex';
  if (RGB_REGEX.test(color)) return 'rgb';
  if (RGBA_REGEX.test(color)) return 'rgba';
  if (HSL_REGEX.test(color)) return 'hsl';
  if (HSLA_REGEX.test(color)) return 'hsla';
  return 'hex'; // 默认为hex格式
};

/**
 * 转换颜色对象为指定格式的字符串
 * @param color 颜色对象
 * @param format 目标格式
 * @param originalString 原始颜色字符串
 * @returns 格式化后的颜色字符串
 */
const formatColor = (color: any, format: string, originalString: string): string => {
  try {
    // 检查颜色对象是否有效
    if (!color) return originalString;

    switch (format) {
      case 'hex':
        return color.toHexString ? color.toHexString() : originalString;
      case 'rgb':
        if (color.toRgbString) {
          return color.toRgbString().replace(/rgba?\((\d+,\s*\d+,\s*\d+),\s*1\)/, 'rgb($1)');
        }
        return originalString;
      case 'rgba':
        return color.toRgbString ? color.toRgbString() : originalString;
      case 'hsl':
        if (color.toHslString) {
          return color.toHslString().replace(/hsla?\(([^)]+),\s*1\)/, 'hsl($1)');
        }
        return originalString;
      case 'hsla':
        return color.toHslString ? color.toHslString() : originalString;
      default:
        // 如果无法确定格式，保留原始字符串
        return originalString;
    }
  } catch (error) {
    console.error('颜色格式转换错误:', error);
    return originalString; // 发生错误时返回原始字符串
  }
};

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
  const [colorSelection, setColorSelection] = useState<ColorSelection>({
    open: false,
    position: { x: 0, y: 0 },
    color: '#1890ff',
    range: null,
    format: 'hex', // 默认为hex格式
  });

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

    // 添加鼠标点击事件监听器，检测点击颜色值
    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT) {
        const position = e.target.position;
        const model = editor.getModel();

        if (model && position) {
          // 获取当前行文本
          const lineContent = model.getLineContent(position.lineNumber);

          // 查找点击位置所在的颜色值
          // 遍历当前行的所有颜色值匹配
          const colorMatches = [...lineContent.matchAll(COLOR_REGEX)];

          for (const match of colorMatches) {
            if (!match.index) continue;

            const colorStart = match.index;
            const colorEnd = colorStart + match[0].length;
            const cursorPos = position.column - 1; // Monaco编辑器的列从1开始，转为0开始

            // 检查点击位置是否在颜色值范围内
            if (cursorPos >= colorStart && cursorPos <= colorEnd) {
              const colorValue = match[0];

              // 获取颜色值位置的屏幕坐标
              const domNode = editor.getDomNode();
              if (domNode) {
                const editorCoords = domNode.getBoundingClientRect();
                const cursorCoords = editor.getScrolledVisiblePosition(position);

                if (cursorCoords) {
                  const x = editorCoords.left + cursorCoords.left;
                  const y = editorCoords.top + cursorCoords.top;

                  // 检测颜色格式
                  const format = detectColorFormat(colorValue);

                  // 打开颜色选择器
                  setColorSelection({
                    open: true,
                    position: { x, y },
                    color: colorValue,
                    range: new monacoInstance.Range(
                      position.lineNumber,
                      colorStart + 1, // 转换回Monaco的1开始索引
                      position.lineNumber,
                      colorEnd + 1
                    ),
                    format,
                  });
                  break; // 找到匹配的颜色值后退出循环
                }
              }
            }
          }
        }
      }
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

  /**
   * 处理颜色变化
   * @param newColor 新的颜色值（ColorPicker对象）
   */
  const handleColorChange = (newColor: any) => {
    if (editorRef.current && monacoRef.current && colorSelection.range) {
      // 获取编辑器模型
      const model = editorRef.current.getModel();
      if (model) {
        // 根据原始格式格式化颜色
        const formattedColor = formatColor(
          newColor,
          colorSelection.format,
          colorSelection.color
        );

        // 执行编辑操作，替换选中的颜色值
        editorRef.current.executeEdits('colorPicker', [
          {
            range: colorSelection.range,
            text: formattedColor,
            forceMoveMarkers: true,
          },
        ]);

        // 更新编辑器内容
        const newValue = model.getValue();
        if (onChange) {
          onChange(newValue);
        }

        // 关闭颜色选择器
        setColorSelection({
          ...colorSelection,
          open: false,
          color: formattedColor,
        });
      }
    }
  };

  /**
   * 关闭颜色选择器
   */
  const handleCloseColorPicker = () => {
    setColorSelection({
      ...colorSelection,
      open: false,
    });
  };

  // 编辑器容器样式
  const editorContainerStyle = {
    border: `1px solid ${token.colorBorder}`,
    borderRadius: `${token.borderRadiusLG}px`,
    overflow: 'hidden' as const,
  };

  return (
    <>
      <div style={editorContainerStyle}>
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
          }}
        />
        <style>{`
          .monaco-placeholder-text {
            color: ${token.colorTextPlaceholder};
            font-style: italic;
          }
        `}</style>
      </div>

      {/* 颜色选择器弹出层 */}
      <Popover
        open={colorSelection.open}
        onOpenChange={(visible) => !visible && handleCloseColorPicker()}
        trigger="click"
        content={
          <div style={colorPickerContainerStyle}>
            <ColorPicker
              // 将颜色字符串转换为antd ColorPicker可接受的格式
              value={colorSelection.color}
              onChange={(color) => {
                // 实时更新颜色选择器中显示的颜色，保持原始格式
                setColorSelection({
                  ...colorSelection,
                  color: formatColor(color, colorSelection.format, colorSelection.color),
                });
              }}
              onChangeComplete={(color) => handleColorChange(color)}
              showText
              // 根据颜色格式设置ColorPicker的格式
              format={
                colorSelection.format === 'hex' ? 'hex' :
                (colorSelection.format === 'rgb' || colorSelection.format === 'rgba') ? 'rgb' :
                (colorSelection.format === 'hsl' || colorSelection.format === 'hsla') ? 'hsb' : 'hex'
              }
              // 允许清除色值
              allowClear={false}
              // 显示颜色预设面板
              presets={[
                {
                  label: '预设颜色',
                  colors: colorSuggestions.map(suggestion => suggestion.label).filter(label => label !== 'transparent'),
                },
              ]}
            />
          </div>
        }
        styles={{
          root: {
            position: 'absolute',
            left: `${colorSelection.position.x}px`,
            top: `${colorSelection.position.y + 20}px`,
            zIndex: 1000, // 确保弹出层在最上层
          },
        }}
      />
    </>
  );
};

export default MonacoCssEditor;
