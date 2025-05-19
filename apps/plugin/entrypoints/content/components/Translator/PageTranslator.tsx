import {
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  CommentOutlined,
  CustomerServiceOutlined,
  SettingFilled,
  TranslationOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, FloatButton, Menu } from 'antd';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useConfigStore, useTranslation } from '../../../stores/configStore';
import { useTranslationStore } from '../../../stores/translationStore';
import { languages } from '../../../../utils/languages';
import {
  detectPageLanguage,
  disableMutationObserver,
  enableMutationObserver,
  restorePage,
  translatePage,
} from './helpers';
import { CUSTOM_STYLE_ELEMENT_ID } from '../../../../constants/config';
import { injectCustomStyleToHtml } from '@/utils/css';

const CloseIcon = styled(CloseCircleOutlined)`
  color: rgba(0, 0, 0, 0.45);
  &:hover {
    color: rgba(0, 0, 0, 0.65);
  }
`;

/**
 * 页面翻译组件
 * 提供整个页面的翻译功能
 */
const PageTranslator: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);

  // 从store获取翻译设置
  const translation = useTranslation();
  const { forbiddenWebsites, displayStyle, customStyles, alwaysTranslateWebsites } = translation;
  const currentCustomStyle = customStyles?.find(
    (c) => c?.name === displayStyle
  )?.css;

  // ctx上下文
  const ctx = useTranslationStore((state) => state.ctx);
  const pageLanguageState = useTranslationStore(
    (state) => state.pageLanguageState
  );
  // 是否已经翻译
  const isTranslated = pageLanguageState === 'translated';
  // 检查当前网站是否在禁止翻译列表中
  const isWebsiteForbidden = (): boolean => {
    if (!forbiddenWebsites || forbiddenWebsites.length === 0) return false;

    const currentHostname = ctx.tabHostName;
    return forbiddenWebsites.some(
      (site: string) =>
        site?.includes(currentHostname)
    );
  };

  // 检查当前网站是否在总是翻译列表中
  const isWebsiteAlwaysTranslate = (): boolean => {
    if (!alwaysTranslateWebsites || alwaysTranslateWebsites.length === 0) return false;

    const currentHostname = ctx.tabHostName;
    return alwaysTranslateWebsites.some(
      (site: string) =>
        site?.includes(currentHostname)
    );
  };

  // 监听background的消息
  useEffect(() => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'translatePage') {
        // 翻译页面前更新样式
        injectCustomStyleToHtml(currentCustomStyle || '');
        translatePage();
      }
    });
  }, []);

  // 监听自定义样式变更
  useEffect(() => {
    // 当自定义样式或显示样式变更时，更新注入的样式
    injectCustomStyleToHtml(currentCustomStyle || '');
  }, [displayStyle, customStyles]);

  // 初始化
  useEffect(() => {
    // 初始化上下文
    useTranslationStore.getState().initCtx();
    useTranslationStore.getState().resetTranslationState();

    // 初始注入自定义样式
    injectCustomStyleToHtml(currentCustomStyle || '');
  }, []);

  useEffect(() => {
    if(!ctx?.tabHostName){
      return;
    }
    // 当前窗口是顶层窗口
    if (window.self === window.top) {
      const onTabVisible = function () {
        chrome.runtime.sendMessage(
          {
            action: 'detectTabLanguage',
          },
          async (result) => {
            // 如果语言未检测到或为"und"，则手动检测
            if (result === 'und' || !result) {
              result = await detectPageLanguage();
            }
            console.log('result', result);
            result = result || 'und';

            // 如果结果仍为"und"
            if (result === 'und') {
              useTranslationStore.getState().setOriginalTabLanguage(result);
            }

            if (result !== 'und') {
              // 修正语言代码
              const langCode = languages.fixTLanguageCode(result);
              if (langCode) {
                useTranslationStore.getState().setOriginalTabLanguage(langCode);
              }
              // 特定情况下的自动翻译逻辑
              if (
                location.hostname === 'translatewebpages.org' &&
                location.href.indexOf('?autotranslate') !== -1
              ) {
                translatePage();
              } else {
                // 避免在翻译网站上进行翻译
                if (
                  location.hostname !== 'translate.googleusercontent.com' &&
                  location.hostname !== 'translate.google.com' &&
                  location.hostname !== 'translate.yandex.com'
                ) {
                  // 如果页面是原始状态且不在隐私浏览模式下
                  if (
                    useTranslationStore.getState().pageLanguageState ===
                      'original' &&
                    !chrome.extension.inIncognitoContext
                  ) {
                    // 如果当前网站不在"永不翻译的网站"列表中
                    if (!isWebsiteForbidden()) {
                      const currentTargetLanguage =
                        useConfigStore.getState().translation.targetLanguage;
                      // 如果当前网站在"总是翻译"列表中，直接翻译
                      if (isWebsiteAlwaysTranslate()) {
                        translatePage();
                      }
                      // 如果语言代码有效，且不是目标语言，且在"总是翻译的语言"列表中，则翻译页面
                      else if (langCode && langCode !== currentTargetLanguage) {
                        translatePage();
                      }
                    }
                  }
                }
              }
            }
          }
        );
      };

      // 延迟120ms执行初始化
      setTimeout(function () {
        if (document.visibilityState == 'visible') {
          onTabVisible();
        } else {
          // 如果页面不可见，则添加可见性变化监听器
          const handleVisibilityChange = function () {
            if (document.visibilityState == 'visible') {
              document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
              );
              onTabVisible();
            }
          };
          document.addEventListener(
            'visibilitychange',
            handleVisibilityChange,
            false
          );
        }
      }, 120);
    } else {
      // iframe框架初始化
      // 获取主框架的标签语言
      chrome.runtime.sendMessage(
        {
          action: 'getMainFrameTabLanguage',
        },
        (result) => {
          useTranslationStore
            .getState()
            .setOriginalTabLanguage(result || 'und');
        }
      );
      // 获取主框架的页面语言状态
      chrome.runtime.sendMessage(
        {
          action: 'getMainFramePageLanguageState',
        },
        (result) => {
          // 如果主框架已翻译但当前框架未翻译，则翻译当前框架
          if (
            result === 'translated' &&
            useTranslationStore.getState().pageLanguageState === 'original'
          ) {
            translatePage();
          }
          // 如果主框架未翻译但当前网站在"总是翻译"列表中，则翻译当前框架
          else if (
            result !== 'translated' &&
            useTranslationStore.getState().pageLanguageState === 'original' &&
            isWebsiteAlwaysTranslate()
          ) {
            translatePage();
          }
        }
      );
    }
  }, [ctx?.tabHostName]);

  // 页面可见性变化处理
  useEffect(() => {
    const handleVisibilityChange = function () {
      const pageIsVisible = document.visibilityState === 'visible';
      useTranslationStore.getState().setPageIsVisible(pageIsVisible);
      if (
        pageIsVisible &&
        useTranslationStore.getState().pageLanguageState === 'translated'
      ) {
        enableMutationObserver();
      } else {
        disableMutationObserver();
      }
    };
    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
      false
    );
    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
        false
      );
    };
  }, []);

  // 显示翻译按钮
  return (
    <FloatButton.Group
      open={open}
      shape="square"
      trigger="hover"
      onOpenChange={setOpen}
      style={{ insetInlineEnd: 8 }}
      icon={<CustomerServiceOutlined />}
      closeIcon={<CustomerServiceOutlined />}
      badge={{
        count: open ? (
          <div>
            <CloseIcon />
          </div>
        ) : (
          0
        ),
        showZero: false,
      }}
    >
      {settingOpen && (
        <FloatButton
          style={{ transition: 'ease-in-out 0.5s' }}
          onMouseMove={() => setSettingOpen(true)}
          onMouseLeave={() => setSettingOpen(false)}
          icon={<SettingFilled />}
          onClick={() => {
            // 打开翻译设置面板
            chrome.runtime.sendMessage({
              action: 'openOptionsPage',
              hash: '?activeMenuKey=translation',
            });
          }}
        />
      )}
      <FloatButton
        onMouseMove={() => setSettingOpen(true)}
        onMouseLeave={() => setSettingOpen(false)}
        icon={isTranslated ? <TranslationOutlined /> : <TranslationOutlined />}
        onClick={() => {
          if (isTranslated) {
            // 恢复页面前更新样式
            injectCustomStyleToHtml(currentCustomStyle || '');
            restorePage();
          } else {
            // 翻译页面前更新样式
            injectCustomStyleToHtml(currentCustomStyle || '');
            translatePage();
          }
        }}
      />
      <FloatButton />
      <FloatButton icon={<CommentOutlined />} />
    </FloatButton.Group>
  );
};

export default PageTranslator;
