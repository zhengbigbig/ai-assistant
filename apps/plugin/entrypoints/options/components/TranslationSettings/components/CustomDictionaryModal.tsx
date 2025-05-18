import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Modal, Table, Typography } from 'antd';
import React, { useState } from 'react';

const { Paragraph } = Typography;

interface CustomDictionaryItem {
  key: string;
  value: string;
}

interface CustomDictionaryModalProps {
  open: boolean;
  onCancel: () => void;
  onAdd: (keyword: string, value: string) => void;
  onDelete: (keyword: string) => void;
  dictionaryData: Record<string, string>;
}

/**
 * 自定义词典管理弹窗
 */
const CustomDictionaryModal: React.FC<CustomDictionaryModalProps> = ({
  open,
  onCancel,
  onAdd,
  onDelete,
  dictionaryData,
}) => {
  const [keyword, setKeyword] = useState('');
  const [value, setValue] = useState('');

  // 清空输入框
  const clearInputs = () => {
    setKeyword('');
    setValue('');
  };

  // 添加词典条目
  const handleAdd = () => {
    onAdd(keyword.trim(), value.trim());
    clearInputs();
  };

  // 自定义词典表格列定义
  const columns = [
    {
      title: '原文',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: '替换为',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CustomDictionaryItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(record.key)}
        />
      ),
    },
  ];

  // 将对象格式转换为表格数据格式
  const tableData: CustomDictionaryItem[] = Object.entries(dictionaryData || {}).map(
    ([key, value]) => ({
      key,
      value: value as string,
    })
  );

  return (
    <Modal
      title="自定义词典管理"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <div style={{ marginBottom: 16 }}>
        <Paragraph>
          添加自定义词汇替换规则，翻译时会优先使用您定义的词汇。这对于保留专有名词、术语或自定义翻译特别有用。
        </Paragraph>

        <Flex style={{ marginTop: 16, marginBottom: 16 }} gap={8}>
          <Input
            placeholder="输入原文关键词"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ flex: 1 }}
          />
          <Input
            placeholder="输入替换的内容"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加
          </Button>
        </Flex>

        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="key"
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无自定义词汇' }}
        />
      </div>

      <div
        style={{
          marginTop: 24,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          type="primary"
          onClick={onCancel}
        >
          关闭
        </Button>
      </div>
    </Modal>
  );
};

export default CustomDictionaryModal;
