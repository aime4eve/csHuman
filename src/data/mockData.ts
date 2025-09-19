/**
 * Mock数据 - 用于演示和开发
 * @author 伍志勇
 */
import { User, Knowledge } from '../store';

// Mock用户数据
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    name: '系统管理员',
    email: 'admin@company.com',
    role: 'admin',
    department: '信息技术部',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
  },
  {
    id: '2',
    username: 'dept_manager',
    name: '张部长',
    email: 'zhang@company.com',
    role: 'department_admin',
    department: '产品研发部',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang'
  },
  {
    id: '3',
    username: 'contributor1',
    name: '李工程师',
    email: 'li@company.com',
    role: 'contributor',
    department: '技术架构部',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li'
  },
  {
    id: '4',
    username: 'auditor1',
    name: '王审核员',
    email: 'wang@company.com',
    role: 'auditor',
    department: '质量管理部',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang'
  },
  {
    id: '5',
    username: 'consumer1',
    name: '赵员工',
    email: 'zhao@company.com',
    role: 'consumer',
    department: '市场营销部',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao'
  }
];

// Mock知识内容数据
export const mockKnowledge: Knowledge[] = [
  {
    id: '1',
    title: 'React开发规范指南',
    content: '本文档详细介绍了React项目的开发规范，包括组件设计、状态管理、性能优化等方面的最佳实践...',
    status: 'published',
    category: '技术文档',
    tags: ['React', '前端开发', '规范'],
    creator: '李工程师',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    expireDate: '2025-01-15'
  },
  {
    id: '2',
    title: 'API接口设计标准',
    content: 'RESTful API设计原则和规范，包括URL设计、HTTP状态码使用、错误处理等...',
    status: 'published',
    category: '技术架构',
    tags: ['API', '后端开发', '设计规范'],
    creator: '张部长',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    expireDate: '2025-01-10'
  },
  {
    id: '3',
    title: '数据库设计最佳实践',
    content: '数据库表结构设计、索引优化、查询性能调优等方面的经验总结...',
    status: 'review',
    category: '技术文档',
    tags: ['数据库', 'MySQL', '性能优化'],
    creator: '李工程师',
    createdAt: '2024-01-22',
    updatedAt: '2024-01-22'
  },
  {
    id: '4',
    title: '项目管理流程规范',
    content: '敏捷开发流程、需求管理、版本控制等项目管理相关规范...',
    status: 'draft',
    category: '流程制度',
    tags: ['项目管理', '敏捷开发', '流程'],
    creator: '王审核员',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: '5',
    title: '安全开发指南',
    content: '应用安全开发规范，包括输入验证、身份认证、权限控制等安全措施...',
    status: 'expired',
    category: '安全规范',
    tags: ['安全', '开发规范', '权限控制'],
    creator: '系统管理员',
    createdAt: '2023-06-15',
    updatedAt: '2023-12-20',
    expireDate: '2024-01-15'
  }
];

// 导出别名以兼容不同页面的导入
export const mockKnowledgeList = mockKnowledge;

// Mock分类数据 - 嵌套结构（用于分类管理页面）
export const mockCategories = [
  {
    key: 'business',
    title: '业务维度',
    children: [
      { key: 'presales', title: '售前支持', count: 15 },
      { key: 'development', title: '产品研发', count: 32 },
      { key: 'delivery', title: '项目交付', count: 28 },
      { key: 'operation', title: '运营维护', count: 19 },
      { key: 'hr', title: '人力资源', count: 12 }
    ]
  },
  {
    key: 'knowledge',
    title: '知识形态',
    children: [
      { key: 'document', title: '文档规范', count: 45 },
      { key: 'faq', title: 'FAQ问答', count: 23 },
      { key: 'code', title: '代码资产', count: 18 },
      { key: 'process', title: '流程制度', count: 16 },
      { key: 'training', title: '培训资料', count: 14 }
    ]
  },
  {
    key: 'permission',
    title: '权限维度',
    children: [
      { key: 'public', title: '公开内容', count: 67 },
      { key: 'internal', title: '内部资料', count: 34 },
      { key: 'confidential', title: '机密文档', count: 15 },
      { key: 'secret', title: '绝密资料', count: 5 }
    ]
  }
];

// Mock分类数据 - 扁平结构（用于内容管理页面的下拉框）
export const mockCategoriesFlat = [
  // 业务维度
  { id: 'presales', name: '售前支持' },
  { id: 'development', name: '产品研发' },
  { id: 'delivery', name: '项目交付' },
  { id: 'operation', name: '运营维护' },
  { id: 'hr', name: '人力资源' },
  // 知识形态
  { id: 'document', name: '文档规范' },
  { id: 'faq', name: 'FAQ问答' },
  { id: 'code', name: '代码资产' },
  { id: 'process', name: '流程制度' },
  { id: 'training', name: '培训资料' },
  // 权限维度
  { id: 'public', name: '公开内容' },
  { id: 'internal', name: '内部资料' },
  { id: 'confidential', name: '机密文档' },
  { id: 'secret', name: '绝密资料' }
];

// Mock统计数据
export const mockStatistics = {
  overview: {
    totalKnowledge: 156,
    totalUsers: 89,
    todayViews: 234,
    weeklyGrowth: 12.5
  },
  categoryStats: [
    { name: '技术文档', value: 45, color: '#1890ff' },
    { name: '流程制度', value: 32, color: '#52c41a' },
    { name: '培训资料', value: 28, color: '#faad14' },
    { name: 'FAQ问答', value: 23, color: '#f5222d' },
    { name: '代码资产', value: 18, color: '#722ed1' },
    { name: '其他', value: 10, color: '#13c2c2' }
  ],
  viewTrends: [
    { date: '2024-01-15', views: 120, downloads: 45 },
    { date: '2024-01-16', views: 135, downloads: 52 },
    { date: '2024-01-17', views: 148, downloads: 38 },
    { date: '2024-01-18', views: 162, downloads: 61 },
    { date: '2024-01-19', views: 178, downloads: 47 },
    { date: '2024-01-20', views: 195, downloads: 55 },
    { date: '2024-01-21', views: 234, downloads: 68 }
  ],
  hotContent: [
    { title: 'React开发规范指南', views: 1250, category: '技术文档' },
    { title: 'API接口设计标准', views: 980, category: '技术架构' },
    { title: '数据库设计最佳实践', views: 756, category: '技术文档' },
    { title: '项目管理流程规范', views: 623, category: '流程制度' },
    { title: '安全开发指南', views: 445, category: '安全规范' }
  ]
};

// Mock权限配置
export const mockPermissions = {
  roles: [
    { key: 'admin', name: '系统管理员', description: '拥有系统全部权限', userCount: 2 },
    { key: 'department_admin', name: '部门管理员', description: '管理部门内知识和用户', userCount: 8 },
    { key: 'contributor', name: '知识贡献者', description: '创建和编辑知识内容', userCount: 35 },
    { key: 'auditor', name: '审核专员', description: '审核和发布知识内容', userCount: 12 },
    { key: 'consumer', name: '知识消费者', description: '浏览和下载知识内容', userCount: 156 }
  ],
  departments: [
    { key: 'tech', name: '技术部', userCount: 45, knowledgeCount: 89 },
    { key: 'product', name: '产品部', userCount: 23, knowledgeCount: 34 },
    { key: 'marketing', name: '市场部', userCount: 18, knowledgeCount: 21 },
    { key: 'hr', name: '人事部', userCount: 12, knowledgeCount: 15 },
    { key: 'finance', name: '财务部', userCount: 8, knowledgeCount: 7 }
  ]
};

// Mock审核数据
export const mockAuditData = {
  pendingItems: [
    {
      id: '1',
      title: 'React开发规范指南',
      type: '技术文档',
      submitter: '李工程师',
      submitTime: '2024-01-20 14:30',
      priority: 'high',
      status: 'pending',
      deadline: '2024-01-25 18:00',
      history: [
        {
          action: '提交审核',
          user: '李工程师',
          time: '2024-01-20 14:30',
          comment: '初次提交，请审核'
        }
      ]
    },
    {
      id: '2',
      title: 'API接口设计标准',
      type: '技术架构',
      submitter: '张部长',
      submitTime: '2024-01-20 10:15',
      priority: 'medium',
      status: 'pending',
      deadline: '2024-01-23 18:00',
      history: [
        {
          action: '提交审核',
          user: '张部长',
          time: '2024-01-20 10:15',
          comment: '更新API设计规范，请审核'
        }
      ]
    },
    {
      id: '3',
      title: '数据库设计最佳实践',
      type: '技术文档',
      submitter: '李工程师',
      submitTime: '2024-01-19 16:45',
      priority: 'low',
      status: 'reviewing',
      deadline: '2024-01-22 18:00',
      history: [
        {
          action: '提交审核',
          user: '李工程师',
          time: '2024-01-19 16:45',
          comment: '数据库设计文档，请审核'
        },
        {
          action: '开始审核',
          user: '王审核员',
          time: '2024-01-20 09:00',
          comment: '开始审核此文档'
        }
      ]
    }
  ],
  statistics: {
    total: 15,
    pending: 8,
    approved: 5,
    rejected: 2
  }
};

// 导出别名以兼容不同页面的导入
export const mockAuditItems = mockAuditData.pendingItems;
export const mockRoles = mockPermissions.roles;

// 默认登录用户
export const defaultUser: User = {
  id: '1',
  username: 'admin',
  name: '系统管理员',
  email: 'admin@company.com',
  role: 'admin' as const,
  avatar: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20business%20avatar%20portrait&image_size=square',
  department: '技术部',
  permissions: ['read', 'write', 'delete', 'admin']
};

/**
 * Mock数据模块
 * 作者：伍志勇
 * 提供系统各模块的演示数据
 */