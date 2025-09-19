/**
 * 对话管理后台页面
 * @author 伍志勇
 */
import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Typography,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Statistic,
  Row,
  Col,
  Select,
  Input,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  Switch,
  Slider,
  Alert,
  Badge,
  List,
  Avatar,
  Tooltip,
  Popconfirm,
  App,
  Drawer,
  Descriptions,
  Timeline,
  Rate
} from 'antd';
import {
  MessageOutlined,
  SettingOutlined,
  BarChartOutlined,
  UserOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ExportOutlined,
  FilterOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
// const { TabPane } = Tabs; // 已废弃，使用 items 属性替代
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 对话会话类型定义
interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  messageCount: number;
  status: 'active' | 'completed' | 'error';
  model: string;
  satisfaction?: number;
  duration: number;
  tokens: number;
}

// 模型配置类型定义
interface ModelConfig {
  id: string;
  name: string;
  type: 'gpt' | 'claude' | 'custom';
  version: string;
  status: 'active' | 'inactive' | 'testing';
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  description: string;
  usage: number;
  successRate: number;
}

// 质量评估类型定义
interface QualityMetrics {
  id: string;
  sessionId: string;
  accuracy: number;
  relevance: number;
  helpfulness: number;
  coherence: number;
  safety: number;
  overallScore: number;
  feedback: string;
  evaluatedAt: string;
  evaluator: string;
}

// 数据分析类型定义
interface AnalyticsData {
  totalSessions: number;
  activeSessions: number;
  totalMessages: number;
  avgSessionDuration: number;
  avgSatisfaction: number;
  topModels: Array<{ name: string; usage: number }>;
  hourlyStats: Array<{ hour: number; sessions: number; messages: number }>;
  dailyStats: Array<{ date: string; sessions: number; satisfaction: number }>;
}

// 模拟对话会话数据
const mockChatSessions: ChatSession[] = [
  {
    id: 'session_1',
    userId: 'user_001',
    userName: '张三',
    startTime: '2024-01-20 09:15:30',
    endTime: '2024-01-20 09:45:22',
    messageCount: 15,
    status: 'completed',
    model: 'GPT-4',
    satisfaction: 4.5,
    duration: 1792,
    tokens: 2340
  },
  {
    id: 'session_2',
    userId: 'user_002',
    userName: '李四',
    startTime: '2024-01-20 10:22:15',
    messageCount: 8,
    status: 'active',
    model: 'Claude-3',
    duration: 1205,
    tokens: 1560
  },
  {
    id: 'session_3',
    userId: 'user_003',
    userName: '王五',
    startTime: '2024-01-20 11:08:45',
    endTime: '2024-01-20 11:12:30',
    messageCount: 3,
    status: 'error',
    model: 'GPT-3.5',
    satisfaction: 2.0,
    duration: 225,
    tokens: 180
  }
];

// 模拟模型配置数据
const mockModelConfigs: ModelConfig[] = [
  {
    id: 'model_1',
    name: 'GPT-4 智能助手',
    type: 'gpt',
    version: '4.0',
    status: 'active',
    temperature: 0.7,
    maxTokens: 4000,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    systemPrompt: '你是一个专业的AI助手，请提供准确、有用的回答。',
    description: '基于GPT-4的高性能对话模型，适用于复杂问答和创作任务',
    usage: 1250,
    successRate: 94.5
  },
  {
    id: 'model_2',
    name: 'Claude-3 分析师',
    type: 'claude',
    version: '3.0',
    status: 'active',
    temperature: 0.5,
    maxTokens: 3000,
    topP: 0.8,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    systemPrompt: '你是一个专业的数据分析师，擅长逻辑推理和数据解读。',
    description: '专注于分析和推理的Claude模型，适用于数据分析和逻辑推理',
    usage: 890,
    successRate: 96.2
  },
  {
    id: 'model_3',
    name: '自定义知识模型',
    type: 'custom',
    version: '1.2',
    status: 'testing',
    temperature: 0.6,
    maxTokens: 2000,
    topP: 0.85,
    frequencyPenalty: 0.05,
    presencePenalty: 0.05,
    systemPrompt: '基于企业知识库的专业助手，提供准确的企业内部信息。',
    description: '基于企业知识库训练的自定义模型，专门处理企业内部问题',
    usage: 320,
    successRate: 88.7
  }
];

