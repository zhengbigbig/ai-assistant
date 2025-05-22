import { useChatLoading, useChatStore } from '@/entrypoints/stores/chatStore';
import {
  BulbOutlined,
  CloseCircleFilled,
  CloudUploadOutlined,
  SearchOutlined,
  SendOutlined
} from '@ant-design/icons';
import { Attachments, Sender as AntXSender } from '@ant-design/x';
import {
  Tag as AntTag,
  ButtonProps,
  Divider,
  Flex,
  GetRef,
  theme,
  Tooltip
} from 'antd';
import React from 'react';
import styled from 'styled-components';

const Sender = styled(AntXSender)`
  .ant-sender-content {
    padding: 6px;
  }
  .ant-sender-footer {
    padding: 4px 0;
  }
`

const btnProps: ButtonProps = {
  variant: 'text',
  color: 'primary',
  icon: <SendOutlined />,
  shape: 'default',
};

const Tag = styled(AntTag)<{ $active: boolean; $borderColor: string }>`
  border: ${(props) =>
    props.$active
      ? `1px solid ${props.$borderColor}`
      : '1px solid transparent'};
  cursor: pointer;
  &:hover {
    background: rgba(114, 118, 139, 0.12);
  }
`;

const SelectedText = styled.div`
  padding: 6px;
  border: 1px solid #f6eded;
  border-radius: 8px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SelectedTextClose = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  cursor: pointer;
  color: #d9d9d9;
  &:hover {
    color: #999;
  }
  transition: color 0.3s ease;
  transform: translate(25%, -50%);
`;

const ChatInput = () => {
  const attachmentsRef = React.useRef<GetRef<typeof Attachments>>(null);
  const senderRef = React.useRef<GetRef<typeof Sender>>(null);
  const loading = useChatLoading();
  const {
    chatOpenAI,
    abortRequest,
    setAttachments,
    setInputValue,
    updatePlugin,
    setSelectedText,
  } = useChatStore();
  const attachments = useChatStore((state) => state.attachments);
  const inputValue = useChatStore((state) => state.inputValue);
  const plugins = useChatStore((state) => state.plugins);
  const selectedText = useChatStore((state) => state.selectedText);
  const { token } = theme.useToken();
  console.log("selectedText", selectedText)
  return (
    <Sender
      loading={loading}
      value={inputValue}
      onChange={(v) => {
        setInputValue(v);
      }}
      style={{ padding: '2px 8px', borderRadius: 10 }}
      autoSize={{ minRows: 2, maxRows: 6 }}
      placeholder="输入内容后按回车发送，Shift+Enter换行"
      header={
        <div style={{ paddingTop: attachments?.length || !!selectedText ? 4 : 0 }}>
          {!!attachments?.length && (
            <>
              <Attachments
                ref={attachmentsRef}
                // Mock not real upload file
                beforeUpload={() => false}
                items={attachments}
                onChange={({ fileList }) => setAttachments(fileList)}
                placeholder={(type) =>
                  type === 'drop'
                    ? {
                        title: 'Drop file here',
                      }
                    : {
                        icon: <CloudUploadOutlined />,
                        title: 'Upload files',
                        description:
                          'Click or drag files to this area to upload',
                      }
                }
                getDropContainer={() => senderRef.current?.nativeElement}
              />
              <Divider />
            </>
          )}
          {!!selectedText && (
            <>
              <SelectedText>
                <div>来自您选择的文本</div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {selectedText}
                </div>
                <SelectedTextClose onClick={() => setSelectedText('')}>
                  <CloseCircleFilled />
                </SelectedTextClose>
              </SelectedText>
              <Divider />
            </>
          )}
        </div>
      }
      footer={({ components }) => {
        const { SendButton, LoadingButton, SpeechButton } = components;
        return (
          <Flex justify="space-between" align="center">
            <Flex gap={0} align="center">
              <Tag
                $active={
                  !!plugins.find((plugin) => plugin.id === 'think')?.enabled
                }
                $borderColor={token.colorPrimary}
                bordered={false}
                icon={<BulbOutlined />}
                onClick={() => {
                  updatePlugin('think', {
                    enabled: !plugins.find((plugin) => plugin.id === 'think')
                      ?.enabled,
                  });
                }}
              >
                思考
              </Tag>
              <Tag
                $active={
                  !!plugins.find((plugin) => plugin.id === 'search')?.enabled
                }
                $borderColor={token.colorPrimary}
                bordered={false}
                icon={<SearchOutlined />}
                onClick={() => {
                  updatePlugin('search', {
                    enabled: !plugins.find((plugin) => plugin.id === 'search')
                      ?.enabled,
                  });
                }}
              >
                搜索
              </Tag>
            </Flex>
            <Flex align="center" gap={2}>
              <SpeechButton />
              {loading ? (
                <Tooltip title="Click to cancel">
                  <LoadingButton onClick={abortRequest} type="default" />
                </Tooltip>
              ) : (
                <Tooltip
                  title={inputValue ? '发送' : '请输入内容'}
                  autoAdjustOverflow
                >
                  <SendButton
                    {...btnProps}
                  />
                </Tooltip>
              )}
            </Flex>
          </Flex>
        );
      }}
      allowSpeech
      actions={false}
      submitType="enter"
      onSubmit={() => {
        console.log('inputValue', inputValue);
        if (inputValue?.trim() === '') {
          return;
        }
        chatOpenAI(inputValue);
      }}
    />
  );
};

export default ChatInput;
