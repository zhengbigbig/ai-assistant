import React, { useState } from 'react';
import './styles.css';
import {
  ModelType,
  useAvailableModels
} from '../../entrypoints/stores/configStore';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

/**
 * 模型选择器组件
 * 用于切换不同的 AI 模型
 */
const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 使用hook获取可用模型列表
  const availableModels = useAvailableModels();

  // 获取当前选中的模型信息
  const currentModel = availableModels.find((model) => model.id === selectedModel) ||
                      (availableModels.length > 0 ? availableModels[0] : null);

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
                <div className="model-description">{model.description || model.value}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