// 模拟质量评估数据
const mockQualityMetrics: QualityMetrics[] = [
  {
    id: 'quality_1',
    sessionId: 'session_1',
    accuracy: 92,
    relevance: 95,
    helpfulness: 88,
    coherence: 90,
    safety: 98,
    overallScore: 92.6,
    feedback: '回答准确且有帮助，但可以更加简洁',
    evaluatedAt: '2024-01-20 10:00:00',
    evaluator: '系统自动评估'
  },
  {
    id: 'quality_2',
    sessionId: 'session_2',
    accuracy: 88,
    relevance: 92,
    helpfulness: 85,
    coherence: 87,
    safety: 95,
    overallScore: 89.4,
    feedback: '回答相关性好，但准确性有待提高',
    evaluatedAt: '2024-01-20 11:30:00',
    evaluator: '人工评估'
  }
];

// 模拟分析数据
const mockAnalyticsData: AnalyticsData = {
  totalSessions: 1247,
  activeSessions: 23,
  totalMessages: 18650,
  avgSessionDuration: 1580,
  avgSatisfaction: 4.2,
  topModels: [
    { name: 'GPT-4', usage: 45 },
    { name: 'Claude-3', usage: 32 },
    { name: '自定义模型', usage: 23 }
  ],
  hourlyStats: [
    { hour: 9, sessions: 45, messages: 680 },
    { hour: 10, sessions: 62, messages: 920 },
    { hour: 11, sessions: 58, messages: 850 },
    { hour: 14, sessions: 71, messages: 1050 },
    { hour: 15, sessions: 55, messages: 820 }
  ],
  dailyStats: [
    { date: '2024-01-15', sessions: 234, satisfaction: 4.1 },
    { date: '2024-01-16', sessions: 267, satisfaction: 4.3 },
    { date: '2024-01-17', sessions: 198, satisfaction: 4.0 },
    { date: '2024-01-18', sessions: 289, satisfaction: 4.4 },
    { date: '2024-01-19', sessions: 259, satisfaction: 4.2 }
  ]
};

/**
 * 对话管理后台页面组件
 */
