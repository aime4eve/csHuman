/**
 * 知识图谱查询页面
 * @author 伍志勇
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Card,
  Typography,
  Row,
  Col,
  Button,
  Space,
  Input,
  Select,
  Tree,
  Table,
  Tag,
  Drawer,
  Modal,
  Form,
  Tabs,
  List,
  Avatar,
  Badge,
  Tooltip,
  Popover,
  Slider,
  Switch,
  Radio,
  Divider,
  Alert,
  Statistic,
  Timeline,
  Descriptions,
  Empty,
  Spin,
  App,
  Breadcrumb,
  Steps,
  Progress,
  Collapse
} from 'antd';
import {
  ShareAltOutlined,
  SearchOutlined,
  NodeIndexOutlined,
  BranchesOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  LinkOutlined,
  ClusterOutlined,
  ApartmentOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  TagsOutlined,
  UserOutlined,
  TeamOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  StarOutlined,
  HeartOutlined,
  LikeOutlined,
  DislikeOutlined,
  CommentOutlined,
  BookOutlined,
  BulbOutlined,
  RocketOutlined,
  CrownOutlined,
  FireOutlined,
  TrophyOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  PieChartOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { ColumnsType } from 'antd/es/table';
import GraphVisualization from '../../components/GraphVisualization';
import { GraphNode, GraphRelation, GraphData, PathResult, NODE_TYPE_COLORS, NODE_TYPE_NAMES } from '../../types/graph';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

// 模拟图谱数据
const mockGraphData: GraphData = {
  nodes: [
    {
      id: 'node_1',
      name: '企业级知识库',
      type: 'system',
      properties: { category: '系统', version: 'v2.0', status: 'active' },
      description: '企业内部知识管理系统，提供知识存储、检索和管理功能',
      size: 60,
      color: '#1677FF'
    },
    {
      id: 'node_2',
      name: '权限管理',
      type: 'concept',
      properties: { category: '模块', importance: 'high' },
      description: '系统权限控制模块，管理用户访问权限',
      size: 45,
      color: '#52C41A'
    },
    {
      id: 'node_3',
      name: '用户角色',
      type: 'concept',
      properties: { category: '概念', level: 'core' },
      description: '系统中的用户角色定义和分类',
      size: 40,
      color: '#FA8C16'
    },
    {
      id: 'node_4',
      name: '知识分类',
      type: 'concept',
      properties: { category: '概念', taxonomy: 'hierarchical' },
      description: '知识内容的分类体系和组织结构',
      size: 35,
      color: '#722ED1'
    },
    {
      id: 'node_5',
      name: '审核流程',
      type: 'process',
      properties: { category: '流程', steps: 5 },
      description: '知识内容的审核处理流程',
      size: 30,
      color: '#EB2F96'
    }
  ],
  relations: [
    {
      id: 'rel_1',
      source: 'node_1',
      target: 'node_2',
      type: 'contains',
      properties: { strength: 'strong' },
      weight: 0.9,
      label: '包含'
    },
    {
      id: 'rel_2',
      source: 'node_2',
      target: 'node_3',
      type: 'manages',
      properties: { strength: 'medium' },
      weight: 0.8,
      label: '管理'
    },
    {
      id: 'rel_3',
      source: 'node_1',
      target: 'node_4',
      type: 'organizes',
      properties: { strength: 'strong' },
      weight: 0.85,
      label: '组织'
    },
    {
      id: 'rel_4',
      source: 'node_4',
      target: 'node_5',
      type: 'requires',
      properties: { strength: 'medium' },
      weight: 0.7,
      label: '需要'
    }
  ]
};

// 模拟路径查询结果
const mockPathResults: PathResult[] = [
  {
    id: 'path_1',
    path: ['企业级知识库', '权限管理', '用户角色'],
    relations: ['包含', '管理'],
    distance: 2,
    confidence: 0.95
  },
  {
    id: 'path_2',
    path: ['企业级知识库', '知识分类', '审核流程'],
    relations: ['组织', '需要'],
    distance: 2,
    confidence: 0.88
  }
];

/**
 * 知识图谱查询页面组件
 */
