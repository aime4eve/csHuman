/**
 * 知识分类管理页 - 主题标签树管理、知识图谱可视化
 * @author 伍志勇
 */
import React, { useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Tree,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Space,
  Typography,
  Tag,
  Tooltip,
  Popconfirm,
  Tabs,
  Statistic,
  App,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  NodeIndexOutlined,
  BookOutlined,
  TagOutlined,
  BranchesOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { TreeDataNode } from 'antd';
import { mockCategories, mockKnowledgeList } from '../../data/mockData';

const { Title, Text } = Typography;
// 移除 TabPane 解构，改用 items 属性
const { Search } = Input;

// 分类树节点接口
interface CategoryNode extends TreeDataNode {
  id: string;
  name: string;
  description?: string;
  knowledgeCount: number;
  level: number;
  parentId?: string;
  children?: CategoryNode[];
}

// 知识图谱节点接口
interface GraphNode {
  id: string;
  name: string;
  type: 'category' | 'knowledge';
  level: number;
  x?: number;
  y?: number;
}

// 知识图谱边接口
interface GraphEdge {
  source: string;
  target: string;
  type: 'parent' | 'related';
}

// 分类接口
interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  knowledgeCount: number;
  children?: Category[];
}

/**
 * 分类统计卡片组件
 */
const CategoryStatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Card className="text-center">
    <Statistic
      title={title}
      value={value}
      prefix={<span style={{ color }}>{icon}</span>}
      valueStyle={{ color }}
    />
  </Card>
);

/**
 * 知识分类管理页面组件
 */
