import React, { useState, useEffect } from 'react';
import './styles.css';

/**
 * 选项页面组件
 * 管理插件的所有配置项
 */
const OptionsPage: React.FC = () => {
  // API 密钥配置
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('https://api.openai.com/v1');

  // 功能设置
  const [enableContextMenu, setEnableContextMenu] = useState(true);
  const [enableScreenshot, setEnableScreenshot] = useState(true);
  const [defaultModel, setDefaultModel] = useState('gpt-4');

  // 加载设置
  useEffect(() => {
    chrome.storage.sync.get(
      [
        'apiKey',
        'apiEndpoint',
        'enableContextMenu',
        'enableScreenshot',
        'defaultModel',
      ],
      (result) => {
        if (result.apiKey) setApiKey(result.apiKey);
        if (result.apiEndpoint) setApiEndpoint(result.apiEndpoint);
        if (result.enableContextMenu !== undefined) setEnableContextMenu(result.enableContextMenu);
        if (result.enableScreenshot !== undefined) setEnableScreenshot(result.enableScreenshot);
        if (result.defaultModel) setDefaultModel(result.defaultModel);
      }
    );
  }, []);

  // 保存设置
  const saveSettings = () => {
    chrome.storage.sync.set(
      {
        apiKey,
        apiEndpoint,
        enableContextMenu,
        enableScreenshot,
        defaultModel,
      },
      () => {
        showSavedMessage();
      }
    );
  };

  // 显示保存成功消息
  const [showSaved, setShowSaved] = useState(false);
  const showSavedMessage = () => {
    setShowSaved(true);
    setTimeout(() => {
      setShowSaved(false);
    }, 3000);
  };

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>AI Assistant 设置</h1>
        <p>配置您的 AI 助手以获得最佳体验</p>
      </header>

      <main className="options-content">
        <section className="options-section">
          <h2>API 设置</h2>
          <div className="form-group">
            <label htmlFor="apiKey">API 密钥</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <p className="help-text">您的 API 密钥将安全地存储在浏览器中</p>
          </div>

          <div className="form-group">
            <label htmlFor="apiEndpoint">API 端点</label>
            <input
              type="text"
              id="apiEndpoint"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
            <p className="help-text">自定义 API 端点（用于自托管或代理）</p>
          </div>
        </section>

        <section className="options-section">
          <h2>功能设置</h2>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={enableContextMenu}
                onChange={(e) => setEnableContextMenu(e.target.checked)}
              />
              启用右键菜单功能
            </label>
            <p className="help-text">允许通过右键菜单快速访问 AI 助手功能</p>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={enableScreenshot}
                onChange={(e) => setEnableScreenshot(e.target.checked)}
              />
              启用截图功能
            </label>
            <p className="help-text">允许捕获页面截图并发送给 AI 助手</p>
          </div>

          <div className="form-group">
            <label htmlFor="defaultModel">默认模型</label>
            <select
              id="defaultModel"
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5">GPT-3.5</option>
              <option value="qwen-7b">通义千问</option>
              <option value="llama-3">LLAMA-3</option>
            </select>
            <p className="help-text">设置默认使用的 AI 模型</p>
          </div>
        </section>

        <section className="options-section">
          <h2>关于</h2>
          <p>
            AI Assistant 版本: 0.1.0
            <br />
            <a href="https://github.com/ai-assistant" target="_blank" rel="noreferrer">
              项目主页
            </a>{' '}
            |{' '}
            <a href="https://github.com/ai-assistant/issues" target="_blank" rel="noreferrer">
              报告问题
            </a>
          </p>
        </section>
      </main>

      <footer className="options-footer">
        <button className="save-button" onClick={saveSettings}>
          保存设置
        </button>
        {showSaved && <span className="saved-message">设置已保存！</span>}
      </footer>
    </div>
  );
};

export default OptionsPage;