const KnowledgeGraphPage: React.FC = () => {
  const { message } = App.useApp();
  const [graphData, setGraphData] = useState<GraphData>(mockGraphData);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pathQuery, setPathQuery] = useState<{ source: string; target: string }>({ source: '', target: '' });
  const [pathResults, setPathResults] = useState<PathResult[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showNodeDetails, setShowNodeDetails] = useState<boolean>(false);
  const [layoutType, setLayoutType] = useState<string>('force');
  const [nodeSize, setNodeSize] = useState<number>(40);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const canvasRef = useRef<HTMLDivElement>(null);

  // 节点类型颜色映射
  const nodeTypeColors = NODE_TYPE_COLORS;

  // 搜索节点
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value) {
      const foundNode = graphData.nodes.find(node => 
        node.name.toLowerCase().includes(value.toLowerCase())
      );
      if (foundNode) {
        setSelectedNode(foundNode);
        setShowNodeDetails(true);
        message.success(`找到节点: ${foundNode.name}`);
      } else {
        message.warning('未找到匹配的节点');
      }
    }
  };

  // 路径查询
  const handlePathQuery = () => {
    if (pathQuery.source && pathQuery.target) {
      setPathResults(mockPathResults);
      message.success(`找到 ${mockPathResults.length} 条路径`);
    } else {
      message.warning('请选择起始节点和目标节点');
    }
  };

  // 节点点击处理
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setShowNodeDetails(true);
  };

  // 重置图谱
  const handleReset = () => {
    setGraphData(mockGraphData);
    setSelectedNode(null);
    setSearchQuery('');
    setPathQuery({ source: '', target: '' });
    setPathResults([]);
    message.success('图谱已重置');
  };

  // 过滤节点
  const filteredNodes = graphData.nodes.filter(node => {
    if (filterType === 'all') return true;
    return node.type === filterType;
  });

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 页面标题和工具栏 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Title level={2} style={{ margin: 0 }}>
                      <NodeIndexOutlined style={{ marginRight: 8, color: '#1677FF' }} />
                      知识图谱查询
                    </Title>
                    <Text type="secondary">交互式图谱展示、关系探索、路径查询</Text>
                  </Col>
                  <Col>
                    <Space>
                      <Button 
                        icon={<SettingOutlined />} 
                        onClick={() => setShowSettings(true)}
                      >
                        设置
                      </Button>
                      <Button 
                        icon={<ReloadOutlined />} 
                        onClick={handleReset}
                      >
                        重置
                      </Button>
                      <Button 
                        type="primary" 
                        icon={<FullscreenOutlined />}
                      >
                        全屏
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* 左侧控制面板 */}
            <Col xs={24} lg={6}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* 搜索面板 */}
                <Card title="节点搜索" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Search
                      placeholder="搜索节点名称"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onSearch={handleSearch}
                      enterButton
                    />
                    <Select
                      placeholder="筛选节点类型"
                      value={filterType}
                      onChange={setFilterType}
                      style={{ width: '100%' }}
                    >
                      <Option value="all">全部类型</Option>
                      <Option value="system">系统</Option>
                      <Option value="concept">概念</Option>
                      <Option value="process">流程</Option>
                      <Option value="person">人员</Option>
                      <Option value="organization">组织</Option>
                      <Option value="document">文档</Option>
                    </Select>
                  </Space>
                </Card>

                {/* 路径查询面板 */}
                <Card title="路径查询" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Select
                      placeholder="选择起始节点"
                      value={pathQuery.source}
                      onChange={(value) => setPathQuery(prev => ({ ...prev, source: value }))}
                      style={{ width: '100%' }}
                    >
                      {graphData.nodes.map(node => (
                        <Option key={node.id} value={node.name}>{node.name}</Option>
                      ))}
                    </Select>
                    <Select
                      placeholder="选择目标节点"
                      value={pathQuery.target}
                      onChange={(value) => setPathQuery(prev => ({ ...prev, target: value }))}
                      style={{ width: '100%' }}
                    >
                      {graphData.nodes.map(node => (
                        <Option key={node.id} value={node.name}>{node.name}</Option>
                      ))}
                    </Select>
                    <Button 
                      type="primary" 
                      icon={<BranchesOutlined />}
                      onClick={handlePathQuery}
                      style={{ width: '100%' }}
                    >
                      查询路径
                    </Button>
                  </Space>
                </Card>

                {/* 路径结果 */}
                {pathResults.length > 0 && (
                  <Card title="路径结果" size="small">
                    <List
                      size="small"
                      dataSource={pathResults}
                      renderItem={(path) => (
                        <List.Item>
                          <div style={{ width: '100%' }}>
                            <div style={{ marginBottom: 4 }}>
                              <Badge count={path.distance} color="blue" />
                              <Text strong>距离: {path.distance}</Text>
                            </div>
                            <div style={{ marginBottom: 4 }}>
                              {path.path.map((node, index) => (
                                <span key={index}>
                                  <Tag color="blue">{node}</Tag>
                                  {index < path.path.length - 1 && (
                                    <Text type="secondary"> → </Text>
                                  )}
                                </span>
                              ))}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              置信度: {(path.confidence * 100).toFixed(1)}%
                            </Text>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                )}

                {/* 图谱统计 */}
                <Card title="图谱统计" size="small">
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1677FF' }}>
                          {filteredNodes.length}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>节点数</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52C41A' }}>
                          {graphData.relations.length}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>关系数</div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Space>
            </Col>

            {/* 右侧图谱画布 */}
            <Col xs={24} lg={18}>
              <Card 
                title="图谱可视化" 
                extra={
                  <Space>
                    <Tooltip title="放大">
                      <Button size="small" icon={<ZoomInOutlined />} />
                    </Tooltip>
                    <Tooltip title="缩小">
                      <Button size="small" icon={<ZoomOutOutlined />} />
                    </Tooltip>
                    <Tooltip title="分享">
                      <Button size="small" icon={<ShareAltOutlined />} />
                    </Tooltip>
                  </Space>
                }
              >
                <div 
                  ref={canvasRef}
                  style={{ 
                    height: 600, 
                    background: '#fafafa',
                    border: '1px solid #d9d9d9',
                    borderRadius: 6,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* SVG图谱可视化组件 */}
                  <GraphVisualization
                    data={{
                      nodes: filteredNodes,
                      relations: graphData.relations.filter(rel => 
                        filteredNodes.some(n => n.id === rel.source) && 
                        filteredNodes.some(n => n.id === rel.target)
                      )
                    }}
                    width={canvasRef.current?.clientWidth || 800}
                    height={600}
                    nodeSize={nodeSize}
                    showLabels={showLabels}
                    layoutType={layoutType as any}
                    onNodeClick={handleNodeClick}
                    onNodeHover={(node) => {
                      // 可以在这里添加悬停效果
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>

      {/* 设置面板 */}
      <Drawer
        title="图谱设置"
        placement="right"
        onClose={() => setShowSettings(false)}
        open={showSettings}
        width={320}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>布局算法</Text>
            <Select
              value={layoutType}
              onChange={setLayoutType}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Option value="force">力导向布局</Option>
              <Option value="circular">环形布局</Option>
              <Option value="grid">网格布局</Option>
              <Option value="hierarchical">层次布局</Option>
            </Select>
          </div>
          
          <div>
            <Text strong>节点大小: {nodeSize}</Text>
            <Slider
              min={20}
              max={80}
              value={nodeSize}
              onChange={setNodeSize}
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <Row justify="space-between" align="middle">
              <Text strong>显示标签</Text>
              <Switch checked={showLabels} onChange={setShowLabels} />
            </Row>
          </div>
          
          <Divider />
          
          <div>
              <Text strong>节点类型说明</Text>
              <div style={{ marginTop: 8 }}>
                {Object.entries(nodeTypeColors).map(([type, color]) => (
                  <div key={type} style={{ marginBottom: 4 }}>
                    <Tag color={color} style={{ minWidth: 60 }}>
                      {NODE_TYPE_NAMES[type as keyof typeof NODE_TYPE_NAMES]}
                    </Tag>
                  </div>
                ))}
              </div>
            </div>
        </Space>
      </Drawer>

      {/* 节点详情面板 */}
      <Drawer
        title="节点详情"
        placement="right"
        onClose={() => setShowNodeDetails(false)}
        open={showNodeDetails}
        width={400}
      >
        {selectedNode && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ textAlign: 'center' }}>
              <div 
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: nodeTypeColors[selectedNode.type],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 'bold'
                }}
              >
                {selectedNode.name.charAt(0)}
              </div>
              <Title level={4}>{selectedNode.name}</Title>
              <Tag color={nodeTypeColors[selectedNode.type]}>
                {NODE_TYPE_NAMES[selectedNode.type]}
              </Tag>
            </div>
            
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="节点ID">{selectedNode.id}</Descriptions.Item>
              <Descriptions.Item label="节点类型">{selectedNode.type}</Descriptions.Item>
              <Descriptions.Item label="描述">
                {selectedNode.description || '暂无描述'}
              </Descriptions.Item>
            </Descriptions>
            
            <div>
              <Text strong>属性信息</Text>
              <div style={{ marginTop: 8 }}>
                {Object.entries(selectedNode.properties).map(([key, value]) => (
                  <Row key={key} justify="space-between" style={{ marginBottom: 4 }}>
                    <Text type="secondary">{key}:</Text>
                    <Text>{String(value)}</Text>
                  </Row>
                ))}
              </div>
            </div>
            
            <div>
              <Text strong>相关关系</Text>
              <List
                size="small"
                style={{ marginTop: 8 }}
                dataSource={graphData.relations.filter(rel => 
                  rel.source === selectedNode.id || rel.target === selectedNode.id
                )}
                renderItem={(relation) => {
                  const isSource = relation.source === selectedNode.id;
                  const relatedNodeId = isSource ? relation.target : relation.source;
                  const relatedNode = graphData.nodes.find(n => n.id === relatedNodeId);
                  
                  return (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div>
                          <Text strong>{relation.label || relation.type}</Text>
                          <Text type="secondary" style={{ float: 'right' }}>
                            权重: {relation.weight}
                          </Text>
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary">
                            {isSource ? '→' : '←'} {relatedNode?.name}
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div>
          </Space>
        )}
      </Drawer>
    </Layout>
  );
};

export default KnowledgeGraphPage;