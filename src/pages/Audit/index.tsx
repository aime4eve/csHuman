import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tabs,
  Tag,
  App,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  DatePicker,
  Typography,
  Divider,
  Avatar,
  Timeline,
  Progress,
  Rate,
  Alert,
  Steps,
  Descriptions,
  List,
  Switch,
  Checkbox,
  Radio,
  Upload,
  Image
} from 'antd';
import {
  AuditOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  SettingOutlined,
  BarChartOutlined,
  FilterOutlined,
  SearchOutlined,
  DownloadOutlined,
  BellOutlined,
  StarOutlined,
  FlagOutlined,
  TeamOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
// 移除 TabPane 解构，改用 items 属性
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Step } = Steps;

// 类型定义
interface AuditItem {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'qa' | 'policy' | 'procedure';
  category: string;
  author: string;
  authorId: string;
  submitTime: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'revision_required';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reviewer?: string;
  reviewTime?: string;
  reviewComments?: string;
  qualityScore?: number;
  tags: string[];
  attachments?: string[];
  version: string;
  wordCount: number;
  estimatedReviewTime: number;
}

interface AuditRule {
  id: string;
  name: string;
  description: string;
  type: 'content' | 'format' | 'compliance' | 'quality';
  conditions: string[];
  actions: string[];
  enabled: boolean;
  priority: number;
  createdAt: string;
  lastModified: string;
}

interface ReviewerStats {
  id: string;
  name: string;
  avatar?: string;
  totalReviewed: number;
  avgReviewTime: number;
  approvalRate: number;
  qualityScore: number;
  workload: number;
  status: 'online' | 'offline' | 'busy';
}

interface AuditHistory {
  id: string;
  itemId: string;
  itemTitle: string;
  action: 'submit' | 'review' | 'approve' | 'reject' | 'revise';
  operator: string;
  operatorId: string;
  timestamp: string;
  comments?: string;
  changes?: string[];
}

/**
 * 审核工作台页面
 * @author 伍志勇
 */
