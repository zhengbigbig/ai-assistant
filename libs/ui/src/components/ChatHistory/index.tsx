import React from 'react';
import styled from 'styled-components';
import { List, Typography, Button, Empty, Dropdown, Space } from 'antd';
import {
  HistoryOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { MenuProps } from 'antd';

const { Text, Paragraph } = Typography;

export interface ChatHistoryItem {
  /**
   * 聊天记录ID
   */
  id: string;
  /**
   * 聊天标题
   */
  title: string;
  /**
   * 创建时间
   */
  createdAt: string | Date;
  /**
   * 最后更新时间
   */
  updatedAt?: string | Date;
  /**
   * 是否收藏
   */
  isFavorite?: boolean;
}

export interface ChatHistoryProps {
  /**
   * 聊天历史记录列表
   */
  items: ChatHistoryItem[];
  /**
   * 当前选中的聊天记录ID
   */
  activeId?: string;
  /**
   * 选择聊天记录回调
   */
  onSelect?: (id: string) => void;
  /**
   * 删除聊天记录回调
   */
  onDelete?: (id: string) => void;
  /**
   * 编辑聊天记录回调
   */
  onEdit?: (id: string) => void;
  /**
   * 收藏/取消收藏聊天记录回调
   */
  onToggleFavorite?: (id: string) => void;
  /**
   * 创建新聊天回调
   */
  onNewChat?: () => void;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * 自定义样式
   */
  style?: React.CSSProperties;
  /**
   * 列表高度
   */
  height?: number | string;
  /**
   * 是否显示时间
   */
  showTime?: boolean;
  /**
   * 时间格式
   */
  timeFormat?: string;
}

interface StyledContainerProps {
  height?: number | string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const StyledContainer = styled.div<StyledContainerProps>`
  display: flex;
  flex-direction: column;
  height: ${(props) => (typeof props.height === 'number' ? `${props.height}px` : props.height)};
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 8px;
`;

const StyledList = styled(List)`
  flex: 1;
  overflow-y: auto;

  .ant-list-item {
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: #f5f5f5;
    }

    &.active {
      background-color: #e6f7ff;
    }
  }
`;

const StyledListItem = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const StyledItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const StyledItemTitle = styled(Text)`
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledItemTime = styled(Text)`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
`;

/**
 * ChatHistory组件 - 用于显示聊天历史记录
 *
 * @param props - 组件属性
 * @returns React组件
 *
 * @example
 * ```tsx
 * const historyItems = [
 *   { id: '1', title: '关于React的讨论', createdAt: new Date() },
 *   { id: '2', title: 'TypeScript类型系统', createdAt: new Date() },
 * ];
 *
 * <ChatHistory
 *   items={historyItems}
 *   activeId="1"
 *   onSelect={(id) => console.log('选择聊天:', id)}
 *   onDelete={(id) => console.log('删除聊天:', id)}
 * />
 * ```
 */
export const ChatHistory: React.FC<ChatHistoryProps> = ({
  items = [],
  activeId,
  onSelect,
  onDelete,
  onEdit,
  onToggleFavorite,
  onNewChat,
  className,
  style,
  height = 400,
  showTime = true,
  timeFormat = 'YYYY-MM-DD HH:mm',
}) => {
  const handleItemClick = (id: string) => {
    onSelect?.(id);
  };

  const getItemMenu = (item: ChatHistoryItem): MenuProps['items'] => [
    {
      key: 'edit',
      label: '重命名',
      icon: <EditOutlined />,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onEdit?.(item.id);
      },
    },
    {
      key: 'favorite',
      label: item.isFavorite ? '取消收藏' : '收藏',
      icon: item.isFavorite ? <DeleteOutlined /> : <HistoryOutlined />,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onToggleFavorite?.(item.id);
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onDelete?.(item.id);
      },
    },
  ];

  const formatTime = (time: string | Date) => {
    return dayjs(time).format(timeFormat);
  };

  return (
    <StyledContainer height={height} className={className} style={style}>
      <StyledHeader>
        <Text strong>聊天历史</Text>
        <Button type="primary" size="small" onClick={onNewChat}>
          新建聊天
        </Button>
      </StyledHeader>

      {items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无聊天记录"
          style={{ margin: '40px 0' }}
        />
      ) : (
        <StyledList
          dataSource={items}
          renderItem={(item: ChatHistoryItem) => (
            <List.Item
              className={activeId === item.id ? 'active' : ''}
              onClick={() => handleItemClick(item.id)}
            >
              <StyledListItem>
                <StyledItemHeader>
                  <StyledItemTitle ellipsis>{item.title}</StyledItemTitle>
                  <Dropdown
                    menu={{ items: getItemMenu(item) }}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </StyledItemHeader>

                {showTime && (
                  <StyledItemTime>
                    <ClockCircleOutlined style={{ marginRight: 4, fontSize: 12 }} />
                    {formatTime(item.updatedAt || item.createdAt)}
                  </StyledItemTime>
                )}
              </StyledListItem>
            </List.Item>
          )}
        />
      )}
    </StyledContainer>
  );
};

export default ChatHistory;
