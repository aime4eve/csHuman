/**
 * 内容提炼工作台页面 - 支持文档摘要和结构化提取
 * @author 伍志勇
 */
import React, { useState, useRef } from 'react';
import {
  Layout,
  Card,
  Button,
  Upload,
  Input,
  Select,
  Tabs,
  Table,
  Tag,
  Progress,
  Space,
  Typography,
  Divider,
  Alert,
  List,
  Avatar,
  Tooltip,
  Modal,
  Form,
  Radio,
  Checkbox,
  App,
  Spin,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Steps,
  Timeline,
  Badge,
  Drawer
} from 'antd';
import {
  UploadOutlined,
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ExportOutlined,
  SettingOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { UploadProps, TableColumnsType } from 'antd';

const { Content } = Layout;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// 提炼任务类型定义
interface ExtractionTask {
  id: string;
  name: string;
  type: 'summary' | 'keywords' | 'entities' | 'structure' | 'qa';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  inputFile: string;
  outputData?: any;
  createdAt: Date;
  completedAt?: Date;
  duration?: number;
}

// 提炼模板类型定义
interface ExtractionTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  config: any;
  isDefault: boolean;
}

// 文档信息类型定义
interface DocumentInfo {
  name: string;
  size: number;
  type: string;
  content?: string;
}

/**
 * 内容提炼工作台页面组件
 */
