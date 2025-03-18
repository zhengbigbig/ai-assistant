import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Dropdown, Input, List, Space, Typography, Tag, Empty } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  TagOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Text, Paragraph } = Typography;
const { Search } = Input;

export interface PromptCategory {
  /**
   * 分类ID
   */
  id: string;
  /**
   * 分类名称
   */
  name: string;
  /**
   * 分类颜色
   */
  color?: string;
}

export interface PromptItem {
  /**
   * 提示词ID
   */
  id: string;
  /**
   * 提示词标题
   */
  title: string;
  /**
   * 提示词内容
   */
  content: string;
  /**
   * 提示词分类ID
   */
  categoryId?: string;
  /**
   * 是否收藏
   */
  isFavorite?: boolean;
}

export interface PromptSelectorProps {
  /**
   * 提示词列表
   */
  prompts: PromptItem[];
  /**
   * 分类列表
   */
  categories?: PromptCategory[];
  /**
   * 当前选中的分类ID
   */
  activeCategoryId?: string;
  /**
   * 选择提示词回调
   */
  onSelect?: (prompt: PromptItem) => void;
  /**
   * 添加提示词回调
   */
  onAdd?: () => void;
  /**
   * 编辑提示词回调
   */
  onEdit?: (id: string) => void;
  /**
   * 删除提示词回调
   */
  onDelete?: (id: string) => void;
  /**
   * 收藏/取消收藏提示词回调
   */
  onToggleFavorite?: (id: string) => void;
  /**
   * 切换分类回调
   */
  onCategoryChange?: (categoryId: string) => void;
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

const StyledCategorySelector = styled.div`
  margin-bottom: 12px;
`;

const StyledSearch = styled(Search)`
  margin-bottom: 12px;
`;

const StyledList = styled(List)`
  flex: 1;
  overflow-y: auto;

  .ant-list-item {
    padding: 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: #f5f5f5;
    }
  }
`;

const StyledPromptItem = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const StyledPromptHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 4px;
`;

const StyledPromptTitle = styled(Text)`
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledPromptContent = styled(Paragraph)`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/**
 * PromptSelector组件 - 用于选择提示词
 *
 * @param props - 组件属性
 * @returns React组件
 *
 * @example
 * ```tsx
 * const prompts = [
 *   { id: '1', title: '代码解释', content: '请解释以下代码的功能和逻辑...' },
 *   { id: '2', title: '翻译', content: '请将以下内容翻译成中文...' },
 * ];
 *
 * const categories = [
 *   { id: 'all', name: '全部' },
 *   { id: 'code', name: '编程', color: 'blue' },
 *   { id: 'writing', name: '写作', color: 'green' },
 * ];
 *
 * <PromptSelector
 *   prompts={prompts}
 *   categories={categories}
 *   onSelect={(prompt) => console.log('选择提示词:', prompt)}
 * />
 * ```
 */
export const PromptSelector: React.FC<PromptSelectorProps> = ({
  prompts = [],
  categories = [],
  activeCategoryId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCategoryChange,
  className,
  style,
  height = 400,
}) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handlePromptClick = (prompt: PromptItem) => {
    onSelect?.(prompt);
  };

  const handlePromptAction = (action: 'edit' | 'delete' | 'favorite', id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    switch (action) {
      case 'edit':
        onEdit?.(id);
        break;
      case 'delete':
        onDelete?.(id);
        break;
      case 'favorite':
        onToggleFavorite?.(id);
        break;
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = searchText
      ? prompt.title.toLowerCase().includes(searchText.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchText.toLowerCase())
      : true;

    const matchesCategory = activeCategoryId && activeCategoryId !== 'all'
      ? prompt.categoryId === activeCategoryId
      : true;

    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return '';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '';
  };

  const categoryItems: MenuProps['items'] = [
    { key: 'all', label: '全部提示词' },
    ...categories.map(category => ({
      key: category.id,
      label: (
        <Space>
          {category.color && (
            <Tag color={category.color} style={{ marginRight: 0 }}>
              {category.name}
            </Tag>
          )}
          {!category.color && category.name}
        </Space>
      ),
    })),
  ];

  return (
    <StyledContainer height={height} className={className} style={style}>
      <StyledHeader>
        <Text strong>提示词库</Text>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={onAdd}
        >
          新建提示词
        </Button>
      </StyledHeader>

      {categories.length > 0 && (
        <StyledCategorySelector>
          <Dropdown
            menu={{
              items: categoryItems,
              onClick: ({ key }) => onCategoryChange?.(key),
              selectedKeys: activeCategoryId ? [activeCategoryId] : ['all'],
            }}
            trigger={['click']}
          >
            <Button block>
              <Space>
                <TagOutlined />
                {activeCategoryId && activeCategoryId !== 'all'
                  ? getCategoryName(activeCategoryId)
                  : '全部提示词'}
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </StyledCategorySelector>
      )}

      <StyledSearch
        placeholder="搜索提示词"
        allowClear
        onSearch={handleSearch}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {filteredPrompts.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无提示词"
          style={{ margin: '40px 0' }}
        />
      ) : (
        <StyledList
          dataSource={filteredPrompts}
          renderItem={(prompt) => (
            <List.Item onClick={() => handlePromptClick(prompt)}>
              <StyledPromptItem>
                <StyledPromptHeader>
                  <StyledPromptTitle>{prompt.title}</StyledPromptTitle>
                  <Space>
                    {prompt.categoryId && (
                      <Tag color={getCategoryColor(prompt.categoryId)}>
                        {getCategoryName(prompt.categoryId)}
                      </Tag>
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={(e) => handlePromptAction('edit', prompt.id, e)}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => handlePromptAction('delete', prompt.id, e)}
                    />
                  </Space>
                </StyledPromptHeader>
                <StyledPromptContent ellipsis={{ rows: 2 }}>
                  {prompt.content}
                </StyledPromptContent>
              </StyledPromptItem>
            </List.Item>
          )}
        />
      )}
    </StyledContainer>
  );
};

export default PromptSelector;
