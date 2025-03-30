import { StyleProvider } from '@ant-design/cssinjs';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import styled, { StyleSheetManager } from 'styled-components';
import TextSelectionManager from './components/TextSelectionManager';

// 引入全局样式
import '../../styles/global.css';

const StyledAntApp = styled(AntApp)`
  .ant-modal-root,
  .ant-modal-wrap {
    position: unset !important;
  }
`;

function App({ shadowRoot }: { shadowRoot: ShadowRoot }) {
  console.log('App mounted');
  return (
    <StyleSheetManager target={shadowRoot} enableVendorPrefixes>
      <StyleProvider hashPriority="low" container={shadowRoot || undefined}>
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
          <StyledAntApp>
            <TextSelectionManager />
          </StyledAntApp>
        </ConfigProvider>
      </StyleProvider>
    </StyleSheetManager>
  );
}

export default App;