const ExtractionPage: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // 文档相关状态
  const [currentDocument, setCurrentDocument] = useState<DocumentInfo | null>(null);
  
  // 提炼配置状态
  const [extractionType, setExtractionType] = useState<string>('summary');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // 任务管理状态
  const [tasks, setTasks] = useState<ExtractionTask[]>([]);
  const [activeTab, setActiveTab] = useState<string>('extraction');
  
  // 模板管理状态
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([]);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  
  // 预览相关状态
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');

  // 初始化模拟数据
  React.useEffect(() => {
    // 模拟提炼模板
    const mockTemplates: ExtractionTemplate[] = [
      {
        id: '1',
        name: '文档摘要',
        type: 'summary',
        description: '提取文档的核心内容和关键信息',
        config: { maxLength: 500, includeKeywords: true },
        isDefault: true
      },
      {
        id: '2',
        name: '关键词提取',
        type: 'keywords',
        description: '识别文档中的重要关键词和术语',
        config: { maxKeywords: 20, minFrequency: 2 },
        isDefault: true
      },
      {
        id: '3',
        name: '实体识别',
        type: 'entities',
        description: '识别文档中的人名、地名、机构名等实体',
        config: { entityTypes: ['PERSON', 'ORG', 'GPE'] },
        isDefault: false
      }
    ];

    setTemplates(mockTemplates);

    // 模拟提炼任务
    const mockTasks: ExtractionTask[] = [
      {
        id: '1',
        name: '产品需求文档摘要',
        type: 'summary',
        status: 'completed',
        progress: 100,
        inputFile: 'product_requirements.pdf',
        outputData: {
          summary: '本文档描述了新产品的核心功能需求...',
          keywords: ['产品需求', '功能设计', '用户体验']
        },
        createdAt: new Date('2024-01-15 10:30:00'),
        completedAt: new Date('2024-01-15 10:32:15'),
        duration: 135
      },
      {
        id: '2',
        name: '技术文档关键词提取',
        type: 'keywords',
        status: 'running',
        progress: 65,
        inputFile: 'technical_spec.docx',
        createdAt: new Date('2024-01-15 11:00:00')
      },
      {
        id: '3',
        name: '合同实体识别',
        type: 'entities',
        status: 'pending',
        progress: 0,
        inputFile: 'contract.pdf',
        createdAt: new Date('2024-01-15 11:15:00')
      }
    ];

    setTasks(mockTasks);
  }, []);

  /**
   * 文件上传处理
   * @author 伍志勇
   */
  const handleFileUpload: UploadProps['customRequest'] = (options) => {
    const { file, onSuccess, onError } = options;
    
    // 模拟文件上传
    setTimeout(() => {
      try {
        const fileInfo: DocumentInfo = {
          name: (file as File).name,
          size: (file as File).size,
          type: (file as File).type,
          content: '这是模拟的文档内容...'
        };
        
        setCurrentDocument(fileInfo);
        message.success(`文件 "${fileInfo.name}" 上传成功`);
        onSuccess?.(fileInfo);
      } catch (error) {
        message.error('文件上传失败');
        onError?.(error as Error);
      }
    }, 1000);
  };

  /**
   * 开始提炼任务
   * @author 伍志勇
   */
  const handleStartExtraction = () => {
    if (!currentDocument) {
      message.warning('请先上传文档');
      return;
    }

    const newTask: ExtractionTask = {
      id: Date.now().toString(),
      name: `${currentDocument.name} - ${extractionType}`,
      type: extractionType as any,
      status: 'running',
      progress: 0,
      inputFile: currentDocument.name,
      createdAt: new Date()
    };

    setTasks(prev => [newTask, ...prev]);
    message.success('提炼任务已开始');

    // 模拟任务进度
    let progress = 0;
    const timer = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        
        setTasks(prev => prev.map(task => 
          task.id === newTask.id 
            ? { 
                ...task, 
                status: 'completed', 
                progress: 100,
                completedAt: new Date(),
                duration: Math.floor(Math.random() * 120) + 30,
                outputData: {
                  summary: '这是模拟的提炼结果...',
                  keywords: ['关键词1', '关键词2', '关键词3']
                }
              }
            : task
        ));
        
        message.success('提炼任务完成');
      } else {
        setTasks(prev => prev.map(task => 
          task.id === newTask.id ? { ...task, progress } : task
        ));
      }
    }, 500);
  };

  /**
   * 删除任务处理函数
   * @author 伍志勇
   * @param taskId 任务ID
   */
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    message.success('任务已删除');
  };

  /**
   * 编辑模板处理函数
   * @author 伍志勇
   * @param templateId 模板ID
   */
  const handleEditTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      message.info(`编辑模板: ${template.name}`);
      // 这里可以打开编辑模态框
      setTemplateModalVisible(true);
    }
  };

  /**
   * 删除模板处理函数
   * @author 伍志勇
   * @param templateId 模板ID
   */
  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      if (template.isDefault) {
        message.warning('默认模板不能删除');
        return;
      }
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      message.success(`模板 "${template.name}" 已删除`);
    }
  };

  /**
   * 预览结果
   * @author 伍志勇
   */
  const handlePreviewResult = (task: ExtractionTask) => {
    if (task.outputData) {
      setPreviewContent(JSON.stringify(task.outputData, null, 2));
      setPreviewModalVisible(true);
    }
  };

  // 任务表格列定义
  const taskColumns: TableColumnsType<ExtractionTask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <FileTextOutlined />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          summary: { text: '摘要', color: 'blue' },
          keywords: { text: '关键词', color: 'green' },
          entities: { text: '实体', color: 'orange' },
          structure: { text: '结构化', color: 'purple' },
          qa: { text: '问答', color: 'cyan' }
        };
        const config = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: { text: '等待中', color: 'default', icon: <ClockCircleOutlined /> },
          running: { text: '运行中', color: 'processing', icon: <PlayCircleOutlined /> },
          completed: { text: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
          failed: { text: '失败', color: 'error', icon: <ExclamationCircleOutlined /> }
        };
        const config = statusMap[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress, record) => (
        <Progress 
          percent={progress} 
          size="small" 
          status={record.status === 'failed' ? 'exception' : undefined}
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date.toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'completed' && (
            <Tooltip title="预览结果">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                onClick={() => handlePreviewResult(record)}
              />
            </Tooltip>
          )}
          {record.status === 'completed' && (
            <Tooltip title="下载结果">
              <Button type="text" icon={<DownloadOutlined />} />
            </Tooltip>
          )}
          <Tooltip title="删除任务">
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              danger 
              onClick={() => handleDeleteTask(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 标签页配置
  const tabItems = [
    {
      key: 'upload',
      label: '文档上传',
      children: (
        <div style={{ padding: '24px' }}>
          <Card title="上传文档" style={{ marginBottom: 24 }}>
            <Upload.Dragger
              name="file"
              multiple={false}
              customRequest={handleFileUpload}
              showUploadList={false}
              accept=".pdf,.doc,.docx,.txt"
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 PDF、Word、TXT 格式文档
              </p>
            </Upload.Dragger>
            
            {currentDocument && (
              <Alert
                message="文档已上传"
                description={`文件名: ${currentDocument.name} | 大小: ${(currentDocument.size / 1024).toFixed(2)} KB`}
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </Card>

          <Card title="提炼配置">
            <Form form={form} layout="vertical">
              <Form.Item label="提炼类型">
                <Select 
                  value={extractionType} 
                  onChange={setExtractionType}
                  style={{ width: '100%' }}
                >
                  <Option value="summary">文档摘要</Option>
                  <Option value="keywords">关键词提取</Option>
                  <Option value="entities">实体识别</Option>
                  <Option value="structure">结构化提取</Option>
                  <Option value="qa">问答生成</Option>
                </Select>
              </Form.Item>
              
              <Form.Item label="自定义提示词（可选）">
                <TextArea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="输入自定义的提炼要求..."
                  rows={4}
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartExtraction}
                  disabled={!currentDocument}
                  loading={loading}
                >
                  开始提炼
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      )
    },
    {
      key: 'tasks',
      label: '任务管理',
      children: (
        <div style={{ padding: '24px' }}>
          <Card 
            title="提炼任务" 
            extra={
              <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
                刷新
              </Button>
            }
          >
            <Table
              columns={taskColumns}
              dataSource={tasks}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      )
    },
    {
      key: 'templates',
      label: '模板管理',
      children: (
        <div style={{ padding: '24px' }}>
          <Card 
            title="提炼模板" 
            extra={
              <Button type="primary" icon={<SettingOutlined />}>
                新建模板
              </Button>
            }
          >
            <List
              dataSource={templates}
              renderItem={(template) => (
                <List.Item
                  key={template.id}
                  extra={
                    <Space>
                      <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        size="small" 
                        onClick={() => handleEditTemplate(template.id)}
                        title="编辑模板"
                      />
                      <Button 
                        type="text" 
                        icon={<DeleteOutlined />} 
                        size="small" 
                        danger 
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="删除模板"
                      />
                    </Space>
                  }
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<BulbOutlined />} />}
                    title={
                      <Space>
                        {template.name}
                        {template.isDefault && <Tag color="blue">默认</Tag>}
                      </Space>
                    }
                    description={template.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ marginBottom: 24 }}>
            <BulbOutlined style={{ marginRight: 8 }} />
            内容提炼工作台
          </Title>
          
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </div>

        {/* 模板编辑模态框 */}
        <Modal
          title="编辑模板"
          open={templateModalVisible}
          onCancel={() => setTemplateModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="模板名称" name="name">
              <Input placeholder="输入模板名称" />
            </Form.Item>
            <Form.Item label="模板描述" name="description">
              <TextArea placeholder="输入模板描述" rows={3} />
            </Form.Item>
            <Form.Item label="模板配置" name="config">
              <TextArea placeholder="输入JSON格式的配置" rows={6} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary">保存</Button>
                <Button onClick={() => setTemplateModalVisible(false)}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 结果预览模态框 */}
        <Modal
          title="提炼结果预览"
          open={previewModalVisible}
          onCancel={() => setPreviewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setPreviewModalVisible(false)}>
              关闭
            </Button>,
            <Button key="download" type="primary" icon={<DownloadOutlined />}>
              下载结果
            </Button>
          ]}
          width={800}
        >
          <pre style={{ 
            background: '#f5f5f5', 
            padding: 16, 
            borderRadius: 4,
            maxHeight: 400,
            overflow: 'auto'
          }}>
            {previewContent}
          </pre>
        </Modal>
      </Content>
    </Layout>
  );
};

export default ExtractionPage;