const CategoryPage: React.FC = () => {
  const { message } = App.useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['1', '2', '3']);
  const [searchValue, setSearchValue] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
  const [activeTab, setActiveTab] = useState('tree');
  const [form] = Form.useForm();

  // 构建分类树数据
  const buildTreeData = useCallback((categories: any[]): CategoryNode[] => {
    const categoryMap = new Map();
    const rootCategories: CategoryNode[] = [];

    // 创建所有节点
    categories.forEach(cat => {
      const node: CategoryNode = {
        key: cat.key,
        id: cat.key,
        name: cat.title,
        title: (
          <div className="flex justify-between items-center group">
            <Space>
              <BookOutlined className="text-blue-500" />
              <span>{cat.title}</span>
              <Tag color="blue">{cat.count || 0}</Tag>
            </Space>
            <Space className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip title="编辑">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCategory(node);
                  }}
                />
              </Tooltip>
              <Tooltip title="删除">
                <Popconfirm
                  title="确定删除此分类吗？"
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleDeleteCategory(cat.key);
                  }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                  />
                </Popconfirm>
              </Tooltip>
            </Space>
          </div>
        ),
        description: '',
        knowledgeCount: cat.count || 0,
        level: 1,
        parentId: undefined,
        children: cat.children ? cat.children.map((child: any) => ({
          key: child.key,
          id: child.key,
          name: child.title,
          title: child.title,
          knowledgeCount: child.count || 0,
          level: 2,
          parentId: cat.key,
          children: []
        })) : []
      };
      categoryMap.set(cat.key, node);
    });

    return categories.map(cat => categoryMap.get(cat.key));
   }, []);

  const treeData = buildTreeData(mockCategories);

  // 处理树节点选择
  const handleSelect = (keys: React.Key[]) => {
    setSelectedKeys(keys);
  };

  // 处理树节点展开
  const handleExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys);
  };

  // 添加分类
  const handleAddCategory = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 编辑分类
  const handleEditCategory = (category: CategoryNode) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      parentId: category.parentId
    });
    setIsModalVisible(true);
  };

  // 删除分类
  const handleDeleteCategory = (categoryId: string) => {
    message.success('分类删除成功');
    // 这里应该调用API删除分类
  };

  // 保存分类
  const handleSaveCategory = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        message.success('分类更新成功');
      } else {
        message.success('分类创建成功');
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      console.error('表单验证失败:', error);
      
      // 显示具体的验证错误信息
      if (error.errorFields && error.errorFields.length > 0) {
        const firstError = error.errorFields[0];
        const fieldName = firstError.name[0];
        const errorMessage = firstError.errors[0];
        
        // 根据字段名显示友好的错误提示
        const fieldNameMap: { [key: string]: string } = {
          name: '分类名称',
          description: '分类描述',
          parentId: '父级分类'
        };
        
        const friendlyFieldName = fieldNameMap[fieldName] || fieldName;
        message.error(`${friendlyFieldName}: ${errorMessage}`);
      } else {
        message.error('表单验证失败，请检查输入内容');
      }
    }
  };

  // 搜索过滤
  const filterTreeData = (data: CategoryNode[], searchValue: string): CategoryNode[] => {
    if (!searchValue) return data;
    
    return data.reduce((filtered: CategoryNode[], node) => {
      const matchesSearch = node.name.toLowerCase().includes(searchValue.toLowerCase());
      const filteredChildren = node.children ? filterTreeData(node.children, searchValue) : [];
      
      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren
        });
      }
      
      return filtered;
    }, []);
  };

  const filteredTreeData = filterTreeData(treeData, searchValue);

  // 获取统计数据
  const getCategoryStats = () => {
    const totalCategories = mockCategories.length;
    const totalKnowledge = mockKnowledgeList.length;
    const maxLevel = 3; // 假设最大层级为3
    const avgKnowledgePerCategory = Math.round(totalKnowledge / totalCategories);

    return {
      totalCategories,
      totalKnowledge,
      maxLevel,
      avgKnowledgePerCategory
    };
  };

  const stats = getCategoryStats();

  // 简化的知识图谱组件
  const KnowledgeGraph: React.FC = () => {
    return (
      <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <NodeIndexOutlined className="text-4xl text-gray-400 mb-4" />
          <Title level={4} type="secondary">知识图谱可视化</Title>
          <Text type="secondary">展示分类间的关联关系和知识分布</Text>
          <br />
          <Button type="primary" className="mt-4" icon={<EyeOutlined />}>
            查看完整图谱
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2}>知识分类管理</Title>
        <Text type="secondary">管理知识分类体系，构建结构化的知识组织架构</Text>
      </div>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <CategoryStatCard
            title="分类总数"
            value={stats.totalCategories}
            icon={<BookOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <CategoryStatCard
            title="知识总数"
            value={stats.totalKnowledge}
            icon={<TagOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <CategoryStatCard
            title="最大层级"
            value={stats.maxLevel}
            icon={<BranchesOutlined />}
            color="#faad14"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <CategoryStatCard
            title="平均知识数"
            value={stats.avgKnowledgePerCategory}
            icon={<NodeIndexOutlined />}
            color="#722ed1"
          />
        </Col>
      </Row>

      {/* 主要内容 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="分类树管理"
            extra={
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCategory}>
                  添加分类
                </Button>
              </Space>
            }
          >
            {/* 搜索框 */}
            <div className="mb-4">
              <Search
                placeholder="搜索分类名称"
                allowClear
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                prefix={<SearchOutlined />}
              />
            </div>

            {/* 分类树 */}
            <div className="max-h-96 overflow-auto">
              <Tree
                showLine
                showIcon={false}
                selectedKeys={selectedKeys}
                expandedKeys={expandedKeys}
                treeData={filteredTreeData}
                onSelect={handleSelect}
                onExpand={handleExpand}
                className="category-tree"
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="可视化视图">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={[
                {
                  key: 'graph',
                  label: '知识图谱',
                  children: <KnowledgeGraph />
                },
                {
                  key: 'detail',
                  label: '分类详情',
                  children: selectedKeys.length > 0 ? (
                    <div>
                      <Title level={4}>分类详情</Title>
                      <Text type="secondary">选中分类的详细信息和关联知识</Text>
                      {/* 这里可以显示选中分类的详细信息 */}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOutlined className="text-4xl text-gray-400 mb-4" />
                      <Text type="secondary">请选择一个分类查看详情</Text>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* 分类编辑模态框 */}
      <Modal
        title={editingCategory ? '编辑分类' : '添加分类'}
        open={isModalVisible}
        onOk={handleSaveCategory}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            parentId: selectedKeys[0] || undefined
          }}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="分类描述"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请输入分类描述（可选）" 
            />
          </Form.Item>

          <Form.Item
            name="parentId"
            label="父级分类"
          >
            <Select
              placeholder="请选择父级分类（可选）"
              allowClear
            >
              {mockCategories.map(cat => (
                <Select.Option key={cat.key} value={cat.key}>
                  {cat.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>


    </div>
  );
};

export default CategoryPage;