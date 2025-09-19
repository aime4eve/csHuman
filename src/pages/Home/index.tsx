/**
 * 知识门户首页 - 导航面板、工作台、统计仪表板
 * @author 伍志勇
 */
import React from 'react';
import { Row, Col, Card, Statistic, List, Avatar, Button, Typography, Space, Tag, Progress } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  FileTextOutlined,
  EyeOutlined,
  LikeOutlined,
  ClockCircleOutlined,
  RightOutlined,
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from '../../store';
import { mockKnowledgeList, mockStatistics } from '../../data/mockData';

const { Title, Text } = Typography;

/**
 * 快捷操作卡片组件
 */
const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, description, icon, onClick }) => (
  <Card 
    hoverable 
    className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg"
    onClick={onClick}
    styles={{ body: { padding: '20px' } }}
  >
    <div className="flex items-center space-x-4">
      <div className="text-2xl text-blue-500">{icon}</div>
      <div className="flex-1">
        <Title level={5} className="mb-1">{title}</Title>
        <Text type="secondary" className="text-sm">{description}</Text>
      </div>
      <RightOutlined className="text-gray-400" />
    </div>
  </Card>
);

/**
 * 统计卡片组件
 */
const StatCard: React.FC<{
  title: string;
  value: number;
  suffix?: string;
  prefix?: React.ReactNode;
  valueStyle?: React.CSSProperties;
}> = ({ title, value, suffix, prefix, valueStyle }) => (
  <Card className="text-center">
    <Statistic
      title={title}
      value={value}
      suffix={suffix}
      prefix={prefix}
      valueStyle={valueStyle}
    />
  </Card>
);

/**
 * 知识门户首页组件
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useGlobalStore();

  // 最近活动数据
  const recentActivities = [
    { user: '张工程师', action: '创建了《React开发规范》', time: '2分钟前' },
    { user: '李部长', action: '审核通过《API设计标准》', time: '15分钟前' },
    { user: '王审核员', action: '更新了《数据库设计指南》', time: '1小时前' },
    { user: '系统管理员', action: '发布了《安全开发规范》', time: '2小时前' },
    { user: '陈工程师', action: '评论了《项目管理流程》', time: '3小时前' },
    { user: '刘设计师', action: '上传了《UI设计规范》', time: '4小时前' }
  ];

  // 快捷操作配置
  const quickActions = [
    {
      title: '创建知识',
      description: '添加新的知识内容',
      icon: <PlusOutlined />,
      onClick: () => navigate('/content')
    },
    {
      title: '知识分类',
      description: '管理知识分类体系',
      icon: <BookOutlined />,
      onClick: () => navigate('/category')
    },
    {
      title: '内容审核',
      description: '审核待发布内容',
      icon: <CheckCircleOutlined />,
      onClick: () => navigate('/audit')
    },
    {
      title: '智能搜索',
      description: '快速检索知识内容',
      icon: <EditOutlined />,
      onClick: () => navigate('/search')
    }
  ];

  // 获取待办事项状态
  const getPendingTasks = () => {
    return [
      { title: '待审核文档', count: 12, type: 'warning' },
      { title: '即将过期', count: 3, type: 'error' },
      { title: '需要更新', count: 8, type: 'info' }
    ];
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* 欢迎区域 */}
      <div className="mb-6">
        <Title level={2} className="mb-2">
          欢迎回来，{user?.name || '用户'}！
        </Title>
        <Text type="secondary" className="text-base">
          今天是 {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </Text>
      </div>

      {/* 统计概览 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="知识总数"
            value={mockStatistics.overview.totalKnowledge}
            prefix={<BookOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="今日访问"
            value={mockStatistics.overview.todayViews}
            prefix={<EyeOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="活跃用户"
            value={mockStatistics.overview.totalUsers}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="本周增长"
            value={mockStatistics.overview.weeklyGrowth}
            suffix="%"
            prefix={<PlusOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 左侧内容 */}
        <Col xs={24} lg={16}>
          {/* 快捷操作 */}
          <Card title="快捷操作" className="mb-4">
            <Row gutter={[16, 16]}>
              {quickActions.map((action, index) => (
                <Col xs={24} sm={12} key={index}>
                  <QuickActionCard {...action} />
                </Col>
              ))}
            </Row>
          </Card>

          {/* 热门知识 */}
          <Card 
            title="热门知识" 
            extra={<Button type="link" onClick={() => navigate('/search')}>查看更多</Button>}
          >
            <List
              itemLayout="horizontal"
              dataSource={mockKnowledgeList.slice(0, 5)}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<FileTextOutlined />} />}
                    title={item.title}
                    description={
                      <Space>
                        <Text type="secondary">分类：{item.category}</Text>
                        <Text type="secondary">作者：{item.creator}</Text>
                        <Text type="secondary">
                          <ClockCircleOutlined /> {item.updatedAt}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 右侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 待办事项 */}
          <Card title="待办事项" className="mb-4">
            <Space direction="vertical" className="w-full">
              {getPendingTasks().map((task, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <Space>
                    <ExclamationCircleOutlined 
                      className={`text-${task.type === 'error' ? 'red' : task.type === 'warning' ? 'orange' : 'blue'}-500`} 
                    />
                    <Text>{task.title}</Text>
                  </Space>
                  <Tag color={task.type}>{task.count}</Tag>
                </div>
              ))}
            </Space>
            <Button type="primary" block className="mt-4" onClick={() => navigate('/audit')}>
              查看全部
            </Button>
          </Card>

          {/* 知识库健康度 */}
          <Card title="知识库健康度" className="mb-4">
            <Space direction="vertical" className="w-full">
              <div>
                <div className="flex justify-between mb-2">
                  <Text>内容完整性</Text>
                  <Text>85%</Text>
                </div>
                <Progress percent={85} status="active" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Text>更新及时性</Text>
                  <Text>72%</Text>
                </div>
                <Progress percent={72} status="active" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Text>用户活跃度</Text>
                  <Text>91%</Text>
                </div>
                <Progress percent={91} status="active" />
              </div>
            </Space>
          </Card>

          {/* 最近活动 */}
          <Card 
            title="最近活动" 
            extra={<Button type="link" onClick={() => navigate('/analytics')}>查看更多</Button>}
          >
            <List
              size="small"
              dataSource={recentActivities.slice(0, 6)}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar size="small" icon={<UserOutlined />} />}
                    title={item.user}
                    description={
                      <div>
                        <Text type="secondary" className="text-xs">{item.action}</Text>
                        <br />
                        <Text type="secondary" className="text-xs">{item.time}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;