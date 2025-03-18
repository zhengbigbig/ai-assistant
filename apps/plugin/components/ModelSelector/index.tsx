import React, { useState } from 'react';
import './styles.css';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

// 可用模型列表
const availableModels = [
  { id: 'gpt-4', name: 'GPT-4', description: '最强大的模型' },
  { id: 'gpt-3.5', name: 'GPT-3.5', description: '平衡性能与速度' },
  { id: 'qwen-7b', name: '通义千问', description: '阿里通义千问模型' },
  { id: 'llama-3', name: 'LLAMA-3', description: 'Meta开源模型' },
];

/**
 * 模型选择器组件
 * 用于切换不同的 AI 模型
 */
const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 获取当前选中的模型信息
  const currentModel = availableModels.find((model) => model.id === selectedModel);

  // 切换下拉菜单
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // 选择模型
  const handleSelectModel = (modelId: string) => {
    onSelectModel(modelId);
    setIsOpen(false);
  };

  return (
    <div className="model-selector">
      <button
        className="model-selector-toggle"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
      >
        <span>{currentModel?.name || '选择模型'}</span>
        <span className="dropdown-icon">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="model-dropdown">
          <ul className="model-list">
            {availableModels.map((model) => (
              <li
                key={model.id}
                className={`model-item ${model.id === selectedModel ? 'active' : ''}`}
                onClick={() => handleSelectModel(model.id)}
              >
                <div className="model-name">{model.name}</div>
                <div className="model-description">{model.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
