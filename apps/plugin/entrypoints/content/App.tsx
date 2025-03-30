import { StyleProvider } from '@ant-design/cssinjs';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import TextSelectionManager from './components/TextSelectionManager';

// 引入全局样式
import '../../styles/global.css';

function App({ shadowRoot }: { shadowRoot: ShadowRoot }) {
  console.log('App mounted');
  return (
    <StyleProvider
      hashPriority="high"
      container={shadowRoot || undefined}
    >
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#6e59f2',
            borderRadius: 8,
          },
        }}
      >
        <AntApp>
          <TextSelectionManager />
        </AntApp>
      </ConfigProvider>
    </StyleProvider>
  );
}

export default App;
