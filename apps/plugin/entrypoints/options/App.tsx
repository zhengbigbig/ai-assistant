import {
  ApiOutlined,
  CodeOutlined,
  GlobalOutlined,
  KeyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

// 配置页面组件
import GeneralSettings from './components/GeneralSettings';
import KeyboardShortcutsSettings from './components/KeyboardShortcutsSettings';
import PromptWordsSettings from './components/PromptWordsSettings';
import SidebarSettings from './components/SidebarSettings';
import TextSelectionSettings from './components/TextSelectionSettings';
import TranslationSettings from './components/TranslationSettings';
import WebHelperSettings from './components/WebHelperSettings';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

// 使用styled-components创建样式化组件
const StyledLayout = styled(Layout)`
  min-height: 100vh;
  min-width: 800px;
`;

const StyledHeader = styled(Header)`
  display: flex;
  align-items: center;
  background-color: #6e59f2;
  padding: 0 24px;
`;

const LogoWrapper = styled.div`
  width: 40px;
  height: 40px;
  margin-right: 16px;
`;

const StyledSider = styled(Sider)`
  background-color: #fff;
  border-right: 1px solid #f0f0f0;

  .ant-menu {
    height: 100%;
    border-right: 0;
  }
`;

const StyledContentLayout = styled(Layout)`
  padding: 24px;
  overflow: auto;
  background-color: #fff;
  height: calc(100vh - 64px);
`;

const StyledContent = styled(Content)`
  padding: 0;
  margin: 0;
  border-radius: 8px;
  display: table;
`;

// 菜单项配置
const menuItems = [
  {
    key: 'generalSettings',
    icon: <SettingOutlined />,
    label: '通用配置',
  },
  {
    key: 'sidebar',
    icon: <MenuFoldOutlined />,
    label: '侧边栏',
  },
  {
    key: 'textSelection',
    icon: <ApiOutlined />,
    label: '划词助手',
  },
  {
    key: 'promptWords',
    icon: <CodeOutlined />,
    label: '提示词',
  },
  {
    key: 'translation',
    icon: <TranslationOutlined />,
    label: '翻译',
  },
  {
    key: 'webHelper',
    icon: <GlobalOutlined />,
    label: '网页助手',
  },
  {
    key: 'keyboardShortcuts',
    icon: <KeyOutlined />,
    label: '键盘快捷键',
  },
];

/**
 * App组件
 * 管理插件设置页面的整体布局和导航
 */
const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenuKey, setActiveMenuKey] = useState('generalSettings');
  // 获取主题配置
  const { token } = theme.useToken();

  // 验证菜单键是否有效
  const isValidMenuKey = useCallback((key: string) => {
    return menuItems.some((item) => item.key === key);
  }, []);

  // 初始化时从URL读取查询参数
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const menuKey = urlParams.get('activeMenuKey');

    if (menuKey && isValidMenuKey(menuKey)) {
      setActiveMenuKey(menuKey);
    }
  }, [isValidMenuKey]);

  // 更新URL查询参数
  const updateUrlParams = useCallback((key: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('activeMenuKey', key);
    window.history.pushState({}, '', url.toString());
  }, []);

  // 菜单点击处理函数
  const handleMenuClick = useCallback(
    (key: string) => {
      if (activeMenuKey !== key) {
        setActiveMenuKey(key);
        updateUrlParams(key);
      }
    },
    [activeMenuKey, updateUrlParams]
  );

  // 渲染当前选中的内容
  const renderContent = () => {
    switch (activeMenuKey) {
      case 'generalSettings':
        return <GeneralSettings />;
      case 'sidebar':
        return <SidebarSettings />;
      case 'textSelection':
        return <TextSelectionSettings />;
      case 'promptWords':
        return <PromptWordsSettings />;
      case 'translation':
        return <TranslationSettings />;
      case 'webHelper':
        return <WebHelperSettings />;

      case 'keyboardShortcuts':
        return <KeyboardShortcutsSettings />;
      default:
        return null;
    }
  };

  // 切换菜单收起状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 渲染折叠按钮
  const CollapseButton = styled.div`
    position: absolute;
    right: -12px;
    top: 300px;
    width: 30px;
    height: 30px;
    background-color: #fff;
    border-radius: 50%;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1;
    border: 1px solid #f0f0f0;
  `;

  return (
    <StyledLayout>
      <StyledHeader>
        <LogoWrapper />
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          AI Assistant 设置
        </Title>
      </StyledHeader>
      <Layout>
        <StyledSider
          width={230}
          theme="light"
          breakpoint="lg"
          trigger={null}
          collapsible
          collapsed={collapsed}
        >
          <CollapseButton onClick={toggleCollapsed}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </CollapseButton>
          <Menu
            mode="inline"
            selectedKeys={[activeMenuKey]}
            items={menuItems}
            onClick={({ key }) => handleMenuClick(key)}
          />
        </StyledSider>
        <StyledContentLayout>
          <StyledContent
            style={{
              borderRadius: token.borderRadiusLG,
            }}
          >
            {renderContent()}
          </StyledContent>
        </StyledContentLayout>
      </Layout>
    </StyledLayout>
  );
};

export default App;