const ChatManagementPage: React.FC = () => {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<string>('sessions');
  const [sessions, setSessions] = useState<ChatSession[]>(mockChatSessions);
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>(mockModelConfigs);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics[]>(mockQualityMetrics);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(mockAnalyticsData);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showSessionDetail, setShowSessionDetail] = useState<boolean>(false);
  const [showModelConfig, setShowModelConfig] = useState<boolean>(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [form] = Form.useForm();

  // 会话状态颜色映射
  const sessionStatusColors = {
    active: 'processing',
    completed: 'success',
    error: 'error'
  };

  // 模型状态颜色映射
  const modelStatusColors = {
    active: 'success',
    inactive: 'default',
    testing: 'warning'
  };

  // 会话表格列定义
  const sessionColumns: ColumnsType<ChatSession> = [
    {
      title: '会话ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
      render: (text, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.userId}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      render: (text) => <Tag icon={<RobotOutlined />} color="blue">{text}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={sessionStatusColors[status]} 
          text={
            status === 'active' ? '进行中' :
            status === 'completed' ? '已完成' : '异常'
          } 
        />
      )
    },
    {
      title: '消息数',
      dataIndex: 'messageCount',
      key: 'messageCount',
      sorter: (a, b) => a.messageCount - b.messageCount
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    },
    {
      title: '满意度',
      dataIndex: 'satisfaction',
      key: 'satisfaction',
      render: (satisfaction) => satisfaction ? (
        <Rate disabled defaultValue={satisfaction} style={{ fontSize: 14 }} />
      ) : <Text type="secondary">-</Text>
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewSession(record)}
            />
          </Tooltip>
          {record.status === 'active' && (
            <Tooltip title="终止会话">
              <Popconfirm
                title="确定要终止这个会话吗？"
                onConfirm={() => handleTerminateSession(record.id)}
              >
                <Button size="small" icon={<CloseCircleOutlined />} danger />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // 模型配置表格列定义
  const modelColumns: ColumnsType<ModelConfig> = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar 
            size="small" 
            style={{ 
              backgroundColor: record.type === 'gpt' ? '#1677FF' : 
                              record.type === 'claude' ? '#52C41A' : '#FA8C16' 
            }}
          >
            {text.charAt(0)}
          </Avatar>
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.version}</Text>
          </div>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={
          type === 'gpt' ? 'blue' :
          type === 'claude' ? 'green' : 'orange'
        }>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={modelStatusColors[status]} 
          text={
            status === 'active' ? '运行中' :
            status === 'inactive' ? '已停用' : '测试中'
          } 
        />
      )
    },
    {
      title: '使用次数',
      dataIndex: 'usage',
      key: 'usage',
      sorter: (a, b) => a.usage - b.usage,
      render: (usage) => <Text strong>{usage.toLocaleString()}</Text>
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate) => (
        <div>
          <Progress 
            percent={rate} 
            size="small" 
            status={rate >= 90 ? 'success' : rate >= 80 ? 'normal' : 'exception'}
          />
          <Text style={{ fontSize: 12 }}>{rate}%</Text>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑配置">
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEditModel(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? '停用' : '启用'}>
            <Button 
              size="small" 
              icon={record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleModel(record.id)}
            />
          </Tooltip>
          <Tooltip title="删除模型">
            <Popconfirm
              title="确定要删除这个模型配置吗？"
              onConfirm={() => handleDeleteModel(record.id)}
            >
              <Button size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // 查看会话详情
  const handleViewSession = (session: ChatSession) => {
    setSelectedSession(session);
    setShowSessionDetail(true);
  };

  // 终止会话
  const handleTerminateSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, status: 'completed' as const, endTime: new Date().toLocaleString() }
        : session
    ));
    message.success('会话已终止');
  };

  // 编辑模型配置
  const handleEditModel = (model: ModelConfig) => {
    setEditingModel(model);
    form.setFieldsValue(model);
    setShowModelConfig(true);
  };

  // 切换模型状态
  const handleToggleModel = (modelId: string) => {
    setModelConfigs(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, status: model.status === 'active' ? 'inactive' as const : 'active' as const }
        : model
    ));
    message.success('模型状态已更新');
  };

  // 删除模型
  const handleDeleteModel = (modelId: string) => {
    setModelConfigs(prev => prev.filter(model => model.id !== modelId));
    message.success('模型配置已删除');
  };

  // 保存模型配置
  const handleSaveModel = async (values: any) => {
    try {
      if (editingModel) {
        setModelConfigs(prev => prev.map(model => 
          model.id === editingModel.id ? { ...model, ...values } : model
        ));
        message.success('模型配置已更新');
      } else {
        const newModel: ModelConfig = {
          id: `model_${Date.now()}`,
          ...values,
          usage: 0,
          successRate: 0
        };
        setModelConfigs(prev => [...prev, newModel]);
        message.success('模型配置已创建');
      }
      setShowModelConfig(false);
      setEditingModel(null);
      form.resetFields();
    } catch (error) {
      message.error('保存失败');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto' }}>
          {/* 页面标题 */}
          <Row style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Title level={2} style={{ margin: 0 }}>
                      <MessageOutlined style={{ marginRight: 8, color: '#1677FF' }} />
                      对话管理后台
                    </Title>
                    <Text type="secondary">模型配置、对话监控、质量评估、数据分析</Text>
                  </Col>
                  <Col>
                    <Space>
                      <Button icon={<ExportOutlined />}>导出数据</Button>
                      <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>刷新</Button>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* 数据概览 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总会话数"
                  value={analyticsData.totalSessions}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#1677FF' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="活跃会话"
                  value={analyticsData.activeSessions}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: '#52C41A' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="平均满意度"
                  value={analyticsData.avgSatisfaction}
                  precision={1}
                  suffix="/ 5.0"
                  valueStyle={{ color: '#FA8C16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="总消息数"
                  value={analyticsData.totalMessages}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#722ED1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 主要内容区域 */}
          <Card>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={[
                {
                  key: 'sessions',
                  label: '会话监控',
                  children: (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <Row gutter={[16, 16]} justify="space-between">
                          <Col>
                            <Space>
                              <Input.Search
                                placeholder="搜索用户名或会话ID"
                                style={{ width: 250 }}
                                onSearch={(value) => console.log('搜索:', value)}
                              />
                              <Select placeholder="状态筛选" style={{ width: 120 }}>
                                <Option value="all">全部状态</Option>
                                <Option value="active">进行中</Option>
                                <Option value="completed">已完成</Option>
                                <Option value="error">异常</Option>
                              </Select>
                              <RangePicker placeholder={['开始时间', '结束时间']} />
                            </Space>
                          </Col>
                          <Col>
                            <Button type="primary" icon={<FilterOutlined />}>
                              高级筛选
                            </Button>
                          </Col>
                        </Row>
                      </div>
                      <Table
                        columns={sessionColumns}
                        dataSource={sessions}
                        rowKey="id"
                        pagination={{
                          total: sessions.length,
                          pageSize: 10,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (total) => `共 ${total} 条记录`
                        }}
                        scroll={{ x: 1200 }}
                      />
                    </>
                  )
                },
                {
                  key: 'models',
                  label: '模型配置',
                  children: (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <Row justify="space-between">
                          <Col>
                            <Space>
                              <Input.Search
                                placeholder="搜索模型名称"
                                style={{ width: 250 }}
                              />
                              <Select placeholder="模型类型" style={{ width: 120 }}>
                                <Option value="all">全部类型</Option>
                                <Option value="gpt">GPT</Option>
                                <Option value="claude">Claude</Option>
                                <Option value="custom">自定义</Option>
                              </Select>
                            </Space>
                          </Col>
                          <Col>
                            <Button 
                              type="primary" 
                              icon={<SettingOutlined />}
                              onClick={() => {
                                setEditingModel(null);
                                form.resetFields();
                                setShowModelConfig(true);
                              }}
                            >
                              新建模型
                            </Button>
                          </Col>
                        </Row>
                      </div>
                      <Table
                        columns={modelColumns}
                        dataSource={modelConfigs}
                        rowKey="id"
                        pagination={{
                          total: modelConfigs.length,
                          pageSize: 10,
                          showTotal: (total) => `共 ${total} 条记录`
                        }}
                      />
                    </>
                  )
                },
                {
                  key: 'quality',
                  label: '质量评估',
                  children: (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={12}>
                        <Card title="评估指标概览" size="small">
                          <List
                            size="small"
                            dataSource={qualityMetrics}
                            renderItem={(item) => (
                              <List.Item>
                                <div style={{ width: '100%' }}>
                                  <Row justify="space-between" align="middle">
                                    <Col>
                                      <Text strong>会话 {item.sessionId}</Text>
                                      <br />
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        {item.evaluatedAt} | {item.evaluator}
                                      </Text>
                                    </Col>
                                    <Col>
                                      <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1677FF' }}>
                                          {item.overallScore}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#666' }}>综合评分</div>
                                      </div>
                                    </Col>
                                  </Row>
                                  <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                                    <Col span={8}>
                                      <div style={{ textAlign: 'center' }}>
                                        <Progress 
                                          type="circle" 
                                          percent={item.accuracy} 
                                          size={40}
                                          format={() => item.accuracy}
                                        />
                                        <div style={{ fontSize: 10, marginTop: 4 }}>准确性</div>
                                      </div>
                                    </Col>
                                    <Col span={8}>
                                      <div style={{ textAlign: 'center' }}>
                                        <Progress 
                                          type="circle" 
                                          percent={item.relevance} 
                                          size={40}
                                          format={() => item.relevance}
                                        />
                                        <div style={{ fontSize: 10, marginTop: 4 }}>相关性</div>
                                      </div>
                                    </Col>
                                    <Col span={8}>
                                      <div style={{ textAlign: 'center' }}>
                                        <Progress 
                                          type="circle" 
                                          percent={item.safety} 
                                          size={40}
                                          format={() => item.safety}
                                        />
                                        <div style={{ fontSize: 10, marginTop: 4 }}>安全性</div>
                                      </div>
                                    </Col>
                                  </Row>
                                  {item.feedback && (
                                    <Alert 
                                      message={item.feedback} 
                                      type="info" 
                                      style={{ marginTop: 8 }}
                                    />
                                  )}
                                </div>
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} lg={12}>
                        <Card title="质量趋势" size="small">
                          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Text type="secondary">质量趋势图表区域</Text>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'analytics',
                  label: '数据分析',
                  children: (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={12}>
                        <Card title="模型使用分布" size="small">
                          <List
                            size="small"
                            dataSource={analyticsData.topModels}
                            renderItem={(item) => (
                              <List.Item>
                                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                                  <Col>
                                    <Text strong>{item.name}</Text>
                                  </Col>
                                  <Col>
                                    <div style={{ width: 100 }}>
                                      <Progress percent={item.usage} size="small" />
                                    </div>
                                  </Col>
                                  <Col>
                                    <Text>{item.usage}%</Text>
                                  </Col>
                                </Row>
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} lg={12}>
                        <Card title="时段分析" size="small">
                          <List
                            size="small"
                            dataSource={analyticsData.hourlyStats}
                            renderItem={(item) => (
                              <List.Item>
                                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                                  <Col span={6}>
                                    <Text strong>{item.hour}:00</Text>
                                  </Col>
                                  <Col span={9}>
                                    <Text>会话: {item.sessions}</Text>
                                  </Col>
                                  <Col span={9}>
                                    <Text>消息: {item.messages}</Text>
                                  </Col>
                                </Row>
                              </List.Item>
                            )}
                          />
                        </Card>
                      </Col>
                    </Row>
                  )
                }
              ]}
            />
          </Card>
        </div>
      </Content>

      {/* 会话详情抽屉 */}
      <Drawer
        title="会话详情"
        placement="right"
        onClose={() => setShowSessionDetail(false)}
        open={showSessionDetail}
        width={500}
      >
        {selectedSession && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="会话ID">{selectedSession.id}</Descriptions.Item>
              <Descriptions.Item label="用户">{selectedSession.userName}</Descriptions.Item>
              <Descriptions.Item label="模型">{selectedSession.model}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge 
                  status={sessionStatusColors[selectedSession.status] as any} 
                  text={
                    selectedSession.status === 'active' ? '进行中' :
                    selectedSession.status === 'completed' ? '已完成' : '异常'
                  } 
                />
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">{selectedSession.startTime}</Descriptions.Item>
              {selectedSession.endTime && (
                <Descriptions.Item label="结束时间">{selectedSession.endTime}</Descriptions.Item>
              )}
              <Descriptions.Item label="消息数量">{selectedSession.messageCount}</Descriptions.Item>
              <Descriptions.Item label="Token消耗">{selectedSession.tokens}</Descriptions.Item>
              {selectedSession.satisfaction && (
                <Descriptions.Item label="满意度">
                  <Rate disabled defaultValue={selectedSession.satisfaction} />
                </Descriptions.Item>
              )}
            </Descriptions>
            
            <Card title="对话时间线" size="small">
              <Timeline>
                <Timeline.Item color="green">
                  <Text strong>会话开始</Text>
                  <br />
                  <Text type="secondary">{selectedSession.startTime}</Text>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <Text strong>用户提问</Text>
                  <br />
                  <Text type="secondary">"如何使用知识库系统？"</Text>
                </Timeline.Item>
                <Timeline.Item color="blue">
                  <Text strong>AI回复</Text>
                  <br />
                  <Text type="secondary">"知识库系统提供了多种功能..."</Text>
                </Timeline.Item>
                {selectedSession.endTime && (
                  <Timeline.Item color="red">
                    <Text strong>会话结束</Text>
                    <br />
                    <Text type="secondary">{selectedSession.endTime}</Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>
          </Space>
        )}
      </Drawer>

      {/* 模型配置弹窗 */}
      <Modal
        title={editingModel ? '编辑模型配置' : '新建模型配置'}
        open={showModelConfig}
        onCancel={() => {
          setShowModelConfig(false);
          setEditingModel(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveModel}
        >
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="模型名称"
                rules={[{ required: true, message: '请输入模型名称' }]}
              >
                <Input placeholder="输入模型名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="模型类型"
                rules={[{ required: true, message: '请选择模型类型' }]}
              >
                <Select placeholder="选择模型类型">
                  <Option value="gpt">GPT</Option>
                  <Option value="claude">Claude</Option>
                  <Option value="custom">自定义</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="version"
                label="版本"
                rules={[{ required: true, message: '请输入版本号' }]}
              >
                <Input placeholder="如: 4.0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="选择状态">
                  <Option value="active">运行中</Option>
                  <Option value="inactive">已停用</Option>
                  <Option value="testing">测试中</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="输入模型描述" />
          </Form.Item>
          
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="temperature"
                label="Temperature"
                tooltip="控制输出的随机性，0-1之间"
              >
                <Slider min={0} max={1} step={0.1} marks={{ 0: '0', 0.5: '0.5', 1: '1' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxTokens"
                label="最大Token数"
              >
                <InputNumber min={100} max={8000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="systemPrompt"
            label="系统提示词"
          >
            <TextArea rows={4} placeholder="输入系统提示词" />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShowModelConfig(false);
                setEditingModel(null);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingModel ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ChatManagementPage;