const AuditPage: React.FC = () => {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('queue');
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [auditRules, setAuditRules] = useState<AuditRule[]>([]);
  const [reviewerStats, setReviewerStats] = useState<ReviewerStats[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 模态框状态
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [batchReviewModalVisible, setBatchReviewModalVisible] = useState(false);
  
  const [currentItem, setCurrentItem] = useState<AuditItem | null>(null);
  const [editingRule, setEditingRule] = useState<AuditRule | null>(null);
  
  const [reviewForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  // 模拟数据
  const mockAuditItems: AuditItem[] = [
    {
      id: '1',
      title: '企业知识管理体系建设指南',
      content: '本文档详细介绍了企业知识管理体系的建设方法、实施步骤和最佳实践...',
      type: 'document',
      category: '管理制度',
      author: '张知识',
      authorId: '2',
      submitTime: '2024-01-20 09:30:00',
      status: 'pending',
      priority: 'high',
      tags: ['知识管理', '体系建设', '最佳实践'],
      version: '1.0',
      wordCount: 3500,
      estimatedReviewTime: 45
    },
    {
      id: '2',
      title: '如何提高团队协作效率？',
      content: 'Q: 如何提高团队协作效率？\nA: 可以通过以下几个方面来提高团队协作效率...',
      type: 'qa',
      category: '团队管理',
      author: '李编辑',
      authorId: '3',
      submitTime: '2024-01-20 10:15:00',
      status: 'reviewing',
      priority: 'medium',
      reviewer: '赵审核',
      reviewTime: '2024-01-20 11:00:00',
      tags: ['团队协作', '效率提升'],
      version: '1.0',
      wordCount: 800,
      estimatedReviewTime: 15
    },
    {
      id: '3',
      title: '数据安全管理规范',
      content: '为确保企业数据安全，特制定本规范，适用于所有涉及数据处理的业务活动...',
      type: 'policy',
      category: '安全规范',
      author: '王安全',
      authorId: '6',
      submitTime: '2024-01-19 16:20:00',
      status: 'approved',
      priority: 'urgent',
      reviewer: '系统管理员',
      reviewTime: '2024-01-20 08:30:00',
      reviewComments: '内容完整，符合安全要求，批准发布',
      qualityScore: 95,
      tags: ['数据安全', '管理规范', '合规'],
      version: '2.1',
      wordCount: 2800,
      estimatedReviewTime: 35
    },
    {
      id: '4',
      title: '新员工入职流程操作手册',
      content: '本手册详细说明了新员工入职的各个环节和操作步骤...',
      type: 'procedure',
      category: '人事流程',
      author: '陈人事',
      authorId: '7',
      submitTime: '2024-01-19 14:45:00',
      status: 'revision_required',
      priority: 'medium',
      reviewer: '赵审核',
      reviewTime: '2024-01-20 09:15:00',
      reviewComments: '流程描述不够详细，需要补充具体的操作步骤和注意事项',
      qualityScore: 72,
      tags: ['入职流程', '操作手册', '人事管理'],
      version: '1.2',
      wordCount: 1500,
      estimatedReviewTime: 25
    },
    {
      id: '5',
      title: '客户服务质量标准',
      content: '为提升客户服务质量，制定以下服务标准和评价体系...',
      type: 'document',
      category: '服务标准',
      author: '刘服务',
      authorId: '8',
      submitTime: '2024-01-18 11:30:00',
      status: 'rejected',
      priority: 'low',
      reviewer: '质量管理员',
      reviewTime: '2024-01-19 10:20:00',
      reviewComments: '标准定义不够明确，缺少量化指标，建议重新修订',
      qualityScore: 58,
      tags: ['客户服务', '质量标准', '评价体系'],
      version: '1.0',
      wordCount: 2200,
      estimatedReviewTime: 30
    }
  ];

  const mockAuditRules: AuditRule[] = [
    {
      id: '1',
      name: '内容完整性检查',
      description: '检查文档是否包含必要的章节和内容要素',
      type: 'content',
      conditions: ['标题不为空', '正文字数>100', '包含摘要或简介'],
      actions: ['标记为待完善', '发送提醒通知'],
      enabled: true,
      priority: 1,
      createdAt: '2023-12-01 00:00:00',
      lastModified: '2024-01-15 10:30:00'
    },
    {
      id: '2',
      name: '格式规范检查',
      description: '检查文档格式是否符合企业标准',
      type: 'format',
      conditions: ['使用标准模板', '图片清晰度>300dpi', '表格格式统一'],
      actions: ['自动格式化', '生成格式报告'],
      enabled: true,
      priority: 2,
      createdAt: '2023-12-01 00:00:00',
      lastModified: '2024-01-10 14:20:00'
    },
    {
      id: '3',
      name: '合规性审查',
      description: '检查内容是否符合法律法规和企业政策',
      type: 'compliance',
      conditions: ['无敏感信息泄露', '符合行业规范', '通过安全扫描'],
      actions: ['标记风险内容', '转交合规部门'],
      enabled: true,
      priority: 1,
      createdAt: '2023-12-01 00:00:00',
      lastModified: '2024-01-18 09:45:00'
    },
    {
      id: '4',
      name: '质量评分',
      description: '基于多维度指标对内容质量进行评分',
      type: 'quality',
      conditions: ['准确性评估', '实用性评估', '可读性评估'],
      actions: ['生成质量报告', '推荐改进建议'],
      enabled: true,
      priority: 3,
      createdAt: '2023-12-01 00:00:00',
      lastModified: '2024-01-12 16:15:00'
    }
  ];

  const mockReviewerStats: ReviewerStats[] = [
    {
      id: '1',
      name: '赵审核',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
      totalReviewed: 156,
      avgReviewTime: 28,
      approvalRate: 78,
      qualityScore: 4.6,
      workload: 12,
      status: 'online'
    },
    {
      id: '2',
      name: '质量管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=quality',
      totalReviewed: 203,
      avgReviewTime: 35,
      approvalRate: 65,
      qualityScore: 4.8,
      workload: 8,
      status: 'online'
    },
    {
      id: '3',
      name: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      totalReviewed: 89,
      avgReviewTime: 22,
      approvalRate: 85,
      qualityScore: 4.4,
      workload: 5,
      status: 'busy'
    }
  ];

  const mockAuditHistory: AuditHistory[] = [
    {
      id: '1',
      itemId: '1',
      itemTitle: '企业知识管理体系建设指南',
      action: 'submit',
      operator: '张知识',
      operatorId: '2',
      timestamp: '2024-01-20 09:30:00',
      comments: '提交审核，请尽快处理'
    },
    {
      id: '2',
      itemId: '3',
      itemTitle: '数据安全管理规范',
      action: 'approve',
      operator: '系统管理员',
      operatorId: '1',
      timestamp: '2024-01-20 08:30:00',
      comments: '内容完整，符合安全要求，批准发布',
      changes: ['更新版本号', '添加生效日期']
    },
    {
      id: '3',
      itemId: '4',
      itemTitle: '新员工入职流程操作手册',
      action: 'revise',
      operator: '赵审核',
      operatorId: '5',
      timestamp: '2024-01-20 09:15:00',
      comments: '流程描述不够详细，需要补充具体的操作步骤和注意事项'
    }
  ];

  // 初始化数据
  useEffect(() => {
    setAuditItems(mockAuditItems);
    setAuditRules(mockAuditRules);
    setReviewerStats(mockReviewerStats);
    setAuditHistory(mockAuditHistory);
  }, []);

  // 审核队列表格列定义
  const auditColumns: ColumnsType<AuditItem> = [
    {
      title: '内容信息',
      key: 'contentInfo',
      width: 300,
      render: (_, record) => (
        <div>
          <div className="font-medium text-blue-600 cursor-pointer hover:text-blue-800" 
               onClick={() => handleViewDetail(record)}>
            {record.title}
          </div>
          <div className="text-gray-500 text-sm mt-1">
            <Space>
              <Tag color={record.type === 'document' ? 'blue' : record.type === 'qa' ? 'green' : record.type === 'policy' ? 'red' : 'orange'}>
                {record.type === 'document' ? '文档' : record.type === 'qa' ? '问答' : record.type === 'policy' ? '政策' : '流程'}
              </Tag>
              <span>{record.category}</span>
              <span>{record.wordCount}字</span>
            </Space>
          </div>
        </div>
      )
    },
    {
      title: '作者',
      key: 'author',
      width: 120,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{record.author}</span>
        </Space>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const priorityConfig = {
          urgent: { color: 'red', text: '紧急' },
          high: { color: 'orange', text: '高' },
          medium: { color: 'blue', text: '中' },
          low: { color: 'green', text: '低' }
        };
        const config = priorityConfig[priority as keyof typeof priorityConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'processing', text: '待审核' },
          reviewing: { color: 'warning', text: '审核中' },
          approved: { color: 'success', text: '已通过' },
          rejected: { color: 'error', text: '已拒绝' },
          revision_required: { color: 'default', text: '需修订' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge status={config.color as any} text={config.text} />;
      }
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 150,
      render: (time: string) => (
        <Tooltip title={time}>
          <span>{dayjs(time).format('MM-DD HH:mm')}</span>
        </Tooltip>
      )
    },
    {
      title: '预计用时',
      dataIndex: 'estimatedReviewTime',
      key: 'estimatedReviewTime',
      width: 100,
      render: (time: number) => (
        <span className="text-gray-600">{time}分钟</span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="开始审核">
              <Button type="text" icon={<AuditOutlined />} onClick={() => handleStartReview(record)} />
            </Tooltip>
          )}
          {(record.status === 'pending' || record.status === 'reviewing') && (
            <>
              <Tooltip title="通过">
                <Button type="text" icon={<CheckOutlined />} style={{ color: '#52c41a' }} 
                        onClick={() => handleQuickApprove(record)} />
              </Tooltip>
              <Tooltip title="拒绝">
                <Button type="text" icon={<CloseOutlined />} danger 
                        onClick={() => handleQuickReject(record)} />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  // 审核规则表格列定义
  const ruleColumns: ColumnsType<AuditRule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-gray-500 text-sm">{record.description}</div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeConfig = {
          content: { color: 'blue', text: '内容检查' },
          format: { color: 'green', text: '格式检查' },
          compliance: { color: 'red', text: '合规检查' },
          quality: { color: 'purple', text: '质量评估' }
        };
        const config = typeConfig[type as keyof typeof typeConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Badge count={priority} style={{ backgroundColor: priority === 1 ? '#f50' : priority === 2 ? '#fa8c16' : '#52c41a' }} />
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Switch checked={enabled} onChange={(checked) => handleToggleRule(enabled, checked)} />
      )
    },
    {
      title: '最后修改',
      dataIndex: 'lastModified',
      key: 'lastModified',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑规则">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEditRule(record)} />
          </Tooltip>
          <Tooltip title="删除规则">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRule(record.id)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 事件处理函数
  const handleViewDetail = (item: AuditItem) => {
    setCurrentItem(item);
    setDetailModalVisible(true);
  };

  const handleStartReview = (item: AuditItem) => {
    setCurrentItem(item);
    reviewForm.setFieldsValue({
      itemId: item.id,
      reviewer: '当前用户',
      qualityScore: 80
    });
    setReviewModalVisible(true);
  };

  const handleQuickApprove = (item: AuditItem) => {
    setAuditItems(auditItems.map(i => 
      i.id === item.id 
        ? { ...i, status: 'approved', reviewer: '当前用户', reviewTime: dayjs().format('YYYY-MM-DD HH:mm:ss') }
        : i
    ));
    message.success('审核通过');
  };

  const handleQuickReject = (item: AuditItem) => {
    setAuditItems(auditItems.map(i => 
      i.id === item.id 
        ? { ...i, status: 'rejected', reviewer: '当前用户', reviewTime: dayjs().format('YYYY-MM-DD HH:mm:ss') }
        : i
    ));
    message.success('审核拒绝');
  };

  const handleBatchReview = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要批量审核的项目');
      return;
    }
    setBatchReviewModalVisible(true);
  };

  const handleEditRule = (rule: AuditRule) => {
    setEditingRule(rule);
    ruleForm.setFieldsValue(rule);
    setRuleModalVisible(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    setAuditRules(auditRules.filter(r => r.id !== ruleId));
    message.success('规则删除成功');
  };

  const handleToggleRule = (currentEnabled: boolean, newEnabled: boolean) => {
    message.success(`规则已${newEnabled ? '启用' : '禁用'}`);
  };

  const handleReviewSubmit = async (values: any) => {
    try {
      const updatedItem = {
        ...currentItem!,
        status: values.decision,
        reviewer: values.reviewer,
        reviewTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        reviewComments: values.comments,
        qualityScore: values.qualityScore
      };
      
      setAuditItems(auditItems.map(i => i.id === currentItem!.id ? updatedItem : i));
      setReviewModalVisible(false);
      setCurrentItem(null);
      reviewForm.resetFields();
      message.success('审核完成');
    } catch (error) {
      message.error('审核失败');
    }
  };

  const handleRuleSubmit = async (values: any) => {
    try {
      if (editingRule) {
        setAuditRules(auditRules.map(r => r.id === editingRule.id ? { ...r, ...values, lastModified: dayjs().format('YYYY-MM-DD HH:mm:ss') } : r));
        message.success('规则更新成功');
      } else {
        const newRule: AuditRule = {
          id: Date.now().toString(),
          ...values,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          lastModified: dayjs().format('YYYY-MM-DD HH:mm:ss')
        };
        setAuditRules([...auditRules, newRule]);
        message.success('规则创建成功');
      }
      setRuleModalVisible(false);
      setEditingRule(null);
      ruleForm.resetFields();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 统计数据
  const stats = {
    totalItems: auditItems.length,
    pendingItems: auditItems.filter(i => i.status === 'pending').length,
    reviewingItems: auditItems.filter(i => i.status === 'reviewing').length,
    completedToday: auditItems.filter(i => i.reviewTime && dayjs(i.reviewTime).isAfter(dayjs().startOf('day'))).length
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题和统计 */}
      <div className="mb-6">
        <Title level={2} className="mb-4">
          <AuditOutlined className="mr-2" />
          审核工作台
        </Title>
        
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="总审核项"
                value={stats.totalItems}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待审核"
                value={stats.pendingItems}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="审核中"
                value={stats.reviewingItems}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日完成"
                value={stats.completedToday}
                prefix={<CheckOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 主要内容区域 */}
      <Card className="shadow-sm">
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'queue',
              label: (
                <span>
                  <AuditOutlined />
                  审核队列
                </span>
              ),
              children: (
                <>
                  <div className="mb-4">
                    <Space>
                      <Button type="primary" onClick={handleBatchReview} disabled={selectedRowKeys.length === 0}>
                        批量审核 ({selectedRowKeys.length})
                      </Button>
                      <Select defaultValue="all" style={{ width: 120 }}>
                        <Option value="all">全部状态</Option>
                        <Option value="pending">待审核</Option>
                        <Option value="reviewing">审核中</Option>
                        <Option value="approved">已通过</Option>
                        <Option value="rejected">已拒绝</Option>
                      </Select>
                      <Select defaultValue="all" style={{ width: 120 }}>
                        <Option value="all">全部类型</Option>
                        <Option value="document">文档</Option>
                        <Option value="qa">问答</Option>
                        <Option value="policy">政策</Option>
                        <Option value="procedure">流程</Option>
                      </Select>
                      <Select defaultValue="all" style={{ width: 120 }}>
                        <Option value="all">全部优先级</Option>
                        <Option value="urgent">紧急</Option>
                        <Option value="high">高</Option>
                        <Option value="medium">中</Option>
                        <Option value="low">低</Option>
                      </Select>
                      <Button icon={<SearchOutlined />}>高级搜索</Button>
                      <Button icon={<DownloadOutlined />}>导出报告</Button>
                    </Space>
                  </div>
                  
                  <Table
                    columns={auditColumns}
                    dataSource={auditItems}
                    rowKey="id"
                    loading={loading}
                    rowSelection={{
                      selectedRowKeys,
                      onChange: setSelectedRowKeys
                    }}
                    pagination={{
                      total: auditItems.length,
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
                    }}
                  />
                </>
              )
            },
            {
              key: 'rules',
              label: (
                <span>
                  <SettingOutlined />
                  审核规则
                </span>
              ),
              children: (
                <>
                  <div className="mb-4">
                    <Space>
                      <Button type="primary" onClick={() => setRuleModalVisible(true)}>
                        新增规则
                      </Button>
                      <Button>导入规则</Button>
                      <Button>规则模板</Button>
                    </Space>
                  </div>
                  
                  <Table
                    columns={ruleColumns}
                    dataSource={auditRules}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      total: auditRules.length,
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
                    }}
                  />
                </>
              )
            },
            {
              key: 'reviewers',
              label: (
                <span>
                  <TeamOutlined />
                  审核员统计
                </span>
              ),
              children: (
                <Row gutter={16}>
                  {reviewerStats.map(reviewer => (
                    <Col span={8} key={reviewer.id} className="mb-4">
                      <Card>
                        <div className="flex items-center mb-4">
                          <Avatar src={reviewer.avatar} size={48} className="mr-3" />
                          <div>
                            <div className="font-medium">{reviewer.name}</div>
                            <Badge 
                              status={reviewer.status === 'online' ? 'success' : reviewer.status === 'busy' ? 'processing' : 'default'} 
                              text={reviewer.status === 'online' ? '在线' : reviewer.status === 'busy' ? '忙碌' : '离线'} 
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>总审核数</span>
                            <span className="font-medium">{reviewer.totalReviewed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>平均用时</span>
                            <span className="font-medium">{reviewer.avgReviewTime}分钟</span>
                          </div>
                          <div className="flex justify-between">
                            <span>通过率</span>
                            <span className="font-medium">{reviewer.approvalRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>质量评分</span>
                            <Rate disabled defaultValue={reviewer.qualityScore} allowHalf />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>当前工作量</span>
                              <span className="font-medium">{reviewer.workload}/20</span>
                            </div>
                            <Progress percent={(reviewer.workload / 20) * 100} size="small" />
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )
            },
            {
              key: 'history',
              label: (
                <span>
                  <CalendarOutlined />
                  审核历史
                </span>
              ),
              children: (
                <>
                  <div className="mb-4">
                    <Space>
                      <RangePicker placeholder={['开始日期', '结束日期']} />
                      <Select defaultValue="all" style={{ width: 120 }}>
                        <Option value="all">全部操作</Option>
                        <Option value="submit">提交</Option>
                        <Option value="approve">批准</Option>
                        <Option value="reject">拒绝</Option>
                        <Option value="revise">修订</Option>
                      </Select>
                      <Button icon={<SearchOutlined />}>搜索</Button>
                    </Space>
                  </div>
                  
                  <List
                    dataSource={auditHistory}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={
                            <Space>
                              <span>{item.operator}</span>
                              <Tag color={
                                item.action === 'approve' ? 'green' : 
                                item.action === 'reject' ? 'red' : 
                                item.action === 'submit' ? 'blue' : 'orange'
                              }>
                                {item.action === 'approve' ? '批准' : 
                                 item.action === 'reject' ? '拒绝' : 
                                 item.action === 'submit' ? '提交' : '修订'}
                              </Tag>
                              <span className="text-gray-500">{item.itemTitle}</span>
                            </Space>
                          }
                          description={
                            <div>
                              <div className="text-gray-500 text-sm">{item.timestamp}</div>
                              {item.comments && <div className="mt-1">{item.comments}</div>}
                              {item.changes && (
                                <div className="mt-2">
                                  <Text type="secondary">变更内容：</Text>
                                  <Space wrap>
                                    {item.changes.map((change, index) => (
                                      <Tag key={index} color="blue">{change}</Tag>
                                    ))}
                                  </Space>
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                    pagination={{
                      total: auditHistory.length,
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true
                    }}
                  />
                </>
              )
            }
          ]}
        />
      </Card>

      {/* 审核详情模态框 */}
      <Modal
        title="内容详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentItem(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          currentItem?.status === 'pending' && (
            <Button key="review" type="primary" onClick={() => {
              setDetailModalVisible(false);
              handleStartReview(currentItem);
            }}>
              开始审核
            </Button>
          )
        ]}
        width={800}
      >
        {currentItem && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="标题" span={2}>{currentItem.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{currentItem.type}</Descriptions.Item>
              <Descriptions.Item label="分类">{currentItem.category}</Descriptions.Item>
              <Descriptions.Item label="作者">{currentItem.author}</Descriptions.Item>
              <Descriptions.Item label="版本">{currentItem.version}</Descriptions.Item>
              <Descriptions.Item label="字数">{currentItem.wordCount}</Descriptions.Item>
              <Descriptions.Item label="预计用时">{currentItem.estimatedReviewTime}分钟</Descriptions.Item>
              <Descriptions.Item label="提交时间" span={2}>{currentItem.submitTime}</Descriptions.Item>
              <Descriptions.Item label="标签" span={2}>
                <Space wrap>
                  {currentItem.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider>内容预览</Divider>
            <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
              <Paragraph>{currentItem.content}</Paragraph>
            </div>
            
            {currentItem.reviewComments && (
              <>
                <Divider>审核意见</Divider>
                <Alert
                  message={`审核人：${currentItem.reviewer}`}
                  description={currentItem.reviewComments}
                  type={currentItem.status === 'approved' ? 'success' : currentItem.status === 'rejected' ? 'error' : 'warning'}
                  showIcon
                />
                {currentItem.qualityScore && (
                  <div className="mt-2">
                    <Text>质量评分：</Text>
                    <Rate disabled defaultValue={currentItem.qualityScore / 20} allowHalf />
                    <span className="ml-2">{currentItem.qualityScore}分</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* 审核模态框 */}
      <Modal
        title="内容审核"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setCurrentItem(null);
          reviewForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={handleReviewSubmit}
        >
          <Form.Item name="decision" label="审核决定" rules={[{ required: true, message: '请选择审核决定' }]}>
            <Radio.Group>
              <Radio.Button value="approved">通过</Radio.Button>
              <Radio.Button value="rejected">拒绝</Radio.Button>
              <Radio.Button value="revision_required">需要修订</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="qualityScore" label="质量评分" rules={[{ required: true, message: '请评分' }]}>
            <Rate count={5} allowHalf />
            <span className="ml-2">分</span>
          </Form.Item>
          
          <Form.Item name="comments" label="审核意见" rules={[{ required: true, message: '请输入审核意见' }]}>
            <TextArea rows={4} placeholder="请详细说明审核意见和建议" />
          </Form.Item>
          
          <Form.Item name="reviewer" label="审核人" initialValue="当前用户">
            <Input disabled />
          </Form.Item>
          
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                setReviewModalVisible(false);
                setCurrentItem(null);
                reviewForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交审核
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 规则编辑模态框 */}
      <Modal
        title={editingRule ? '编辑规则' : '新增规则'}
        open={ruleModalVisible}
        onCancel={() => {
          setRuleModalVisible(false);
          setEditingRule(null);
          ruleForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={ruleForm}
          layout="vertical"
          onFinish={handleRuleSubmit}
        >
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          
          <Form.Item name="description" label="规则描述">
            <TextArea rows={2} placeholder="请输入规则描述" />
          </Form.Item>
          
          <Form.Item name="type" label="规则类型" rules={[{ required: true, message: '请选择规则类型' }]}>
            <Select placeholder="请选择规则类型">
              <Option value="content">内容检查</Option>
              <Option value="format">格式检查</Option>
              <Option value="compliance">合规检查</Option>
              <Option value="quality">质量评估</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
            <Select placeholder="请选择优先级">
              <Option value={1}>高 (1)</Option>
              <Option value={2}>中 (2)</Option>
              <Option value={3}>低 (3)</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="enabled" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                setRuleModalVisible(false);
                setEditingRule(null);
                ruleForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRule ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量审核模态框 */}
      <Modal
        title={`批量审核 (${selectedRowKeys.length}项)`}
        open={batchReviewModalVisible}
        onCancel={() => {
          setBatchReviewModalVisible(false);
          batchForm.resetFields();
        }}
        onOk={() => {
          batchForm.submit();
        }}
        width={500}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={(values) => {
            // 批量处理逻辑
            setAuditItems(auditItems.map(item => 
              selectedRowKeys.includes(item.id) 
                ? { ...item, status: values.decision, reviewer: '当前用户', reviewTime: dayjs().format('YYYY-MM-DD HH:mm:ss') }
                : item
            ));
            setBatchReviewModalVisible(false);
            setSelectedRowKeys([]);
            batchForm.resetFields();
            message.success(`批量${values.decision === 'approved' ? '通过' : '拒绝'}成功`);
          }}
        >
          <Alert
            message={`即将对 ${selectedRowKeys.length} 个项目执行批量操作`}
            type="info"
            className="mb-4"
          />
          
          <Form.Item name="decision" label="批量操作" rules={[{ required: true, message: '请选择操作' }]}>
            <Radio.Group>
              <Radio.Button value="approved">批量通过</Radio.Button>
              <Radio.Button value="rejected">批量拒绝</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="comments" label="批量意见">
            <TextArea rows={3} placeholder="请输入批量处理意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AuditPage;