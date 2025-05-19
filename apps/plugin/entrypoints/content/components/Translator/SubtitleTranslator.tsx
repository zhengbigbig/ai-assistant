import React, { useEffect, useState } from 'react';
import { Button, message, Dropdown } from 'antd';
import { TranslationOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from '../../../stores/configStore';

// 字幕控制按钮
const SubtitleControlButton = styled(Button)`
  position: fixed;
  z-index: 99999;
  margin: 10px;
  opacity: 0.8;
  &:hover {
    opacity: 1;
  }
`;

// 视频网站配置
interface VideoSiteConfig {
  name: string;
  subtitleSelector: string;
  controlsPosition: {
    bottom: string;
    right: string;
  };
}

// 支持的视频网站配置
const VIDEO_SITES: { [key: string]: VideoSiteConfig } = {
  'www.youtube.com': {
    name: 'YouTube',
    subtitleSelector: '.ytp-caption-segment',
    controlsPosition: {
      bottom: '70px',
      right: '10px'
    }
  },
  'www.netflix.com': {
    name: 'Netflix',
    subtitleSelector: '.player-timedtext-text-container span',
    controlsPosition: {
      bottom: '100px',
      right: '10px'
    }
  }
};

// 字幕存储
interface SubtitleCache {
  [key: string]: string;
}

// 字幕翻译组件
const SubtitleTranslator: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isActive, setIsActive] = useState(false);
  const [currentSite, setCurrentSite] = useState<VideoSiteConfig | null>(null);
  const [subtitleCache, setSubtitleCache] = useState<SubtitleCache>({});

  // 从store获取翻译设置
  const translation = useTranslation();
  const { enableVideoSubtitleTranslation, targetLanguage, translationService } = translation;

  // 检测当前网站并初始化
  useEffect(() => {
    if (!enableVideoSubtitleTranslation) return;

    const hostname = window.location.hostname;

    if (VIDEO_SITES[hostname]) {
      setCurrentSite(VIDEO_SITES[hostname]);
      console.log(`检测到支持的视频网站: ${VIDEO_SITES[hostname].name}`);
    } else {
      setCurrentSite(null);
    }
  }, [enableVideoSubtitleTranslation]);

  // 监听字幕变化
  useEffect(() => {
    if (!enableVideoSubtitleTranslation || !currentSite || !isActive) return;

    // 创建MutationObserver以监视DOM变化
    const observer = new MutationObserver(handleSubtitleChanges);

    // 查找字幕容器
    const startObserving = () => {
      const subtitleElements = document.querySelectorAll(currentSite.subtitleSelector);

      if (subtitleElements.length > 0) {
        console.log('找到字幕元素，开始监听变化');

        // 监听整个文档，因为字幕元素可能会被替换
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });

        // 处理已有字幕
        handleExistingSubtitles();
      } else {
        // 如果没有找到字幕元素，稍后再尝试
        setTimeout(startObserving, 1000);
      }
    };

    startObserving();

    return () => {
      observer.disconnect();
      // 恢复原始字幕
      restoreOriginalSubtitles();
    };
  }, [currentSite, isActive, enableVideoSubtitleTranslation]);

  // 处理已有字幕
  const handleExistingSubtitles = () => {
    if (!currentSite) return;

    const subtitleElements = document.querySelectorAll(currentSite.subtitleSelector);

    if (subtitleElements.length > 0) {
      subtitleElements.forEach(element => {
        const originalText = element.textContent;
        if (originalText && originalText.trim() !== '') {
          translateSubtitle(element as HTMLElement, originalText);
        }
      });
    }
  };

  // 处理字幕变化
  const handleSubtitleChanges = (mutations: MutationRecord[]) => {
    if (!currentSite) return;

    for (const mutation of mutations) {
      // 检查是否字幕相关的变化
      if (
        mutation.type === 'childList' ||
        mutation.type === 'characterData'
      ) {
        // 查找字幕元素
        const subtitleElements = document.querySelectorAll(currentSite.subtitleSelector);

        subtitleElements.forEach(element => {
          // 检查是否已经处理过
          if (element.getAttribute('data-translated') === 'true') return;

          const originalText = element.textContent;
          if (originalText && originalText.trim() !== '') {
            translateSubtitle(element as HTMLElement, originalText);
          }
        });
      }
    }
  };

  // 翻译字幕
  const translateSubtitle = async (element: HTMLElement, originalText: string) => {
    // 标记为正在处理
    element.setAttribute('data-translated', 'true');

    // 保存原始字幕文本
    element.setAttribute('data-original-text', originalText);

    // 检查缓存
    if (subtitleCache[originalText]) {
      applyTranslatedSubtitle(element, originalText, subtitleCache[originalText]);
      return;
    }

    try {
      // 发送消息到后台脚本进行翻译
      const result = await chrome.runtime.sendMessage({
        action: 'translateText',
        translationService,
        targetLanguage,
        sourceText: originalText
      });

      if (!result || result.error) {
        throw new Error(result?.error || '翻译失败');
      }

      const translatedText = result.translatedText;

      // 更新缓存
      setSubtitleCache(prev => ({
        ...prev,
        [originalText]: translatedText
      }));

      // 应用翻译后的字幕
      applyTranslatedSubtitle(element, originalText, translatedText);
    } catch (error) {
      console.error('字幕翻译出错:', error);
      // 出错时恢复原始字幕
      element.textContent = originalText;
    }
  };

  // 应用翻译后的字幕
  const applyTranslatedSubtitle = (element: HTMLElement, originalText: string, translatedText: string) => {
    // 双语字幕
    element.innerHTML = `
      <div>${originalText}</div>
      <div style="color: #6e59f2;">${translatedText}</div>
    `;

    // 调整样式，确保字幕不超出屏幕
    const parentElement = element.parentElement;
    if (parentElement) {
      // 字幕容器可能需要调整高度和位置
      parentElement.style.maxHeight = 'none';

      // 确保字幕在屏幕底部显示
      if (currentSite?.name === 'YouTube') {
        // YouTube特定调整
        const ytpCaptionsWindow = document.querySelector('.ytp-caption-window-container');
        if (ytpCaptionsWindow) {
          (ytpCaptionsWindow as HTMLElement).style.bottom = '50px';
        }
      }
    }
  };

  // 还原原始字幕
  const restoreOriginalSubtitles = () => {
    if (!currentSite) return;

    const subtitleElements = document.querySelectorAll(`${currentSite.subtitleSelector}[data-translated="true"]`);

    subtitleElements.forEach(element => {
      const originalText = element.getAttribute('data-original-text');
      if (originalText) {
        element.textContent = originalText;
      }
      element.removeAttribute('data-translated');
      element.removeAttribute('data-original-text');
    });

    // 恢复样式
    if (currentSite.name === 'YouTube') {
      const ytpCaptionsWindow = document.querySelector('.ytp-caption-window-container');
      if (ytpCaptionsWindow) {
        (ytpCaptionsWindow as HTMLElement).style.bottom = '';
      }
    }
  };

  // 启用或禁用字幕翻译
  const toggleSubtitleTranslation = () => {
    if (!currentSite) {
      messageApi.info('当前网站不支持字幕翻译');
      return;
    }

    if (isActive) {
      setIsActive(false);
      restoreOriginalSubtitles();
      messageApi.success('字幕翻译已禁用');
    } else {
      setIsActive(true);
      messageApi.success('字幕翻译已启用');
      handleExistingSubtitles();
    }
  };

  // 下拉菜单项
  const menuItems = [
    {
      key: 'toggle',
      label: isActive ? '禁用字幕翻译' : '启用字幕翻译',
      onClick: toggleSubtitleTranslation
    },
    {
      key: 'settings',
      label: '翻译设置',
      onClick: () => {
        // 打开翻译设置面板
        chrome.runtime.sendMessage({
          action: 'openOptionsPage',
          hash: '?activeMenuKey=translation'
        });
      }
    }
  ];

  // 如果不支持当前网站或禁用了功能，不渲染组件
  if (!currentSite || !enableVideoSubtitleTranslation) {
    return null;
  }

  return (
    <>
      {contextHolder}
      <Dropdown menu={{ items: menuItems }} placement="topLeft">
        <SubtitleControlButton
          type={isActive ? 'primary' : 'default'}
          icon={<TranslationOutlined />}
          style={{
            bottom: currentSite.controlsPosition.bottom,
            right: currentSite.controlsPosition.right
          }}
          onClick={toggleSubtitleTranslation}
        >
          {isActive ? '双语字幕' : '字幕翻译'}
        </SubtitleControlButton>
      </Dropdown>
    </>
  );
};

export default SubtitleTranslator;
