import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Typography,
  Tabs,
  Progress,
  Tag,
  List,
  Avatar,
  Tooltip,
  Alert,
  Badge,
  Divider,
  Timeline,
  Rate,
  Switch,
  Input,
  Modal,
  Form,
  App
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  FallOutlined,
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  MessageOutlined,
  StarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  GlobalOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
  SettingOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DashboardOutlined,
  FundOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
// const { TabPane } = Tabs; // 已废弃，使用 items 属性替代
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 类型定义
interface UsageStats {
  date: string;
  totalViews: number;
  uniqueUsers: number;
  searchQueries: number;
  downloads: number;
  avgSessionTime: number;
}

interface ContentStats {
  id: string;
  title: string;
  category: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  rating: number;
  lastUpdated: string;
  author: string;
  trend: 'up' | 'down' | 'stable';
}

interface UserBehavior {
  id: string;
  userId: string;
  userName: string;
  action: 'view' | 'search' | 'download' | 'like' | 'comment' | 'share';
  target: string;
  timestamp: string;
  duration?: number;
  device: 'desktop' | 'mobile' | 'tablet';
  location: string;
}

interface QualityMetrics {
  period: string;
  accuracy: number;
  completeness: number;
  timeliness: number;
  relevance: number;
  satisfaction: number;
}

