/**
 * 训练数据管理页面
 * @author 伍志勇
 */
import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Typography,
  Row,
  Col,
  Button,
  Space,
  Table,
  Tag,
  Progress,
  Statistic,
  Tabs,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Drawer,
  List,
  Avatar,
  Badge,
  Tooltip,
  Popconfirm,
  App,
  Alert,
  Steps,
  Timeline,
  Descriptions,
  Radio,
  Slider,
  Divider,
  Empty,
  Result,
  Spin
} from 'antd';
import {
  DatabaseOutlined,
  UploadOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  TagsOutlined,
  RobotOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  ReloadOutlined,
  FilterOutlined,
  SearchOutlined,
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  BulbOutlined,
  StarOutlined,
  HeartOutlined,
  LikeOutlined,
  DislikeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
// const { TabPane } = Tabs; // 已废弃，使用 items 属性替代
const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// 训练样本数据类型定义
interface TrainingSample {
  id: string;
  content: string;
  label: string;
  category: string;
  quality: 'high' | 'medium' | 'low';
  status: 'pending' | 'labeled' | 'reviewed' | 'approved' | 'rejected';
  annotator: string;
  reviewer?: string;
  createTime: string;
  updateTime: string;
  confidence: number;
  tags: string[];
  metadata: Record<string, any>;
}

// 标注任务类型定义
interface AnnotationTask {
  id: string;
  name: string;
  description: string;
  type: 'classification' | 'ner' | 'sentiment' | 'qa' | 'summarization';
  status: 'created' | 'in_progress' | 'completed' | 'paused';
  assignee: string;
  totalSamples: number;
  completedSamples: number;
  accuracy: number;
  createTime: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
}

// 模型训练任务类型定义
interface TrainingTask {
  id: string;
  name: string;
  modelType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  progress: number;
  accuracy: number;
  loss: number;
  epochs: number;
  currentEpoch: number;
  startTime: string;
  endTime?: string;
  duration: string;
  datasetSize: number;
  hyperparameters: Record<string, any>;
  metrics: Record<string, number>;
}

// 模型评估结果类型定义
interface EvaluationResult {
  id: string;
  modelId: string;
  modelName: string;
  testDataset: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  evaluationTime: string;
  sampleCount: number;
  errorAnalysis: {
    category: string;
    count: number;
    examples: string[];
  }[];
}

// 模拟训练样本数据
const mockTrainingSamples: TrainingSample[] = [
  {
    id: 'sample_1',
    content: '如何使用人工智能技术提升客户服务质量？',
    label: '技术咨询',
    category: 'question',
    quality: 'high',
    status: 'approved',
    annotator: '张三',
    reviewer: '李四',
    createTime: '2024-01-15 10:30:00',
    updateTime: '2024-01-15 14:20:00',
    confidence: 0.95,
    tags: ['AI', '客户服务', '技术'],
    metadata: {
      source: 'customer_inquiry',
      difficulty: 'medium',
      domain: 'technology'
    }
  },
  {
    id: 'sample_2',
    content: '请介绍一下深度学习在自然语言处理中的应用',
    label: '知识问答',
    category: 'question',
    quality: 'high',
    status: 'labeled',
    annotator: '王五',
    createTime: '2024-01-16 09:15:00',
    updateTime: '2024-01-16 11:45:00',
    confidence: 0.88,
    tags: ['深度学习', 'NLP', '应用'],
    metadata: {
      source: 'knowledge_base',
      difficulty: 'high',
      domain: 'ai'
    }
  },
  {
    id: 'sample_3',
    content: '系统登录失败，提示用户名或密码错误',
    label: '技术支持',
    category: 'issue',
    quality: 'medium',
    status: 'pending',
    annotator: '赵六',
    createTime: '2024-01-17 14:20:00',
    updateTime: '2024-01-17 14:20:00',
    confidence: 0.72,
    tags: ['登录', '错误', '支持'],
    metadata: {
      source: 'support_ticket',
      difficulty: 'low',
      domain: 'technical'
    }
  },
  {
    id: 'sample_4',
    content: '产品价格策略如何制定？需要考虑哪些因素？',
    label: '业务咨询',
    category: 'question',
    quality: 'high',
    status: 'reviewed',
    annotator: '孙七',
    reviewer: '周八',
    createTime: '2024-01-18 16:10:00',
    updateTime: '2024-01-18 17:30:00',
    confidence: 0.91,
    tags: ['价格', '策略', '业务'],
    metadata: {
      source: 'business_inquiry',
      difficulty: 'medium',
      domain: 'business'
    }
  },
  {
    id: 'sample_5',
    content: '数据备份和恢复的最佳实践是什么？',
    label: '技术咨询',
    category: 'question',
    quality: 'medium',
    status: 'rejected',
    annotator: '吴九',
    reviewer: '郑十',
    createTime: '2024-01-19 11:25:00',
    updateTime: '2024-01-19 15:40:00',
    confidence: 0.65,
    tags: ['备份', '恢复', '实践'],
    metadata: {
      source: 'technical_forum',
      difficulty: 'medium',
      domain: 'infrastructure'
    }
  }
];

// 模拟标注任务数据
const mockAnnotationTasks: AnnotationTask[] = [
  {
    id: 'task_1',
    name: '客户咨询分类标注',
    description: '对客户咨询内容进行分类标注，包括技术咨询、业务咨询、投诉建议等',
    type: 'classification',
    status: 'in_progress',
    assignee: '张三',
    totalSamples: 1000,
    completedSamples: 650,
    accuracy: 0.92,
    createTime: '2024-01-10 09:00:00',
    deadline: '2024-01-25 18:00:00',
    priority: 'high'
  },
  {
    id: 'task_2',
    name: '命名实体识别标注',
    description: '识别文本中的人名、地名、机构名等命名实体',
    type: 'ner',
    status: 'completed',
    assignee: '李四',
    totalSamples: 800,
    completedSamples: 800,
    accuracy: 0.89,
    createTime: '2024-01-05 10:30:00',
    deadline: '2024-01-20 17:00:00',
    priority: 'medium'
  },
  {
    id: 'task_3',
    name: '情感分析标注',
    description: '对用户评论进行情感倾向标注：正面、负面、中性',
    type: 'sentiment',
    status: 'created',
    assignee: '王五',
    totalSamples: 1200,
    completedSamples: 0,
    accuracy: 0,
    createTime: '2024-01-20 14:15:00',
    deadline: '2024-02-05 16:00:00',
    priority: 'low'
  }
];

// 模拟训练任务数据
const mockTrainingTasks: TrainingTask[] = [
  {
    id: 'train_1',
    name: '智能客服分类模型',
    modelType: 'BERT-Classification',
    status: 'running',
    progress: 75,
    accuracy: 0.91,
    loss: 0.23,
    epochs: 10,
    currentEpoch: 7,
    startTime: '2024-01-20 10:00:00',
    duration: '2小时15分钟',
    datasetSize: 5000,
    hyperparameters: {
      learning_rate: 0.001,
      batch_size: 32,
      max_length: 512
    },
    metrics: {
      train_accuracy: 0.94,
      val_accuracy: 0.91,
      train_loss: 0.18,
      val_loss: 0.23
    }
  },
  {
    id: 'train_2',
    name: '问答系统模型',
    modelType: 'T5-QA',
    status: 'completed',
    progress: 100,
    accuracy: 0.87,
    loss: 0.31,
    epochs: 15,
    currentEpoch: 15,
    startTime: '2024-01-18 09:30:00',
    endTime: '2024-01-19 14:20:00',
    duration: '4小时50分钟',
    datasetSize: 8000,
    hyperparameters: {
      learning_rate: 0.0005,
      batch_size: 16,
      max_length: 1024
    },
    metrics: {
      train_accuracy: 0.92,
      val_accuracy: 0.87,
      train_loss: 0.25,
      val_loss: 0.31
    }
  },
  {
    id: 'train_3',
    name: '文本摘要模型',
    modelType: 'BART-Summarization',
    status: 'failed',
    progress: 45,
    accuracy: 0.0,
    loss: 0.0,
    epochs: 8,
    currentEpoch: 3,
    startTime: '2024-01-19 16:00:00',
    duration: '1小时30分钟',
    datasetSize: 3000,
    hyperparameters: {
      learning_rate: 0.002,
      batch_size: 8,
      max_length: 2048
    },
    metrics: {
      train_accuracy: 0.0,
      val_accuracy: 0.0,
      train_loss: 0.0,
      val_loss: 0.0
    }
  }
];

// 模拟评估结果数据
const mockEvaluationResults: EvaluationResult[] = [
  {
    id: 'eval_1',
    modelId: 'train_2',
    modelName: '问答系统模型',
    testDataset: '测试集A',
    accuracy: 0.87,
    precision: 0.89,
    recall: 0.85,
    f1Score: 0.87,
    confusionMatrix: [[450, 50], [75, 425]],
    evaluationTime: '2024-01-19 15:30:00',
    sampleCount: 1000,
    errorAnalysis: [
      {
        category: '语义理解错误',
        count: 45,
        examples: ['复杂句式理解偏差', '多义词歧义']
      },
      {
        category: '知识覆盖不足',
        count: 30,
        examples: ['专业术语识别', '领域知识缺失']
      }
    ]
  },
  {
    id: 'eval_2',
    modelId: 'train_1',
    modelName: '智能客服分类模型',
    testDataset: '测试集B',
    accuracy: 0.91,
    precision: 0.93,
    recall: 0.89,
    f1Score: 0.91,
    confusionMatrix: [[380, 20], [45, 555]],
    evaluationTime: '2024-01-20 16:45:00',
    sampleCount: 1000,
    errorAnalysis: [
      {
        category: '边界案例',
        count: 35,
        examples: ['模糊分类边界', '多标签冲突']
      },
      {
        category: '数据质量',
        count: 30,
        examples: ['标注不一致', '样本噪声']
      }
    ]
  }
];

/**
 * 训练数据管理页面组件
 */
const TrainingDataPage: React.FC = () => {
  const { message } = App.useApp();
  const [trainingSamples, setTrainingSamples] = useState<TrainingSample[]>(mockTrainingSamples);
  const [annotationTasks, setAnnotationTasks] = useState<AnnotationTask[]>(mockAnnotationTasks);
  const [trainingTasks, setTrainingTasks] = useState<TrainingTask[]>(mockTrainingTasks);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>(mockEvaluationResults);
  const [selectedSample, setSelectedSample] = useState<TrainingSample | null>(null);
  const [showSampleDetail, setShowSampleDetail] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showAnnotationModal, setShowAnnotationModal] = useState<boolean>(false);
  const [showTrainingModal, setShowTrainingModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('samples');
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();

  // 样本状态统计
  const sampleStats = {
    total: trainingSamples.length,
    pending: trainingSamples.filter(s => s.status === 'pending').length,
    labeled: trainingSamples.filter(s => s.status === 'labeled').length,
    reviewed: trainingSamples.filter(s => s.status === 'reviewed').length,
    approved: trainingSamples.filter(s => s.status === 'approved').length,
    rejected: trainingSamples.filter(s => s.status === 'rejected').length
  };

  // 质量分布统计
  const qualityStats = {
    high: trainingSamples.filter(s => s.quality === 'high').length,
    medium: trainingSamples.filter(s => s.quality === 'medium').length,
    low: trainingSamples.filter(s => s.quality === 'low').length
  };

  // 样本表格列定义
  const sampleColumns: ColumnsType<TrainingSample> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id) => <Text code>{id}</Text>
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content) => (
        <Tooltip title={content}>
          <Text>{content.length > 50 ? `${content.substring(0, 50)}...` : content}</Text>
        </Tooltip>
      )
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'label',
      width: 120,
      render: (label) => <Tag color="blue">{label}</Tag>
    },
    {
      title: '质量',
      dataIndex: 'quality',
      key: 'quality',
      width: 80,
      render: (quality) => (
        <Tag color={quality === 'high' ? 'green' : quality === 'medium' ? 'orange' : 'red'}>
          {quality === 'high' ? '高' : quality === 'medium' ? '中' : '低'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          pending: { color: 'default', text: '待标注' },
          labeled: { color: 'processing', text: '已标注' },
          reviewed: { color: 'warning', text: '已审核' },
          approved: { color: 'success', text: '已通过' },
          rejected: { color: 'error', text: '已拒绝' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge status={config.color as any} text={config.text} />;
      }
    },
    {
      title: '标注员',
      dataIndex: 'annotator',
      key: 'annotator',
      width: 100
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (confidence) => (
        <Progress 
          percent={Math.round(confidence * 100)} 
          size="small" 
          status={confidence >= 0.8 ? 'success' : confidence >= 0.6 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
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
              onClick={() => handleViewSample(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEditSample(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除这个样本吗？"
              onConfirm={() => handleDeleteSample(record.id)}
            >
              <Button size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // 标注任务表格列定义
  const taskColumns: ColumnsType<AnnotationTask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const typeConfig = {
          classification: { color: 'blue', text: '分类' },
          ner: { color: 'green', text: '实体识别' },
          sentiment: { color: 'orange', text: '情感分析' },
          qa: { color: 'purple', text: '问答' },
          summarization: { color: 'cyan', text: '摘要' }
        };
        const config = typeConfig[type as keyof typeof typeConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          created: { color: 'default', text: '已创建' },
          in_progress: { color: 'processing', text: '进行中' },
          completed: { color: 'success', text: '已完成' },
          paused: { color: 'warning', text: '已暂停' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge status={config.color as any} text={config.text} />;
      }
    },
    {
      title: '进度',
      key: 'progress',
      width: 150,
      render: (_, record) => (
        <div>
          <Progress 
            percent={Math.round((record.completedSamples / record.totalSamples) * 100)} 
            size="small"
          />
          <Text style={{ fontSize: 12 }}>
            {record.completedSamples}/{record.totalSamples}
          </Text>
        </div>
      )
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      width: 100,
      render: (accuracy) => (
        <Text strong style={{ color: accuracy >= 0.9 ? '#52c41a' : accuracy >= 0.8 ? '#fa8c16' : '#ff4d4f' }}>
          {(accuracy * 100).toFixed(1)}%
        </Text>
      )
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 100
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 150,
      render: (deadline) => {
        const isOverdue = dayjs(deadline).isBefore(dayjs());
        return (
          <Text type={isOverdue ? 'danger' : 'secondary'}>
            {dayjs(deadline).format('YYYY-MM-DD HH:mm')}
          </Text>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'in_progress' ? (
            <Button size="small" icon={<PauseCircleOutlined />}>暂停</Button>
          ) : record.status === 'paused' ? (
            <Button size="small" icon={<PlayCircleOutlined />}>继续</Button>
          ) : (
            <Button size="small" icon={<PlayCircleOutlined />}>开始</Button>
          )}
        </Space>
      )
    }
  ];

  // 训练任务表格列定义
  const trainingColumns: ColumnsType<TrainingTask> = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>{record.modelType}</Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          pending: { color: 'default', text: '等待中', icon: <ClockCircleOutlined /> },
          running: { color: 'processing', text: '训练中', icon: <PlayCircleOutlined /> },
          completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
          failed: { color: 'error', text: '失败', icon: <ExclamationCircleOutlined /> },
          stopped: { color: 'warning', text: '已停止', icon: <StopOutlined /> }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Badge 
            status={config.color as any} 
            text={config.text}

          />
        );
      }
    },
    {
      title: '进度',
      key: 'progress',
      width: 150,
      render: (_, record) => (
        <div>
          <Progress percent={record.progress} size="small" />
          <Text style={{ fontSize: 12 }}>
            Epoch {record.currentEpoch}/{record.epochs}
          </Text>
        </div>
      )
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      width: 100,
      render: (accuracy) => (
        <Text strong style={{ color: accuracy >= 0.9 ? '#52c41a' : accuracy >= 0.8 ? '#fa8c16' : '#ff4d4f' }}>
          {accuracy > 0 ? `${(accuracy * 100).toFixed(1)}%` : '-'}
        </Text>
      )
    },
    {
      title: '损失',
      dataIndex: 'loss',
      key: 'loss',
      width: 100,
      render: (loss) => (
        <Text>{loss > 0 ? loss.toFixed(3) : '-'}</Text>
      )
    },
    {
      title: '数据集大小',
      dataIndex: 'datasetSize',
      key: 'datasetSize',
      width: 120,
      render: (size) => <Badge count={size} color="blue" />
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      width: 120
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'running' ? (
            <>
              <Button size="small" icon={<PauseCircleOutlined />}>暂停</Button>
              <Button size="small" icon={<StopOutlined />} danger>停止</Button>
            </>
          ) : record.status === 'completed' ? (
            <Button size="small" icon={<EyeOutlined />}>查看</Button>
          ) : (
            <Button size="small" icon={<PlayCircleOutlined />}>重新训练</Button>
          )}
        </Space>
      )
    }
  ];

  // 查看样本详情
  const handleViewSample = (sample: TrainingSample) => {
    setSelectedSample(sample);
    setShowSampleDetail(true);
  };

  // 编辑样本
  const handleEditSample = (sample: TrainingSample) => {
    form.setFieldsValue(sample);
    setSelectedSample(sample);
    setShowAnnotationModal(true);
  };

  // 删除样本
  const handleDeleteSample = (id: string) => {
    setTrainingSamples(prev => prev.filter(s => s.id !== id));
    // message.success('样本删除成功'); // 需要使用 App.useApp() 获取 message
  };

  // 批量导入样本
  const handleBatchImport = () => {
    setShowUploadModal(true);
  };

  // 创建标注任务
  const handleCreateAnnotationTask = () => {
    setShowAnnotationModal(true);
  };

  // 创建训练任务
  const handleCreateTrainingTask = () => {
    setShowTrainingModal(true);
  };

  // 文件上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.csv,.json,.txt',
    beforeUpload: (file) => {
      const isValidType = file.type === 'text/csv' || file.type === 'application/json' || file.type === 'text/plain';
      if (!isValidType) {
        message.error('只支持 CSV、JSON、TXT 格式文件！');
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB！');
      }
      return isValidType && isLt10M;
    },
    onChange: (info) => {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} 文件上传成功`);
      } else if (status === 'error') {
        message.error(`${info.file.name} 文件上传失败`);
      }
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
                      <DatabaseOutlined style={{ marginRight: 8, color: '#1677FF' }} />
                      训练数据管理
                    </Title>
                    <Text type="secondary">样本管理、标注工具、模型训练、效果评估</Text>
                  </Col>
                  <Col>
                    <Space>
                      <Button icon={<ImportOutlined />} onClick={handleBatchImport}>批量导入</Button>
                      <Button icon={<ExportOutlined />}>批量导出</Button>
                      <Button icon={<PlusOutlined />} type="primary" onClick={handleCreateAnnotationTask}>
                        创建标注任务
                      </Button>
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
                  title="总样本数"
                  value={sampleStats.total}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1677FF' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="已标注"
                  value={sampleStats.labeled + sampleStats.approved}
                  prefix={<TagsOutlined />}
                  valueStyle={{ color: '#52C41A' }}
                  suffix={`/ ${sampleStats.total}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="训练中"
                  value={trainingTasks.filter(t => t.status === 'running').length}
                  prefix={<RobotOutlined />}
                  valueStyle={{ color: '#FA8C16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="平均准确率"
                  value={87.5}
                  precision={1}
                  prefix={<BarChartOutlined />}
                  suffix="%"
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
                  key: 'samples',
                  label: '样本管理',
                  children: (
                    <>
                      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                        <Col xs={24} lg={18}>
                          <Space>
                            <Input.Search
                              placeholder="搜索样本内容或标签"
                              style={{ width: 300 }}
                              enterButton
                            />
                            <Select placeholder="状态筛选" style={{ width: 120 }}>
                              <Option value="all">全部状态</Option>
                              <Option value="pending">待标注</Option>
                              <Option value="labeled">已标注</Option>
                              <Option value="approved">已通过</Option>
                            </Select>
                            <Select placeholder="质量筛选" style={{ width: 120 }}>
                              <Option value="all">全部质量</Option>
                              <Option value="high">高质量</Option>
                              <Option value="medium">中质量</Option>
                              <Option value="low">低质量</Option>
                            </Select>
                          </Space>
                        </Col>
                        <Col xs={24} lg={6} style={{ textAlign: 'right' }}>
                          <Space>
                            <Button icon={<FilterOutlined />}>高级筛选</Button>
                            <Button icon={<ReloadOutlined />}>刷新</Button>
                          </Space>
                        </Col>
                      </Row>
                      
                      <Table
                        columns={sampleColumns}
                        dataSource={trainingSamples}
                        rowKey="id"
                        size="small"
                        scroll={{ x: 1200 }}
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showQuickJumper: true,
                          showTotal: (total) => `共 ${total} 条记录`
                        }}
                      />
                    </>
                  )
                },
                {
                  key: 'annotation',
                  label: '标注任务',
                  children: (
                    <>
                      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                        <Col span={24}>
                          <Alert
                            message="标注任务管理"
                            description="创建和管理数据标注任务，跟踪标注进度和质量"
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                          />
                        </Col>
                      </Row>
                      
                      <Table
                        columns={taskColumns}
                        dataSource={annotationTasks}
                        rowKey="id"
                        size="small"
                        pagination={{
                          pageSize: 10,
                          showTotal: (total) => `共 ${total} 个任务`
                        }}
                      />
                    </>
                  )
                },
                {
                  key: 'training',
                  label: '模型训练',
                  children: (
                    <>
                      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                        <Col span={18}>
                          <Alert
                            message="模型训练监控"
                            description="监控模型训练进度，查看训练指标和日志"
                            type="info"
                            showIcon
                          />
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                          <Button 
                            type="primary" 
                            icon={<ThunderboltOutlined />}
                            onClick={handleCreateTrainingTask}
                          >
                            创建训练任务
                          </Button>
                        </Col>
                      </Row>
                      
                      <Table
                        columns={trainingColumns}
                        dataSource={trainingTasks}
                        rowKey="id"
                        size="small"
                        scroll={{ x: 1200 }}
                        pagination={{
                          pageSize: 10,
                          showTotal: (total) => `共 ${total} 个训练任务`
                        }}
                      />
                    </>
                  )
                },
                {
                  key: 'evaluation',
                  label: '效果评估',
                  children: (
                    <Row gutter={[16, 16]}>
                      {evaluationResults.map(result => (
                        <Col xs={24} lg={12} key={result.id}>
                          <Card 
                            title={result.modelName}
                            extra={<Tag color="blue">{result.testDataset}</Tag>}
                            size="small"
                          >
                            <Row gutter={[16, 16]}>
                              <Col span={12}>
                                <Statistic
                                  title="准确率"
                                  value={result.accuracy * 100}
                                  precision={1}
                                  suffix="%"
                                  valueStyle={{ color: '#52c41a' }}
                                />
                              </Col>
                              <Col span={12}>
                                <Statistic
                                  title="F1分数"
                                  value={result.f1Score * 100}
                                  precision={1}
                                  suffix="%"
                                  valueStyle={{ color: '#1677ff' }}
                                />
                              </Col>
                              <Col span={12}>
                                <Statistic
                                  title="精确率"
                                  value={result.precision * 100}
                                  precision={1}
                                  suffix="%"
                                  valueStyle={{ color: '#fa8c16' }}
                                />
                              </Col>
                              <Col span={12}>
                                <Statistic
                                  title="召回率"
                                  value={result.recall * 100}
                                  precision={1}
                                  suffix="%"
                                  valueStyle={{ color: '#722ed1' }}
                                />
                              </Col>
                            </Row>
                            
                            <Divider style={{ margin: '16px 0' }} />
                            
                            <div>
                              <Text strong>错误分析</Text>
                              <List
                                size="small"
                                style={{ marginTop: 8 }}
                                dataSource={result.errorAnalysis}
                                renderItem={error => (
                                  <List.Item>
                                    <div style={{ width: '100%' }}>
                                      <Row justify="space-between">
                                        <Text>{error.category}</Text>
                                        <Badge count={error.count} color="red" />
                                      </Row>
                                      <div style={{ marginTop: 4 }}>
                                        {error.examples.map((example, index) => (
                                          <Tag key={index}>{example}</Tag>
                                        ))}
                                      </div>
                                    </div>
                                  </List.Item>
                                )}
                              />
                            </div>
                            
                            <div style={{ marginTop: 16, textAlign: 'right' }}>
                              <Space>
                                <Button size="small" icon={<LineChartOutlined />}>详细报告</Button>
                                <Button size="small" icon={<DownloadOutlined />}>导出结果</Button>
                              </Space>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )
                }
              ]}
            />
          </Card>
        </div>
      </Content>

      {/* 样本详情抽屉 */}
      <Drawer
        title="样本详情"
        placement="right"
        onClose={() => setShowSampleDetail(false)}
        open={showSampleDetail}
        width={600}
      >
        {selectedSample && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="样本ID">{selectedSample.id}</Descriptions.Item>
                <Descriptions.Item label="内容">
                  <Paragraph copyable>{selectedSample.content}</Paragraph>
                </Descriptions.Item>
                <Descriptions.Item label="标签">
                  <Tag color="blue">{selectedSample.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="类别">
                  <Tag>{selectedSample.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="质量">
                  <Tag color={selectedSample.quality === 'high' ? 'green' : selectedSample.quality === 'medium' ? 'orange' : 'red'}>
                    {selectedSample.quality === 'high' ? '高' : selectedSample.quality === 'medium' ? '中' : '低'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Badge 
                    status={selectedSample.status === 'approved' ? 'success' : selectedSample.status === 'rejected' ? 'error' : 'processing'} 
                    text={selectedSample.status === 'pending' ? '待标注' :
                          selectedSample.status === 'labeled' ? '已标注' :
                          selectedSample.status === 'reviewed' ? '已审核' :
                          selectedSample.status === 'approved' ? '已通过' : '已拒绝'}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="标注员">{selectedSample.annotator}</Descriptions.Item>
                {selectedSample.reviewer && (
                  <Descriptions.Item label="审核员">{selectedSample.reviewer}</Descriptions.Item>
                )}
                <Descriptions.Item label="置信度">
                  <Progress percent={Math.round(selectedSample.confidence * 100)} size="small" />
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">{selectedSample.createTime}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{selectedSample.updateTime}</Descriptions.Item>
              </Descriptions>
            </Card>
            
            <Card title="标签" size="small">
              <Space wrap>
                {selectedSample.tags.map(tag => (
                  <Tag key={tag} color="blue">{tag}</Tag>
                ))}
              </Space>
            </Card>
            
            <Card title="元数据" size="small">
              <Descriptions column={1} size="small">
                {Object.entries(selectedSample.metadata).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key}>
                    {String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
            
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button icon={<EditOutlined />}>编辑</Button>
                <Button icon={<LikeOutlined />}>通过</Button>
                <Button icon={<DislikeOutlined />} danger>拒绝</Button>
              </Space>
            </div>
          </Space>
        )}
      </Drawer>

      {/* 批量导入弹窗 */}
      <Modal
        title="批量导入样本"
        open={showUploadModal}
        onCancel={() => setShowUploadModal(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="导入说明"
            description="支持 CSV、JSON、TXT 格式文件，单个文件不超过 10MB"
            type="info"
            showIcon
          />
          
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 48, color: '#1677FF' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个或批量上传，严禁上传公司数据或其他敏感信息
            </p>
          </Upload.Dragger>
          
          <div>
            <Text strong>文件格式示例：</Text>
            <div style={{ marginTop: 8 }}>
              <Text code>CSV: content,label,category</Text>
              <br />
              <Text code>JSON: [&#123;"content": "...", "label": "...", "category": "..."&#125;]</Text>
            </div>
          </div>
        </Space>
      </Modal>

      {/* 标注任务弹窗 */}
      <Modal
        title="创建标注任务"
        open={showAnnotationModal}
        onCancel={() => setShowAnnotationModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          
          <Form.Item name="type" label="标注类型" rules={[{ required: true }]}>
            <Select placeholder="请选择标注类型">
              <Option value="classification">文本分类</Option>
              <Option value="ner">命名实体识别</Option>
              <Option value="sentiment">情感分析</Option>
              <Option value="qa">问答对</Option>
              <Option value="summarization">文本摘要</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="assignee" label="负责人" rules={[{ required: true }]}>
            <Select placeholder="请选择负责人">
              <Option value="张三">张三</Option>
              <Option value="李四">李四</Option>
              <Option value="王五">王五</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="deadline" label="截止时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="priority" label="优先级">
            <Radio.Group>
              <Radio value="high">高</Radio>
              <Radio value="medium">中</Radio>
              <Radio value="low">低</Radio>
            </Radio.Group>
          </Form.Item>
          
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowAnnotationModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建任务</Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* 训练任务弹窗 */}
      <Modal
        title="创建训练任务"
        open={showTrainingModal}
        onCancel={() => setShowTrainingModal(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="模型名称" rules={[{ required: true }]}>
            <Input placeholder="请输入模型名称" />
          </Form.Item>
          
          <Form.Item name="modelType" label="模型类型" rules={[{ required: true }]}>
            <Select placeholder="请选择模型类型">
              <Option value="BERT-Classification">BERT分类模型</Option>
              <Option value="T5-QA">T5问答模型</Option>
              <Option value="BART-Summarization">BART摘要模型</Option>
              <Option value="GPT-Generation">GPT生成模型</Option>
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="epochs" label="训练轮数">
                <Slider min={1} max={50} defaultValue={10} marks={{ 1: '1', 25: '25', 50: '50' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="batchSize" label="批次大小">
                <Select defaultValue={32}>
                  <Option value={8}>8</Option>
                  <Option value={16}>16</Option>
                  <Option value={32}>32</Option>
                  <Option value={64}>64</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="learningRate" label="学习率">
                <Select defaultValue={0.001}>
                  <Option value={0.0001}>0.0001</Option>
                  <Option value={0.0005}>0.0005</Option>
                  <Option value={0.001}>0.001</Option>
                  <Option value={0.002}>0.002</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maxLength" label="最大长度">
                <Select defaultValue={512}>
                  <Option value={256}>256</Option>
                  <Option value={512}>512</Option>
                  <Option value={1024}>1024</Option>
                  <Option value={2048}>2048</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="dataset" label="训练数据集" rules={[{ required: true }]}>
            <Select placeholder="请选择训练数据集">
              <Option value="dataset_1">客服对话数据集 (5000条)</Option>
              <Option value="dataset_2">知识问答数据集 (8000条)</Option>
              <Option value="dataset_3">文档摘要数据集 (3000条)</Option>
            </Select>
          </Form.Item>
          
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowTrainingModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">开始训练</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default TrainingDataPage;