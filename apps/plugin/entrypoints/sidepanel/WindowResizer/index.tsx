import React, { useState, useRef, useEffect } from 'react';
import './styles.css';

interface WindowSize {
  width: number;
  height: number;
  label: string;
}

interface WindowResizerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WindowResizer: React.FC<WindowResizerProps> = ({ isOpen, onClose }) => {
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [currentSize, setCurrentSize] = useState<string>('获取中...');
  const menuRef = useRef<HTMLDivElement>(null);

  // 预设窗口尺寸选项
  const presetSizes: WindowSize[] = [
    { width: 320, height: 568, label: 'iPhone 5' },
    { width: 375, height: 667, label: 'iPhone 6' },
    { width: 1024, height: 768, label: 'iPad' },
    { width: 1440, height: 900, label: 'Laptop' },
    { width: 1680, height: 1050, label: 'Desktop' },
    { width: 1920, height: 1080, label: 'Desktop HD' },
  ];

  // 获取当前窗口尺寸
  const getCurrentWindowSize = () => {
    chrome.windows.getCurrent({ populate: false }, (window) => {
      if (window.width && window.height) {
        setCurrentSize(`${window.width} × ${window.height}`);
        // 设置自定义输入框的默认值为当前窗口尺寸
        setCustomWidth(window.width.toString());
        setCustomHeight(window.height.toString());
      } else {
        setCurrentSize('未知');
      }
    });
  };

  // 当组件打开时获取当前窗口尺寸
  useEffect(() => {
    if (isOpen) {
      getCurrentWindowSize();
    }
  }, [isOpen]);

  // 调整窗口尺寸的函数
  const resizeWindow = (width: number, height: number) => {
    chrome.runtime.sendMessage({
      action: 'resizeWindow',
      width,
      height
    }, (response) => {
      console.log('Window resize response:', response);
      if (response?.success) {
        // 更新当前窗口尺寸显示
        setTimeout(getCurrentWindowSize, 500);
      }
    });
  };

  // 处理预设尺寸的点击
  const handlePresetClick = (size: WindowSize) => {
    resizeWindow(size.width, size.height);
  };

  // 处理自定义尺寸的提交
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      alert('请输入有效的宽度和高度');
      return;
    }

    resizeWindow(width, height);
  };

  // 点击菜单外部时关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="window-resizer-overlay">
      <div className="window-resizer-menu" ref={menuRef}>
        <div className="window-resizer-header">
          <h3>窗口缩放</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="preset-sizes">
          {presetSizes.map((size, index) => (
            <button
              key={index}
              className="preset-size-btn"
              onClick={() => handlePresetClick(size)}
            >
              <div className="size-icon">
                <div className="size-preview" style={{
                  width: `${size.width / 100}px`,
                  height: `${size.height / 100}px`
                }}></div>
              </div>
              <div className="size-label">
                <span className="device-name">{size.label}</span>
                <span className="dimensions">{size.width} × {size.height}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="custom-size">
          <h4>自定义尺寸</h4>
          <form onSubmit={handleCustomSubmit} className="custom-size-form">
            <div className="input-group">
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                placeholder="宽度"
                min="200"
                required
              />
              <span className="dimension-separator">×</span>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                placeholder="高度"
                min="200"
                required
              />
            </div>
            <button type="submit" className="resize-btn">调整大小</button>
          </form>
        </div>

        <div className="resize-info">
          <p>当前窗口: <span id="current-size">{currentSize}</span></p>
        </div>
      </div>
    </div>
  );
};

export default WindowResizer;