interface SystemPerformance {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

interface AlertItem {
  id: string;
  type: 'performance' | 'quality' | 'security' | 'usage';
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'ignored';
  affectedUsers?: number;
}

/**
 * 统计分析页面
 * @author 伍志勇
 */
const AnalyticsPage: React.FC = () => {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [loading, setLoading] = useState(false);
  
  // 数据状态
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [contentStats, setContentStats] = useState<ContentStats[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehavior[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics[]>([]);
  const [systemPerformance, setSystemPerformance] = useState<SystemPerformance[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  
  // 模态框状态
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<AlertItem | null>(null);
  
  const [reportForm] = Form.useForm();

  // 模拟数据
  const mockUsageStats: UsageStats[] = [
    { date: '2024-01-01', totalViews: 1250, uniqueUsers: 320, searchQueries: 180, downloads: 45, avgSessionTime: 8.5 },
    { date: '2024-01-02', totalViews: 1380, uniqueUsers: 350, searchQueries: 195, downloads: 52, avgSessionTime: 9.2 },
    { date: '2024-01-03', totalViews: 1420, uniqueUsers: 365, searchQueries: 210, downloads: 48, avgSessionTime: 8.8 },
    { date: '2024-01-04', totalViews: 1180, uniqueUsers: 295, searchQueries: 165, downloads: 38, avgSessionTime: 7.9 },
    { date: '2024-01-05', totalViews: 1650, uniqueUsers: 420, searchQueries: 245, downloads: 65, avgSessionTime: 10.1 },
    { date: '2024-01-06', totalViews: 1580, uniqueUsers: 395, searchQueries: 230, downloads: 58, avgSessionTime: 9.6 },
    { date: '2024-01-07', totalViews: 1720, uniqueUsers: 445, searchQueries: 265, downloads: 72, avgSessionTime: 10.8 },
    { date: '2024-01-08', totalViews: 1890, uniqueUsers: 485, searchQueries: 290, downloads: 78, avgSessionTime: 11.2 },
    { date: '2024-01-09', totalViews: 1950, uniqueUsers: 510, searchQueries: 305, downloads: 85, avgSessionTime: 11.5 },
    { date: '2024-01-10', totalViews: 2100, uniqueUsers: 550, searchQueries: 325, downloads: 92, avgSessionTime: 12.1 }
  ];

  const mockContentStats: ContentStats[] = [
    {
      id: '1',
      title: '企业知识管理体系建设指南',
      category: '管理制度',
      views: 2850,
      likes: 156,
      shares: 42,
      comments: 28,
      rating: 4.8,
      lastUpdated: '2024-01-20',
      author: '张知识',
      trend: 'up'
    },
    {
      id: '2',
      title: '团队协作效率提升方法',
      category: '团队管理',
      views: 2340,
      likes: 128,
      shares: 35,
      comments: 22,
      rating: 4.6,
      lastUpdated: '2024-01-19',
      author: '李编辑',
      trend: 'up'
    },
    {
      id: '3',
      title: '数据安全管理规范',
      category: '安全规范',
      views: 1980,
      likes: 95,
      shares: 28,
      comments: 15,
      rating: 4.7,
      lastUpdated: '2024-01-18',
      author: '王安全',
      trend: 'stable'
    },
    {
      id: '4',
      title: '客户服务标准流程',
      category: '服务标准',
      views: 1650,
      likes: 78,
      shares: 18,
      comments: 12,
      rating: 4.3,
      lastUpdated: '2024-01-17',
      author: '刘服务',
      trend: 'down'
    },
    {
      id: '5',
      title: '新员工培训手册',
      category: '人事管理',
      views: 1420,
      likes: 65,
      shares: 15,
      comments: 8,
      rating: 4.2,
      lastUpdated: '2024-01-16',
      author: '陈人事',
      trend: 'stable'
    }
  ];

  const mockQualityMetrics: QualityMetrics[] = [
    { period: '2024-01', accuracy: 92, completeness: 88, timeliness: 85, relevance: 90, satisfaction: 4.5 },
    { period: '2023-12', accuracy: 89, completeness: 85, timeliness: 82, relevance: 87, satisfaction: 4.3 },
    { period: '2023-11', accuracy: 87, completeness: 83, timeliness: 80, relevance: 85, satisfaction: 4.1 },
    { period: '2023-10', accuracy: 85, completeness: 81, timeliness: 78, relevance: 83, satisfaction: 4.0 },
    { period: '2023-09', accuracy: 83, completeness: 79, timeliness: 76, relevance: 81, satisfaction: 3.9 }
  ];

  const mockSystemPerformance: SystemPerformance[] = [
    { timestamp: '00:00', responseTime: 120, throughput: 850, errorRate: 0.2, cpuUsage: 45, memoryUsage: 62, diskUsage: 35 },
    { timestamp: '04:00', responseTime: 95, throughput: 650, errorRate: 0.1, cpuUsage: 32, memoryUsage: 58, diskUsage: 35 },
    { timestamp: '08:00', responseTime: 180, throughput: 1200, errorRate: 0.3, cpuUsage: 68, memoryUsage: 72, diskUsage: 36 },
    { timestamp: '12:00', responseTime: 220, throughput: 1450, errorRate: 0.4, cpuUsage: 78, memoryUsage: 78, diskUsage: 37 },
    { timestamp: '16:00', responseTime: 195, throughput: 1350, errorRate: 0.3, cpuUsage: 72, memoryUsage: 75, diskUsage: 38 },
    { timestamp: '20:00', responseTime: 150, throughput: 1100, errorRate: 0.2, cpuUsage: 58, memoryUsage: 68, diskUsage: 38 }
  ];

  const mockAlerts: AlertItem[] = [
    {
      id: '1',
      type: 'performance',
      level: 'warning',
      title: '响应时间异常',
      description: '系统平均响应时间超过200ms，建议检查服务器性能',
      timestamp: '2024-01-20 14:30:00',
      status: 'active',
      affectedUsers: 150
    },
    {
      id: '2',
      type: 'quality',
      level: 'info',
      title: '内容质量提升',
      description: '本月内容质量评分较上月提升5%',
      timestamp: '2024-01-20 10:15:00',
      status: 'active'
    },
    {
      id: '3',
      type: 'usage',
      level: 'error',
      title: '访问量异常下降',
      description: '今日访问量较昨日下降30%，需要关注',
      timestamp: '2024-01-20 09:45:00',
      status: 'active',
      affectedUsers: 200
    },
    {
      id: '4',
      type: 'security',
      level: 'critical',
      title: '异常登录检测',
      description: '检测到多次异常登录尝试，建议加强安全防护',
      timestamp: '2024-01-19 23:20:00',
      status: 'resolved'
    }
  ];

  // 初始化数据
  useEffect(() => {
    setUsageStats(mockUsageStats);
    setContentStats(mockContentStats);
    setQualityMetrics(mockQualityMetrics);
    setSystemPerformance(mockSystemPerformance);
    setAlerts(mockAlerts);
  }, []);

  // 图表颜色配置
  const chartColors = {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    purple: '#722ed1',
    cyan: '#13c2c2',
    orange: '#fa8c16',
    pink: '#eb2f96'
  };

  // 饼图数据
  const categoryData = [
    { name: '管理制度', value: 35, color: chartColors.primary },
    { name: '技术文档', value: 28, color: chartColors.success },
    { name: '流程规范', value: 20, color: chartColors.warning },
    { name: '培训资料', value: 12, color: chartColors.purple },
    { name: '其他', value: 5, color: chartColors.cyan }
  ];

  // 用户行为数据
  const behaviorData = [
    { action: '浏览', count: 15420, percentage: 45 },
    { action: '搜索', count: 8650, percentage: 25 },
    { action: '下载', count: 5180, percentage: 15 },
    { action: '收藏', count: 3460, percentage: 10 },
    { action: '分享', count: 1730, percentage: 5 }
  ];

  // 热门内容表格列定义
  const contentColumns: ColumnsType<ContentStats> = [
    {
      title: '内容标题',
      key: 'title',
      render: (_, record) => (
        <div>
          <div className="font-medium text-blue-600">{record.title}</div>
          <div className="text-gray-500 text-sm">
            <Space>
              <Tag color="blue">{record.category}</Tag>
              <span>作者：{record.author}</span>
            </Space>
          </div>
        </div>
      )
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
      sorter: (a, b) => a.views - b.views,
      render: (views: number, record) => (
        <Space>
          <span className="font-medium">{views.toLocaleString()}</span>
          {record.trend === 'up' && <RiseOutlined style={{ color: chartColors.success }} />}
          {record.trend === 'down' && <FallOutlined style={{ color: chartColors.error }} />}
        </Space>
      )
    },
    {
      title: '互动数据',
      key: 'engagement',
      render: (_, record) => (
        <Space>
          <Tooltip title="点赞">
            <span><StarOutlined /> {record.likes}</span>
          </Tooltip>
          <Tooltip title="评论">
            <span><MessageOutlined /> {record.comments}</span>
          </Tooltip>
          <Tooltip title="分享">
            <span><GlobalOutlined /> {record.shares}</span>
          </Tooltip>
        </Space>
      )
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <Space>
          <Rate disabled defaultValue={rating} allowHalf />
          <span>{rating}</span>
        </Space>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    }
  ];

  // 告警表格列定义
  const alertColumns: ColumnsType<AlertItem> = [
    {
      title: '告警信息',
      key: 'alert',
      render: (_, record) => (
        <div>
          <div className="flex items-center mb-1">
            <Badge 
              status={record.level === 'critical' ? 'error' : record.level === 'error' ? 'error' : record.level === 'warning' ? 'warning' : 'processing'} 
            />
            <span className="font-medium ml-2">{record.title}</span>
            <Tag color={record.type === 'performance' ? 'blue' : record.type === 'quality' ? 'green' : record.type === 'security' ? 'red' : 'orange'} className="ml-2">
              {record.type === 'performance' ? '性能' : record.type === 'quality' ? '质量' : record.type === 'security' ? '安全' : '使用'}
            </Tag>
          </div>
          <div className="text-gray-500 text-sm">{record.description}</div>
        </div>
      )
    },
    {
      title: '影响用户',
      dataIndex: 'affectedUsers',
      key: 'affectedUsers',
      render: (users?: number) => users ? `${users}人` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'processing', text: '活跃' },
          resolved: { color: 'success', text: '已解决' },
          ignored: { color: 'default', text: '已忽略' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge status={config.color as any} text={config.text} />;
      }
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time: string) => (
        <Tooltip title={time}>
          <span>{dayjs(time).format('MM-DD HH:mm')}</span>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" onClick={() => handleViewAlert(record)}>
            查看
          </Button>
          {record.status === 'active' && (
            <Button type="text" size="small" onClick={() => handleResolveAlert(record.id)}>
              解决
            </Button>
          )}
        </Space>
      )
    }
  ];

  // 事件处理函数
  const handleViewAlert = (alert: AlertItem) => {
    setCurrentAlert(alert);
    setAlertModalVisible(true);
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
    message.success('告警已标记为已解决');
  };

  const handleExportReport = () => {
    setReportModalVisible(true);
  };

  const handleGenerateReport = async (values: any) => {
    try {
      setLoading(true);
      // 模拟报告生成
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('报告生成成功，已发送到您的邮箱');
      setReportModalVisible(false);
      reportForm.resetFields();
    } catch (error) {
      message.error('报告生成失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算统计数据
  const totalViews = usageStats.reduce((sum, item) => sum + item.totalViews, 0);
  const totalUsers = Math.max(...usageStats.map(item => item.uniqueUsers));
  const avgSessionTime = usageStats.reduce((sum, item) => sum + item.avgSessionTime, 0) / usageStats.length;
  const totalDownloads = usageStats.reduce((sum, item) => sum + item.downloads, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题和控制 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>
            <BarChartOutlined className="mr-2" />
            统计分析
          </Title>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates)}
              format="YYYY-MM-DD"
            />
            <Button icon={<DownloadOutlined />} onClick={handleExportReport}>
              导出报告
            </Button>
            <Button icon={<SettingOutlined />}>
              配置
            </Button>
          </Space>
        </div>

        {/* 实时告警 */}
        {alerts.filter(alert => alert.status === 'active' && alert.level === 'critical').length > 0 && (
          <Alert
            message="系统告警"
            description={`检测到 ${alerts.filter(alert => alert.status === 'active' && alert.level === 'critical').length} 个严重告警，请及时处理`}
            type="error"
            showIcon
            closable
            className="mb-4"
            action={
              <Button size="small" danger onClick={() => setActiveTab('alerts')}>
                查看详情
              </Button>
            }
          />
        )}
      </div>

      {/* 主要内容区域 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: <span><DashboardOutlined />概览</span>,
            children: (
              <>
          {/* 核心指标 */}
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Card>
                <Statistic
                  title="总浏览量"
                  value={totalViews}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: chartColors.primary }}
                  suffix="次"
                />
                <div className="mt-2 text-sm text-gray-500">
                  <RiseOutlined className="text-green-500" /> 较上月 +12.5%
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="活跃用户"
                  value={totalUsers}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: chartColors.success }}
                  suffix="人"
                />
                <div className="mt-2 text-sm text-gray-500">
                  <RiseOutlined className="text-green-500" /> 较上月 +8.3%
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均会话时长"
                  value={avgSessionTime}
                  precision={1}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: chartColors.warning }}
                  suffix="分钟"
                />
                <div className="mt-2 text-sm text-gray-500">
                  <FallOutlined className="text-red-500" /> 较上月 -2.1%
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总下载量"
                  value={totalDownloads}
                  prefix={<DownloadOutlined />}
                  valueStyle={{ color: chartColors.purple }}
                  suffix="次"
                />
                <div className="mt-2 text-sm text-gray-500">
                  <RiseOutlined className="text-green-500" /> 较上月 +15.7%
                </div>
              </Card>
            </Col>
          </Row>

          {/* 趋势图表 */}
          <Row gutter={16} className="mb-6">
            <Col span={16}>
              <Card title="使用趋势" extra={<Button type="text" icon={<LineChartOutlined />}>切换视图</Button>}>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={usageStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => dayjs(value).format('MM-DD')} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="totalViews" stackId="1" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.3} name="总浏览量" />
                    <Bar yAxisId="right" dataKey="uniqueUsers" fill={chartColors.success} name="独立用户" />
                    <Line yAxisId="left" type="monotone" dataKey="searchQueries" stroke={chartColors.warning} strokeWidth={2} name="搜索次数" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="内容分类分布">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* 用户行为分析 */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="用户行为分析">
                <div className="space-y-4">
                  {behaviorData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: Object.values(chartColors)[index] }}></div>
                        <span>{item.action}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">{item.count.toLocaleString()}</span>
                        <div className="w-20">
                          <Progress percent={item.percentage} size="small" showInfo={false} />
                        </div>
                        <span className="text-gray-500 w-8">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="热门内容 TOP5">
                <List
                  dataSource={contentStats.slice(0, 5)}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar className="bg-blue-500">{index + 1}</Avatar>}
                        title={
                          <div className="flex items-center justify-between">
                            <span className="text-blue-600">{item.title}</span>
                            {item.trend === 'up' && <RiseOutlined className="text-green-500" />}
                            {item.trend === 'down' && <FallOutlined className="text-red-500" />}
                          </div>
                        }
                        description={
                          <Space>
                            <span>浏览：{item.views.toLocaleString()}</span>
                            <span>评分：{item.rating}</span>
                            <Tag color="blue">{item.category}</Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
              </>
            )
          },
          {
            key: 'behavior',
            label: <span><UserOutlined />用户行为</span>,
            children: (
              <>
          <Row gutter={16} className="mb-6">
            <Col span={8}>
              <Card>
                <Statistic
                  title="日活跃用户"
                  value={485}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: chartColors.primary }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="用户留存率"
                  value={78.5}
                  precision={1}
                  prefix={<TeamOutlined />}
                  suffix="%"
                  valueStyle={{ color: chartColors.success }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="新用户占比"
                  value={23.2}
                  precision={1}
                  prefix={<GlobalOutlined />}
                  suffix="%"
                  valueStyle={{ color: chartColors.warning }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="用户活跃度趋势">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={usageStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(value) => dayjs(value).format('MM-DD')} />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area type="monotone" dataKey="uniqueUsers" stackId="1" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.6} name="独立用户" />
                <Area type="monotone" dataKey="searchQueries" stackId="1" stroke={chartColors.success} fill={chartColors.success} fillOpacity={0.6} name="搜索用户" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
              </>
            )
          },
          {
            key: 'content',
            label: <span><FileTextOutlined />内容分析</span>,
            children: (
              <>
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Card>
                <Statistic
                  title="总内容数"
                  value={1248}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: chartColors.primary }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="本月新增"
                  value={86}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: chartColors.success }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均评分"
                  value={4.6}
                  precision={1}
                  prefix={<StarOutlined />}
                  valueStyle={{ color: chartColors.warning }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="待审核"
                  value={12}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: chartColors.error }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="热门内容排行" extra={
            <Space>
              <Select defaultValue="views" style={{ width: 120 }}>
                <Option value="views">按浏览量</Option>
                <Option value="likes">按点赞数</Option>
                <Option value="rating">按评分</Option>
              </Select>
              <Button icon={<FilterOutlined />}>筛选</Button>
            </Space>
          }>
            <Table
              columns={contentColumns}
              dataSource={contentStats}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
              }}
            />
          </Card>
              </>
            )
          },
          {
            key: 'quality',
            label: <span><StarOutlined />质量分析</span>,
            children: (
              <>
          <Row gutter={16} className="mb-6">
            <Col span={12}>
              <Card title="质量指标趋势">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={qualityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke={chartColors.primary} strokeWidth={2} name="准确性" />
                    <Line type="monotone" dataKey="completeness" stroke={chartColors.success} strokeWidth={2} name="完整性" />
                    <Line type="monotone" dataKey="timeliness" stroke={chartColors.warning} strokeWidth={2} name="及时性" />
                    <Line type="monotone" dataKey="relevance" stroke={chartColors.purple} strokeWidth={2} name="相关性" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="质量雷达图">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { subject: '准确性', A: qualityMetrics[0]?.accuracy || 0, fullMark: 100 },
                    { subject: '完整性', A: qualityMetrics[0]?.completeness || 0, fullMark: 100 },
                    { subject: '及时性', A: qualityMetrics[0]?.timeliness || 0, fullMark: 100 },
                    { subject: '相关性', A: qualityMetrics[0]?.relevance || 0, fullMark: 100 },
                    { subject: '满意度', A: (qualityMetrics[0]?.satisfaction || 0) * 20, fullMark: 100 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="当前质量" dataKey="A" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card title="质量改进建议">
                <Timeline>
                  <Timeline.Item color="green">
                    <div className="font-medium">内容准确性提升</div>
                    <div className="text-gray-500">建议加强内容审核流程，提高信息准确性</div>
                  </Timeline.Item>
                  <Timeline.Item color="blue">
                    <div className="font-medium">完善内容标签</div>
                    <div className="text-gray-500">优化内容分类和标签体系，提高检索效率</div>
                  </Timeline.Item>
                  <Timeline.Item color="orange">
                    <div className="font-medium">及时更新机制</div>
                    <div className="text-gray-500">建立内容定期更新机制，确保信息时效性</div>
                  </Timeline.Item>
                  <Timeline.Item>
                    <div className="font-medium">用户反馈收集</div>
                    <div className="text-gray-500">完善用户反馈渠道，持续改进内容质量</div>
                  </Timeline.Item>
                </Timeline>
              </Card>
            </Col>
          </Row>
              </>
            )
          },
          {
            key: 'performance',
            label: <span><ThunderboltOutlined />系统性能</span>,
            children: (
              <>
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均响应时间"
                  value={165}
                  suffix="ms"
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: chartColors.primary }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="系统可用性"
                  value={99.8}
                  precision={1}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: chartColors.success }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="错误率"
                  value={0.2}
                  precision={1}
                  suffix="%"
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: chartColors.warning }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="并发用户数"
                  value={1250}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: chartColors.purple }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} className="mb-6">
            <Col span={12}>
              <Card title="响应时间趋势">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={systemPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="responseTime" stroke={chartColors.primary} strokeWidth={2} name="响应时间(ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="系统资源使用率">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={systemPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="cpuUsage" stackId="1" stroke={chartColors.error} fill={chartColors.error} fillOpacity={0.6} name="CPU使用率" />
                    <Area type="monotone" dataKey="memoryUsage" stackId="2" stroke={chartColors.warning} fill={chartColors.warning} fillOpacity={0.6} name="内存使用率" />
                    <Area type="monotone" dataKey="diskUsage" stackId="3" stroke={chartColors.success} fill={chartColors.success} fillOpacity={0.6} name="磁盘使用率" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Card title="性能优化建议">
            <Row gutter={16}>
              <Col span={8}>
                <div className="text-center p-4 border rounded">
                  <ThunderboltOutlined className="text-2xl text-blue-500 mb-2" />
                  <div className="font-medium mb-2">响应时间优化</div>
                  <div className="text-gray-500 text-sm">优化数据库查询，使用缓存机制</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center p-4 border rounded">
                  <SafetyOutlined className="text-2xl text-green-500 mb-2" />
                  <div className="font-medium mb-2">系统稳定性</div>
                  <div className="text-gray-500 text-sm">增加监控告警，提升系统可靠性</div>
                </div>
              </Col>
              <Col span={8}>
                <div className="text-center p-4 border rounded">
                  <FundOutlined className="text-2xl text-purple-500 mb-2" />
                  <div className="font-medium mb-2">资源优化</div>
                  <div className="text-gray-500 text-sm">合理分配系统资源，提高利用率</div>
                </div>
              </Col>
            </Row>
          </Card>
              </>
            )
          },
          {
            key: 'alerts',
            label: <span><BellOutlined />实时告警</span>,
            children: (
              <>
          <Row gutter={16} className="mb-6">
            <Col span={6}>
              <Card>
                <Statistic
                  title="活跃告警"
                  value={alerts.filter(alert => alert.status === 'active').length}
                  prefix={<BellOutlined />}
                  valueStyle={{ color: chartColors.error }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="严重告警"
                  value={alerts.filter(alert => alert.level === 'critical' && alert.status === 'active').length}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: chartColors.error }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="今日已解决"
                  value={alerts.filter(alert => alert.status === 'resolved' && dayjs(alert.timestamp).isAfter(dayjs().startOf('day'))).length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: chartColors.success }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="平均处理时间"
                  value={2.5}
                  precision={1}
                  suffix="小时"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: chartColors.warning }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="告警列表" extra={
            <Space>
              <Select defaultValue="all" style={{ width: 120 }}>
                <Option value="all">全部状态</Option>
                <Option value="active">活跃</Option>
                <Option value="resolved">已解决</Option>
              </Select>
              <Select defaultValue="all" style={{ width: 120 }}>
                <Option value="all">全部级别</Option>
                <Option value="critical">严重</Option>
                <Option value="error">错误</Option>
                <Option value="warning">警告</Option>
                <Option value="info">信息</Option>
              </Select>
            </Space>
          }>
            <Table
              columns={alertColumns}
              dataSource={alerts}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
              }}
            />
          </Card>
              </>
            )
          }
        ]}
      />

      {/* 报告生成模态框 */}
      <Modal
        title="生成分析报告"
        open={reportModalVisible}
        onCancel={() => {
          setReportModalVisible(false);
          reportForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={reportForm}
          layout="vertical"
          onFinish={handleGenerateReport}
        >
          <Form.Item name="reportType" label="报告类型" rules={[{ required: true, message: '请选择报告类型' }]}>
            <Select placeholder="请选择报告类型">
              <Option value="usage">使用情况报告</Option>
              <Option value="content">内容分析报告</Option>
              <Option value="quality">质量评估报告</Option>
              <Option value="performance">性能监控报告</Option>
              <Option value="comprehensive">综合分析报告</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="dateRange" label="时间范围" rules={[{ required: true, message: '请选择时间范围' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="format" label="报告格式" rules={[{ required: true, message: '请选择报告格式' }]}>
            <Select placeholder="请选择报告格式">
              <Option value="pdf">PDF格式</Option>
              <Option value="excel">Excel格式</Option>
              <Option value="word">Word格式</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="email" label="接收邮箱">
            <Input placeholder="请输入接收邮箱，留空则发送到当前用户邮箱" />
          </Form.Item>
          
          <Form.Item name="description" label="报告说明">
            <TextArea rows={3} placeholder="请输入报告说明（可选）" />
          </Form.Item>
          
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                setReportModalVisible(false);
                reportForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                生成报告
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 告警详情模态框 */}
      <Modal
        title="告警详情"
        open={alertModalVisible}
        onCancel={() => {
          setAlertModalVisible(false);
          setCurrentAlert(null);
        }}
        footer={[
          <Button key="close" onClick={() => setAlertModalVisible(false)}>
            关闭
          </Button>,
          currentAlert?.status === 'active' && (
            <Button key="resolve" type="primary" onClick={() => {
              handleResolveAlert(currentAlert.id);
              setAlertModalVisible(false);
            }}>
              标记为已解决
            </Button>
          )
        ]}
        width={600}
      >
        {currentAlert && (
          <div>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Badge 
                  status={currentAlert.level === 'critical' ? 'error' : currentAlert.level === 'error' ? 'error' : currentAlert.level === 'warning' ? 'warning' : 'processing'} 
                />
                <span className="font-medium text-lg ml-2">{currentAlert.title}</span>
                <Tag color={currentAlert.type === 'performance' ? 'blue' : currentAlert.type === 'quality' ? 'green' : currentAlert.type === 'security' ? 'red' : 'orange'} className="ml-2">
                  {currentAlert.type === 'performance' ? '性能' : currentAlert.type === 'quality' ? '质量' : currentAlert.type === 'security' ? '安全' : '使用'}
                </Tag>
              </div>
              <div className="text-gray-600">{currentAlert.description}</div>
            </div>
            
            <Divider />
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">告警级别：</span>
                <Tag color={currentAlert.level === 'critical' ? 'red' : currentAlert.level === 'error' ? 'red' : currentAlert.level === 'warning' ? 'orange' : 'blue'}>
                  {currentAlert.level === 'critical' ? '严重' : currentAlert.level === 'error' ? '错误' : currentAlert.level === 'warning' ? '警告' : '信息'}
                </Tag>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">发生时间：</span>
                <span>{currentAlert.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">当前状态：</span>
                <Badge 
                  status={currentAlert.status === 'active' ? 'processing' : currentAlert.status === 'resolved' ? 'success' : 'default'} 
                  text={currentAlert.status === 'active' ? '活跃' : currentAlert.status === 'resolved' ? '已解决' : '已忽略'} 
                />
              </div>
              {currentAlert.affectedUsers && (
                <div className="flex justify-between">
                  <span className="text-gray-500">影响用户：</span>
                  <span>{currentAlert.affectedUsers}人</span>
                </div>
              )}
            </div>
            
            <Divider />
            
            <div>
              <div className="font-medium mb-2">处理建议：</div>
              <div className="bg-gray-50 p-3 rounded">
                {currentAlert.type === 'performance' && '建议检查服务器性能，优化数据库查询，或增加服务器资源。'}
                {currentAlert.type === 'quality' && '建议加强内容审核流程，提高内容质量标准。'}
                {currentAlert.type === 'security' && '建议立即检查安全日志，加强访问控制和安全防护。'}
                {currentAlert.type === 'usage' && '建议分析用户行为变化，检查系统功能是否正常。'}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AnalyticsPage;