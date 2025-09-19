import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Upload,
  TreeSelect,
  DatePicker,
  Tooltip,
  Popconfirm,
  Badge,
  Drawer,
  Timeline,
  Progress,
  Steps,
  Alert,
  Divider,
  App,
  Row,
  Col,
  Statistic,
  Tabs
} from 'antd';
import * as XLSX from 'xlsx';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  FolderOutlined,
  TagOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  CopyOutlined,
  ShareAltOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
// const { TabPane } = Tabs; // 已废弃，使用 items 属性替代
const { RangePicker } = DatePicker;

// 类型定义
interface KnowledgeContent {
  id: string;
  title: string;
  content: string;
  category: string;
  categoryName: string;
  tags: string[];
  status: 'draft' | 'pending' | 'published' | 'expired' | 'archived';
  author: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiredAt?: string;
  viewCount: number;
  downloadCount: number;
  version: string;
  fileSize?: number;
  fileType?: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  isPublic: boolean;
}

interface ContentCategory {
  value: string;
  title: string;
  children?: ContentCategory[];
}

interface ContentVersion {
  id: string;
  version: string;
  author: string;
  createdAt: string;
  description: string;
  changes: string[];
  status: string;
}

/**
 * 内容管理页面
 * 作者：伍志勇
 */
const ContentPage: React.FC = () => {
  // 状态管理
  const { message } = App.useApp();
  const [contents, setContents] = useState<KnowledgeContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  
  // 模态框状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isVersionModalVisible, setIsVersionModalVisible] = useState(false);
  const [editingContent, setEditingContent] = useState<KnowledgeContent | null>(null);
  const [viewingVersions, setViewingVersions] = useState<ContentVersion[]>([]);
  
  // 表单实例
  const [form] = Form.useForm();
  
  // 分类树数据
  const categoryTreeData: ContentCategory[] = [
    {
      value: 'business',
      title: '业务维度',
      children: [
        { value: 'presales', title: '售前支持' },
        { value: 'development', title: '产品研发' },
        { value: 'delivery', title: '项目交付' },
        { value: 'operation', title: '运营维护' },
        { value: 'hr', title: '人力资源' }
      ]
    },
    {
      value: 'knowledge',
      title: '知识形态',
      children: [
        { value: 'document', title: '文档规范' },
        { value: 'faq', title: 'FAQ问答' },
        { value: 'code', title: '代码资产' },
        { value: 'process', title: '流程制度' },
        { value: 'training', title: '培训资料' }
      ]
    },
    {
      value: 'permission',
      title: '权限维度',
      children: [
        { value: 'public', title: '公开内容' },
        { value: 'internal', title: '内部资料' },
        { value: 'confidential', title: '机密文档' },
        { value: 'secret', title: '绝密资料' }
      ]
    }
  ];

  // 模拟数据
  const mockContents: KnowledgeContent[] = [
    {
      id: '1',
      title: '企业级知识库管理规范',
      content: '详细的知识库管理规范文档...',
      category: 'document',
      categoryName: '文档规范',
      tags: ['管理规范', '知识库', '企业级'],
      status: 'published',
      author: 'user1',
      authorName: '张三',
      createdAt: '2024-01-15 09:00:00',
      updatedAt: '2024-01-20 14:30:00',
      publishedAt: '2024-01-20 15:00:00',
      expiredAt: '2025-01-20 15:00:00',
      viewCount: 1250,
      downloadCount: 89,
      version: 'v2.1',
      fileSize: 2048576,
      fileType: 'PDF',
      description: '企业知识库的标准化管理流程和规范要求',
      priority: 'high',
      isPublic: false
    },
    {
      id: '2',
      title: '技术架构设计指南',
      content: '系统技术架构的设计原则和最佳实践...',
      category: 'development',
      categoryName: '产品研发',
      tags: ['技术架构', '设计指南', '最佳实践'],
      status: 'published',
      author: 'user2',
      authorName: '李四',
      createdAt: '2024-01-10 10:30:00',
      updatedAt: '2024-01-18 16:45:00',
      publishedAt: '2024-01-18 17:00:00',
      viewCount: 890,
      downloadCount: 67,
      version: 'v1.5',
      fileSize: 1536000,
      fileType: 'DOCX',
      description: '面向开发团队的技术架构设计规范',
      priority: 'high',
      isPublic: true
    },
    {
      id: '3',
      title: '客户服务FAQ集合',
      content: '常见客户问题及标准回答...',
      category: 'faq',
      categoryName: 'FAQ问答',
      tags: ['客户服务', 'FAQ', '标准回答'],
      status: 'pending',
      author: 'user3',
      authorName: '王五',
      createdAt: '2024-01-22 11:15:00',
      updatedAt: '2024-01-22 11:15:00',
      viewCount: 45,
      downloadCount: 3,
      version: 'v1.0',
      fileSize: 512000,
      fileType: 'MD',
      description: '客户服务部门整理的常见问题解答',
      priority: 'medium',
      isPublic: true
    },
    {
      id: '4',
      title: '项目交付标准流程',
      content: '项目从启动到交付的完整流程...',
      category: 'process',
      categoryName: '流程制度',
      tags: ['项目管理', '交付流程', '标准化'],
      status: 'draft',
      author: 'user4',
      authorName: '赵六',
      createdAt: '2024-01-25 14:20:00',
      updatedAt: '2024-01-25 16:30:00',
      viewCount: 12,
      downloadCount: 0,
      version: 'v0.8',
      fileSize: 768000,
      fileType: 'PDF',
      description: '项目交付的标准化操作流程',
      priority: 'medium',
      isPublic: false
    },
    {
      id: '5',
      title: '安全管理制度',
      content: '企业信息安全管理相关制度...',
      category: 'confidential',
      categoryName: '机密文档',
      tags: ['安全管理', '制度规范', '机密'],
      status: 'expired',
      author: 'user5',
      authorName: '孙七',
      createdAt: '2023-06-15 09:00:00',
      updatedAt: '2023-12-20 10:30:00',
      publishedAt: '2023-12-20 11:00:00',
      expiredAt: '2024-01-20 11:00:00',
      viewCount: 234,
      downloadCount: 15,
      version: 'v3.2',
      fileSize: 1024000,
      fileType: 'DOCX',
      description: '企业信息安全管理的核心制度文件',
      priority: 'high',
      isPublic: false
    }
  ];

  // 版本历史模拟数据
  const mockVersions: ContentVersion[] = [
    {
      id: 'v1',
      version: 'v2.1',
      author: '张三',
      createdAt: '2024-01-20 14:30:00',
      description: '更新权限管理章节，增加三级权限架构说明',
      changes: ['新增三级权限架构图', '更新权限矩阵表格', '修正部分错别字'],
      status: 'current'
    },
    {
      id: 'v2',
      version: 'v2.0',
      author: '张三',
      createdAt: '2024-01-18 10:15:00',
      description: '重构文档结构，增加最佳实践章节',
      changes: ['重新组织章节结构', '增加最佳实践建议', '更新技术架构图'],
      status: 'archived'
    },
    {
      id: 'v3',
      version: 'v1.5',
      author: '李四',
      createdAt: '2024-01-15 16:45:00',
      description: '修复安全漏洞，更新API文档',
      changes: ['修复权限验证漏洞', '更新API接口文档', '优化性能配置'],
      status: 'archived'
    }
  ];

  // 初始化数据
  useEffect(() => {
    loadContents();
  }, []);

  // 加载内容列表
  const loadContents = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setContents(mockContents);
    } catch (error) {
      message.error('加载内容失败');
    } finally {
      setLoading(false);
    }
  };

  // 状态标签渲染
  const renderStatusTag = (status: string) => {
    const statusConfig = {
      draft: { color: 'default', text: '草稿' },
      pending: { color: 'processing', text: '待审核' },
      published: { color: 'success', text: '已发布' },
      expired: { color: 'warning', text: '已过期' },
      archived: { color: 'default', text: '已归档' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 优先级标签渲染
  const renderPriorityTag = (priority: string) => {
    const priorityConfig = {
      low: { color: 'green', text: '低' },
      medium: { color: 'orange', text: '中' },
      high: { color: 'red', text: '高' }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns: ColumnsType<KnowledgeContent> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div className="font-medium text-blue-600 cursor-pointer hover:text-blue-800"
               onClick={() => handleView(record)}>
            {text}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {record.description}
          </div>
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'category',
      width: 120,
      render: (text) => (
        <Tag icon={<FolderOutlined />} color="blue">{text}</Tag>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <div>
          {tags.slice(0, 2).map(tag => (
            <Tag key={tag} color="geekblue">{tag}</Tag>
          ))}
          {tags.length > 2 && (
            <Tooltip title={tags.slice(2).join(', ')}>
              <Tag>+{tags.length - 2}</Tag>
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatusTag
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: renderPriorityTag
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      key: 'author',
      width: 100,
      render: (text) => (
        <div className="flex items-center">
          <UserOutlined className="mr-1" />
          {text}
        </div>
      )
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (text, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => handleViewVersions(record)}
        >
          {text}
        </Button>
      )
    },
    {
      title: '统计',
      key: 'stats',
      width: 120,
      render: (_, record) => (
        <div className="text-xs">
          <div>浏览: {record.viewCount}</div>
          <div>下载: {record.downloadCount}</div>
        </div>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (text) => (
        <div className="text-xs">
          <div>{dayjs(text).format('YYYY-MM-DD')}</div>
          <div className="text-gray-500">{dayjs(text).format('HH:mm:ss')}</div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button 
              type="text" 
              icon={<CopyOutlined />} 
              size="small"
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              size="small"
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个内容吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 过滤数据
  const filteredContents = contents.filter(content => {
    const matchSearch = !searchText || 
      content.title.toLowerCase().includes(searchText.toLowerCase()) ||
      content.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      content.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchCategory = !filterCategory || content.category === filterCategory;
    const matchStatus = !filterStatus || content.status === filterStatus;
    
    let matchDateRange = true;
    if (filterDateRange) {
      const contentDate = dayjs(content.updatedAt);
      matchDateRange = contentDate.isAfter(filterDateRange[0]) && 
                      contentDate.isBefore(filterDateRange[1]);
    }
    
    return matchSearch && matchCategory && matchStatus && matchDateRange;
  });

  // 事件处理函数
  const handleCreate = () => {
    setEditingContent(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (content: KnowledgeContent) => {
    setEditingContent(content);
    form.setFieldsValue({
      ...content,
      expiredAt: content.expiredAt ? dayjs(content.expiredAt) : null
    });
    setIsModalVisible(true);
  };

  const handleView = (content: KnowledgeContent) => {
    Modal.info({
      title: content.title,
      width: 800,
      content: (
        <div className="mt-4">
          <div className="mb-4">
            <Space>
              {renderStatusTag(content.status)}
              {renderPriorityTag(content.priority)}
              <Tag color="blue">{content.categoryName}</Tag>
              {content.isPublic && <Tag color="green">公开</Tag>}
            </Space>
          </div>
          <div className="mb-4">
            <strong>描述：</strong>{content.description}
          </div>
          <div className="mb-4">
            <strong>标签：</strong>
            {content.tags.map(tag => (
              <Tag key={tag} className="ml-1">{tag}</Tag>
            ))}
          </div>
          <div className="mb-4">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="浏览次数" value={content.viewCount} />
              </Col>
              <Col span={8}>
                <Statistic title="下载次数" value={content.downloadCount} />
              </Col>
              <Col span={8}>
                <Statistic title="当前版本" value={content.version} />
              </Col>
            </Row>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600 mb-2">内容预览：</div>
            <div className="text-sm">{content.content}</div>
          </div>
        </div>
      )
    });
  };

  const handleCopy = (content: KnowledgeContent) => {
    const newContent = {
      ...content,
      id: Date.now().toString(),
      title: `${content.title} (副本)`,
      status: 'draft' as const,
      version: 'v1.0',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      viewCount: 0,
      downloadCount: 0
    };
    setContents([newContent, ...contents]);
    message.success('内容复制成功');
  };

  const handleDownload = (content: KnowledgeContent) => {
    // 模拟下载
    message.success(`正在下载 ${content.title}`);
    // 更新下载次数
    setContents(contents.map(c => 
      c.id === content.id 
        ? { ...c, downloadCount: c.downloadCount + 1 }
        : c
    ));
  };

  const handleDelete = (id: string) => {
    setContents(contents.filter(c => c.id !== id));
    message.success('删除成功');
  };

  const handleViewVersions = (content: KnowledgeContent) => {
    setViewingVersions(mockVersions);
    setIsVersionModalVisible(true);
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的内容');
      return;
    }
    
    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个内容吗？`,
      onOk: () => {
        setContents(contents.filter(c => !selectedRowKeys.includes(c.id)));
        setSelectedRowKeys([]);
        message.success('批量删除成功');
      }
    });
  };

  const handleBatchPublish = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要发布的内容');
      return;
    }
    
    setContents(contents.map(c => 
      selectedRowKeys.includes(c.id) && c.status === 'draft'
        ? { ...c, status: 'pending' as const }
        : c
    ));
    setSelectedRowKeys([]);
    message.success('批量提交审核成功');
  };

  const handleFormSubmit = async (values: any) => {
    try {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      
      if (editingContent) {
        // 编辑模式
        const updatedContent = {
          ...editingContent,
          ...values,
          expiredAt: values.expiredAt ? values.expiredAt.format('YYYY-MM-DD HH:mm:ss') : null,
          updatedAt: now,
          version: `v${parseFloat(editingContent.version.substring(1)) + 0.1}`.substring(0, 4)
        };
        setContents(contents.map(c => c.id === editingContent.id ? updatedContent : c));
        message.success('内容更新成功');
      } else {
        // 新建模式
        const newContent: KnowledgeContent = {
          id: Date.now().toString(),
          ...values,
          expiredAt: values.expiredAt ? values.expiredAt.format('YYYY-MM-DD HH:mm:ss') : null,
          author: 'current_user',
          authorName: '当前用户',
          createdAt: now,
          updatedAt: now,
          viewCount: 0,
          downloadCount: 0,
          version: 'v1.0',
          categoryName: getCategoryName(values.category)
        };
        setContents([newContent, ...contents]);
        message.success('内容创建成功');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getCategoryName = (categoryValue: string): string => {
    for (const category of categoryTreeData) {
      if (category.children) {
        const found = category.children.find(child => child.value === categoryValue);
        if (found) return found.title;
      }
    }
    return categoryValue;
  };

  // 批量导入相关状态
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [importData, setImportData] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{success: number, failed: number, errors: string[]}>({success: 0, failed: 0, errors: []});
  const [isImporting, setIsImporting] = useState(false);

  // 批量导入模板数据
  const importTemplate = [
    {
      title: '示例标题1',
      content: '这是示例内容描述...',
      category: 'development',
      tags: '技术文档,开发指南',
      priority: 'high',
      isPublic: 'true',
      description: '这是内容的简要描述'
    },
    {
      title: '示例标题2', 
      content: '这是另一个示例内容...',
      category: 'management',
      tags: '管理制度,流程规范',
      priority: 'medium',
      isPublic: 'false',
      description: '管理相关的内容描述'
    }
  ];

  // 下载导入模板
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(importTemplate);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '导入模板');
    XLSX.writeFile(wb, '内容批量导入模板.xlsx');
    message.success('模板下载成功');
  };

  // 验证导入数据
  const validateImportData = (data: any[]) => {
    const errors: string[] = [];
    const validData: any[] = [];

    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      
      // 必填字段验证
      if (!row.title || row.title.trim() === '') {
        rowErrors.push('标题不能为空');
      }
      if (!row.content || row.content.trim() === '') {
        rowErrors.push('内容不能为空');
      }
      if (!row.category || row.category.trim() === '') {
        rowErrors.push('分类不能为空');
      }

      // 分类验证
      const validCategories = ['development', 'management', 'marketing', 'finance', 'hr', 'permission'];
      if (row.category && !validCategories.includes(row.category)) {
        rowErrors.push('分类值无效');
      }

      // 优先级验证
      const validPriorities = ['high', 'medium', 'low'];
      if (row.priority && !validPriorities.includes(row.priority)) {
        rowErrors.push('优先级值无效');
      }

      // 公开性验证
      if (row.isPublic && !['true', 'false'].includes(row.isPublic.toString().toLowerCase())) {
        rowErrors.push('公开性值无效（应为true或false）');
      }

      if (rowErrors.length > 0) {
        errors.push(`第${index + 2}行: ${rowErrors.join(', ')}`);
      } else {
        validData.push({
          ...row,
          tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : [],
          isPublic: row.isPublic ? row.isPublic.toString().toLowerCase() === 'true' : true,
          priority: row.priority || 'medium'
        });
      }
    });

    return { validData, errors };
  };

  // 处理文件上传
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.error('文件内容为空');
          return;
        }

        const { validData, errors } = validateImportData(jsonData);
        
        if (errors.length > 0) {
          Modal.error({
            title: '数据验证失败',
            content: (
              <div>
                <p>发现以下错误：</p>
                <ul style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {errors.map((error, index) => (
                    <li key={index} style={{ color: '#ff4d4f' }}>{error}</li>
                  ))}
                </ul>
                <p>请修正后重新上传。</p>
              </div>
            ),
            width: 600
          });
          return;
        }

        setImportData(validData);
        setImportStep(1);
        message.success(`成功解析 ${validData.length} 条数据`);
      } catch (error) {
        message.error('文件解析失败，请检查文件格式');
      }
    };

    reader.readAsArrayBuffer(file);
    return false; // 阻止默认上传行为
  };

  // 执行批量导入
  const handleBatchImport = async () => {
    setIsImporting(true);
    setImportStep(2);
    setImportProgress(0);
    
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (let i = 0; i < importData.length; i++) {
      try {
        const item = importData[i];
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
        
        // 模拟创建内容
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const newContent: KnowledgeContent = {
          id: Date.now().toString() + i,
          title: item.title,
          content: item.content,
          category: item.category,
          categoryName: getCategoryName(item.category),
          tags: item.tags,
          status: 'draft',
          author: 'current_user',
          authorName: '当前用户',
          createdAt: now,
          updatedAt: now,
          viewCount: 0,
          downloadCount: 0,
          version: 'v1.0',
          fileSize: item.content.length * 2,
          fileType: 'TEXT',
          description: item.description || '',
          priority: item.priority,
          isPublic: item.isPublic
        };
        
        setContents(prev => [newContent, ...prev]);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`第${i + 1}条数据导入失败: ${importData[i].title}`);
      }
      
      setImportProgress(Math.round(((i + 1) / importData.length) * 100));
    }
    
    setImportResults(results);
    setImportStep(3);
    setIsImporting(false);
    
    if (results.success > 0) {
      message.success(`成功导入 ${results.success} 条数据`);
    }
    if (results.failed > 0) {
      message.warning(`${results.failed} 条数据导入失败`);
    }
  };

  // 重置导入状态
  const resetImportState = () => {
    setImportStep(0);
    setImportData([]);
    setImportProgress(0);
    setImportResults({success: 0, failed: 0, errors: []});
    setIsImporting(false);
  };

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls,.csv',
    beforeUpload: handleFileUpload,
    showUploadList: false
  };

  // 统计数据
  const stats = {
    total: contents.length,
    published: contents.filter(c => c.status === 'published').length,
    pending: contents.filter(c => c.status === 'pending').length,
    draft: contents.filter(c => c.status === 'draft').length,
    expired: contents.filter(c => c.status === 'expired').length
  };

  return (
    <div className="p-6">
      {/* 页面标题和统计 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">内容管理</h1>
            <p className="text-gray-600 mt-1">管理企业知识库中的所有内容资源</p>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新建内容
            </Button>
            <Space>
              <Button 
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
              >
                下载模板
              </Button>
              <Button 
                icon={<UploadOutlined />}
                onClick={() => setImportModalVisible(true)}
              >
                批量导入
              </Button>
            </Space>
          </Space>
        </div>
        
        {/* 统计卡片 */}
        <Row gutter={16} className="mb-6">
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="总内容数" 
                value={stats.total} 
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="已发布" 
                value={stats.published} 
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="待审核" 
                value={stats.pending} 
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="草稿" 
                value={stats.draft} 
                prefix={<EditOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic 
                title="已过期" 
                value={stats.expired} 
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {((stats.published / stats.total) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">发布率</div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索标题、描述或标签"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={setSearchText}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <TreeSelect
              placeholder="选择分类"
              allowClear
              treeData={categoryTreeData}
              value={filterCategory}
              onChange={setFilterCategory}
              className="w-full"
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="状态筛选"
              allowClear
              value={filterStatus}
              onChange={setFilterStatus}
              className="w-full"
            >
              <Option value="draft">草稿</Option>
              <Option value="pending">待审核</Option>
              <Option value="published">已发布</Option>
              <Option value="expired">已过期</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </Col>
          <Col span={5}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={filterDateRange}
              onChange={setFilterDateRange}
              className="w-full"
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadContents}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText('');
                  setFilterCategory('');
                  setFilterStatus('');
                  setFilterDateRange(null);
                }}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 批量操作 */}
      {selectedRowKeys.length > 0 && (
        <Card className="mb-4">
          <div className="flex justify-between items-center">
            <span>已选择 {selectedRowKeys.length} 项</span>
            <Space>
              <Button onClick={handleBatchPublish}>
                批量提交审核
              </Button>
              <Button danger onClick={handleBatchDelete}>
                批量删除
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* 内容列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredContents}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            total: filteredContents.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status === 'published'
            })
          }}
        />
      </Card>

      {/* 新建/编辑模态框 */}
      <Modal
        title={editingContent ? '编辑内容' : '新建内容'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={{
            status: 'draft',
            priority: 'medium',
            isPublic: false
          }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="请输入内容标题" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <TreeSelect
                  placeholder="选择分类"
                  treeData={categoryTreeData}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={2} placeholder="请输入内容描述" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={6} placeholder="请输入详细内容" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="tags"
                label="标签"
              >
                <Select
                  mode="tags"
                  placeholder="输入标签，按回车添加"
                  tokenSeparators={[',', ' ']}
                >
                  <Option value="技术文档">技术文档</Option>
                  <Option value="业务流程">业务流程</Option>
                  <Option value="管理制度">管理制度</Option>
                  <Option value="培训资料">培训资料</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
              >
                <Select>
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="expiredAt"
                label="过期时间"
              >
                <DatePicker 
                  className="w-full"
                  placeholder="选择过期时间"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
              >
                <Select>
                  <Option value="draft">草稿</Option>
                  <Option value="pending">提交审核</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isPublic"
                label="是否公开"
                valuePropName="checked"
              >
                <input type="checkbox" className="mr-2" />
                <span>允许公开访问</span>
              </Form.Item>
            </Col>
          </Row>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              {editingContent ? '更新' : '创建'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 版本历史模态框 */}
      <Modal
        title="版本历史"
        open={isVersionModalVisible}
        onCancel={() => setIsVersionModalVisible(false)}
        footer={null}
        width={700}
      >
        <Timeline>
          {viewingVersions.map((version, index) => (
            <Timeline.Item
              key={version.id}
              color={index === 0 ? 'green' : 'blue'}
              dot={index === 0 ? <CheckCircleOutlined /> : <HistoryOutlined />}
            >
              <div className="mb-2">
                <Space>
                  <strong>{version.version}</strong>
                  {index === 0 && <Badge status="success" text="当前版本" />}
                  <span className="text-gray-500">by {version.author}</span>
                </Space>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {dayjs(version.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </div>
              <div className="mb-2">{version.description}</div>
              <div className="text-xs">
                <strong>变更内容：</strong>
                <ul className="mt-1 ml-4">
                  {version.changes.map((change, idx) => (
                    <li key={idx} className="list-disc">{change}</li>
                  ))}
                </ul>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Modal>

      {/* 批量导入模态框 */}
      <Modal
        title="批量导入内容"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          resetImportState();
        }}
        footer={null}
        width={800}
        maskClosable={false}
      >
        <div className="mb-4">
          <Steps
            current={importStep}
            items={[
              {
                title: '上传文件',
                description: '选择Excel或CSV文件'
              },
              {
                title: '预览数据',
                description: '确认导入内容'
              },
              {
                title: '导入进度',
                description: '批量创建内容'
              },
              {
                title: '完成',
                description: '查看导入结果'
              }
            ]}
          />
        </div>

        <Divider />

        {/* 步骤1: 文件上传 */}
        {importStep === 0 && (
          <div className="text-center py-8">
            <Alert
              message="导入说明"
              description={
                <div>
                  <p>1. 请先下载导入模板，按照模板格式填写数据</p>
                  <p>2. 支持 .xlsx、.xls、.csv 格式文件</p>
                  <p>3. 必填字段：标题、内容、分类</p>
                  <p>4. 分类值：development、management、marketing、finance、hr、permission</p>
                  <p>5. 优先级值：high、medium、low</p>
                </div>
              }
              type="info"
              showIcon
              className="mb-6 text-left"
            />
            
            <Upload.Dragger {...uploadProps} className="mb-4">
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 Excel (.xlsx, .xls) 和 CSV 格式文件
              </p>
            </Upload.Dragger>
            
            <Button 
              type="link" 
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载导入模板
            </Button>
          </div>
        )}

        {/* 步骤2: 数据预览 */}
        {importStep === 1 && (
          <div>
            <Alert
              message={`共解析到 ${importData.length} 条数据，请确认后开始导入`}
              type="success"
              showIcon
              className="mb-4"
            />
            
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              <Table
                dataSource={importData.slice(0, 10)} // 只显示前10条预览
                rowKey={(record, index) => `preview-${index}`}
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
                columns={[
                  {
                    title: '标题',
                    dataIndex: 'title',
                    width: 200,
                    ellipsis: true
                  },
                  {
                    title: '分类',
                    dataIndex: 'category',
                    width: 100
                  },
                  {
                    title: '标签',
                    dataIndex: 'tags',
                    width: 150,
                    render: (tags) => tags?.join(', ') || '-'
                  },
                  {
                    title: '优先级',
                    dataIndex: 'priority',
                    width: 80
                  },
                  {
                    title: '公开',
                    dataIndex: 'isPublic',
                    width: 60,
                    render: (isPublic) => isPublic ? '是' : '否'
                  },
                  {
                    title: '描述',
                    dataIndex: 'description',
                    ellipsis: true
                  }
                ]}
              />
            </div>
            
            {importData.length > 10 && (
              <div className="text-center mt-2 text-gray-500">
                仅显示前10条数据预览，实际将导入 {importData.length} 条数据
              </div>
            )}
            
            <div className="flex justify-end mt-4 space-x-2">
              <Button onClick={() => setImportStep(0)}>上一步</Button>
              <Button type="primary" onClick={handleBatchImport}>开始导入</Button>
            </div>
          </div>
        )}

        {/* 步骤3: 导入进度 */}
        {importStep === 2 && (
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="text-lg mb-2">正在导入数据...</div>
              <Progress 
                percent={importProgress} 
                status={isImporting ? 'active' : 'success'}
                size="default"
              />
            </div>
            <div className="text-gray-500">
              请耐心等待，导入过程中请勿关闭窗口
            </div>
          </div>
        )}

        {/* 步骤4: 导入结果 */}
        {importStep === 3 && (
          <div className="py-4">
            <div className="text-center mb-6">
              <div className="text-lg font-semibold mb-2">导入完成</div>
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="成功导入"
                      value={importResults.success}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="导入失败"
                      value={importResults.failed}
                      valueStyle={{ color: '#ff4d4f' }}
                      prefix={<ExclamationCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="总计"
                      value={importResults.success + importResults.failed}
                      prefix={<FileTextOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
            
            {importResults.errors.length > 0 && (
              <div className="mb-4">
                <Alert
                  message="部分数据导入失败"
                  description={
                    <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                      <ul>
                        {importResults.errors.map((error, index) => (
                          <li key={index} className="text-red-500">{error}</li>
                        ))}
                      </ul>
                    </div>
                  }
                  type="warning"
                  showIcon
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button onClick={() => {
                setImportModalVisible(false);
                resetImportState();
              }}>
                关闭
              </Button>
              <Button type="primary" onClick={() => {
                setImportModalVisible(false);
                resetImportState();
                loadContents(); // 刷新列表
              }}>
                完成
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContentPage;