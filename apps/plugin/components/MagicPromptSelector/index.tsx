import React, { useState } from 'react';
import './styles.css';

interface MagicPromptSelectorProps {
  selectedPrompt: string | null;
  onSelectPrompt: (prompt: string | null) => void;
}

// 预设的魔法指令列表
const magicPrompts = [
  {
    id: 'summarize',
    name: '总结内容',
    prompt: '请帮我总结以下内容的要点：',
  },
  {
    id: 'explain',
    name: '解释概念',
    prompt: '请用简单的语言解释以下概念：',
  },
  {
    id: 'translate-en',
    name: '翻译成英文',
    prompt: '请将以下内容翻译成英文：',
  },
  {
    id: 'translate-zh',
    name: '翻译成中文',
    prompt: '请将以下内容翻译成中文：',
  },
  {
    id: 'code-explain',
    name: '解释代码',
    prompt: '请解释以下代码的功能和工作原理：',
  },
  {
    id: 'optimize',
    name: '优化建议',
    prompt: '请对以下内容提供优化建议：',
  },
];

/**
 * 魔法指令选择器组件
 * 用于选择常用的预设指令
 */
const MagicPromptSelector: React.FC<MagicPromptSelectorProps> = ({
  selectedPrompt,
  onSelectPrompt,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 获取当前选中的指令
  const getCurrentPromptName = () => {
    if (!selectedPrompt) return '魔法指令';

    const found = magicPrompts.find(
      (item) => item.prompt === selectedPrompt
    );
    return found ? found.name : '自定义指令';
  };

  // 切换下拉菜单
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // 选择指令
  const handleSelectPrompt = (prompt: string) => {
    onSelectPrompt(prompt);
    setIsOpen(false);
  };

  return (
    <div className="magic-prompt-selector">
      <button
        className="magic-prompt-toggle"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
      >
        <span>{getCurrentPromptName()}</span>
        <span className="dropdown-icon">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="magic-prompt-dropdown">
          <ul className="magic-prompt-list">
            {magicPrompts.map((item) => (
              <li
                key={item.id}
                className="magic-prompt-item"
                onClick={() => handleSelectPrompt(item.prompt)}
              >
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MagicPromptSelector;
