import { StyleProvider } from '@ant-design/cssinjs';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { StyleSheetManager } from 'styled-components';
import TextSelectionManager from './components/TextSelectionManager';
import ScreenshotManager from './components/ScreenshotManager';
import PageTranslator from './components/Translator/PageTranslator';
import HoverTranslator from './components/Translator/HoverTranslator';
import SubtitleTranslator from './components/Translator/SubtitleTranslator';
import InputTranslator from './components/Translator/InputTranslator';

// 引入全局样式
import '../../styles/global.css';

function App({ shadowRoot }: { shadowRoot: ShadowRoot }) {
  console.log('App mounted');
  return (
    <StyleSheetManager target={shadowRoot}>
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
          <AntdApp>
            <DndProvider backend={HTML5Backend}>
              <TextSelectionManager />
              <ScreenshotManager />
              <PageTranslator />
              <HoverTranslator />
              <SubtitleTranslator />
              <InputTranslator />
            </DndProvider>
          </AntdApp>
        </ConfigProvider>
      </StyleProvider>
    </StyleSheetManager>
  );
}

export default App;
