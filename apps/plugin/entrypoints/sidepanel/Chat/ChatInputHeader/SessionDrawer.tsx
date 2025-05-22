import { ChatSession, useActiveSessionId, useSessionStore } from '@/entrypoints/stores/sessionStore';
import { CommentOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { Conversations } from '@ant-design/x';
import type { GetProp } from 'antd';
import { Button, Drawer, Empty, Input, Space, theme } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useChatStore } from '@/entrypoints/stores/chatStore';

// 定义会话项类型
interface SessionItem {
  key: string;
  label: string;
  timestamp: number;
  group: string;
  data: ChatSession;
}

const StyledDrawer = styled(Drawer)`
  .ant-drawer-content-wrapper {
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.1);
  }

  .ant-drawer-body {
    padding: 16px;
  }
`;

const SearchWrapper = styled.div`
  margin-bottom: 16px;
`;

const SessionDrawer: React.FC = () => {
  const { token } = theme.useToken();
  const {
    sessions,
    showSessionDrawer,
    searchKeyword,
    setShowSessionDrawer,
    setSearchKeyword,
    removeSession,
    setActiveSessionId,
    searchSessions,
  } = useSessionStore();
  const activeSessionId = useActiveSessionId();

  const [filteredSessions, setFilteredSessions] = useState<SessionItem[]>([]);

  // 处理搜索
  useEffect(() => {
    const results = searchSessions(searchKeyword);

    const items: SessionItem[] = results.map((session) => {
      // 计算分组（今天/昨天/更早）
      const sessionDate = dayjs(session.createdAt);
      const today = dayjs().startOf('day');
      const yesterday = dayjs().subtract(1, 'day').startOf('day');

      let group = '更早';
      if (sessionDate.isAfter(today) || sessionDate.isSame(today)) {
        group = '今天';
      } else if (sessionDate.isAfter(yesterday) || sessionDate.isSame(yesterday)) {
        group = '昨天';
      }

      return {
        key: session.id,
        label: session.title,
        timestamp: session.createdAt,
        group,
        data: session,
      };
    });

    setFilteredSessions(items);
  }, [searchKeyword, sessions, searchSessions]);

  // 处理会话点击
  const handleSessionClick = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowSessionDrawer(false);
  };

  // 处理会话删除
  const handleSessionDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSession(sessionId);
  };

  // 自定义分组排序
  const groupable: GetProp<typeof Conversations, 'groupable'> = {
    sort(a, b) {
      const order = { '今天': 0, '昨天': 1, '更早': 2 };
      return order[a as keyof typeof order] - order[b as keyof typeof order];
    },
    title: (group, { components: { GroupTitle } }) =>
      group ? (
        <GroupTitle>
          <Space>
            <CommentOutlined />
            <span>{group}</span>
          </Space>
        </GroupTitle>
      ) : (
        <GroupTitle />
      ),
  };

  return (
    <StyledDrawer
      title="历史会话"
      placement="bottom"
      height={400}
      open={showSessionDrawer}
      onClose={() => setShowSessionDrawer(false)}
      closable
    >
      <SearchWrapper>
        <Input
          placeholder="搜索会话"
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
        />
      </SearchWrapper>

      {filteredSessions.length > 0 ? (
        <Conversations
          style={{
            height: 300,
            background: token.colorBgContainer,
            borderRadius: token.borderRadius,
          }}
          groupable={groupable}
          items={filteredSessions}
          activeKey={activeSessionId ?? undefined}
          onActiveChange={(key: string) => handleSessionClick(key)}
          menu={(item) => ({
            trigger: (
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={(e: React.MouseEvent) => handleSessionDelete(item.key as string, e)}
                danger
              />
            ),
          })}
        />
      ) : (
        <Empty
          description={searchKeyword ? "没有找到相关会话" : "暂无历史会话"}
          style={{ marginTop: 60 }}
        />
      )}
    </StyledDrawer>
  );
};

export default SessionDrawer;
