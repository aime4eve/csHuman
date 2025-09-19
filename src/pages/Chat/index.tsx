/**
 * 智能对话界面页面 - 主要的对话交互界面
 * @author 伍志勇
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Layout,
  Input,
  Button,
  Card,
  List,
  Avatar,
  Typography,
  Space,
  Tag,
  Divider,
  Spin,
  Empty,
  Tooltip,
  Badge,
  Drawer,
  Collapse,
  Timeline,
  App,
  Modal,
  Tabs,
  Form,
  Select,
  Slider,
  Switch,
  InputNumber,
  Radio,
  Checkbox,
  Upload,
  Progress
} from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  HistoryOutlined,
  BookOutlined,
  LinkOutlined,
  CopyOutlined,
  LikeOutlined,
  DislikeOutlined,
  ReloadOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined,
  RestOutlined,
  SaveOutlined,
  BulbOutlined,
  FontSizeOutlined,
  ControlOutlined
} from '@ant-design/icons';
import { useGlobalStore } from '../../store';

const { Content, Sider } = Layout;
const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

// 消息类型定义
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: KnowledgeSource[];
  loading?: boolean;
}

// 知识来源类型定义
interface KnowledgeSource {
  id: string;
  title: string;
  type: 'document' | 'knowledge_graph' | 'vector_search';
  content: string;
  confidence: number;
  url?: string;
}

// 对话会话类型定义
interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

// 设置配置类型定义
interface ChatSettings {
  // 对话参数
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  
  // 界面设置
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  messageDensity: 'compact' | 'normal' | 'comfortable';
  showTimestamp: boolean;
  showSources: boolean;
  
  // 快捷键设置
  sendKey: 'Enter' | 'Ctrl+Enter' | 'Shift+Enter';
  newChatKey: string;
  clearChatKey: string;
  
  // 其他设置
  autoSave: boolean;
  soundEnabled: boolean;
  animationEnabled: boolean;
}

/**
 * 智能对话页面组件
 */
const ChatPage: React.FC = () => {
  const { user } = useGlobalStore();
  const { message } = App.useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [historyVisible, setHistoryVisible] = useState(false);
  const [sourcesVisible, setSourcesVisible] = useState(false);
  const [currentSources, setCurrentSources] = useState<KnowledgeSource[]>([]);
  const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({});
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(() => {
    // 从localStorage加载保存的设置
    try {
      const savedSettings = localStorage.getItem('chatSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
    
    // 默认设置
    return {
      // 对话参数默认值
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      
      // 界面设置默认值
      theme: 'auto',
      fontSize: 14,
      messageDensity: 'normal',
      showTimestamp: true,
      showSources: true,
      
      // 快捷键设置默认值
      sendKey: 'Enter',
      newChatKey: 'Ctrl+N',
      clearChatKey: 'Ctrl+L',
      
      // 其他设置默认值
      autoSave: true,
      soundEnabled: false,
      animationEnabled: true
    };
  });
  const [form] = Form.useForm();

  // 组件挂载时应用设置
  useEffect(() => {
    applySettings(settings);
    form.setFieldsValue(settings);
  }, []);

  // 监听设置变化，自动保存
  useEffect(() => {
    if (settings.autoSave) {
      try {
        localStorage.setItem('chatSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('自动保存设置失败:', error);
      }
    }
  }, [settings]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 创建仿真历史消息数据
  const createMockMessages = (sessionId: string, sessionTitle: string): ChatMessage[] => {
    const mockMessagesData: Record<string, ChatMessage[]> = {
      '1': [
        {
          id: '1-1',
          type: 'user',
          content: '请介绍一下React项目的架构设计原则',
          timestamp: new Date('2024-01-15 14:20:00')
        },
        {
          id: '1-2',
          type: 'assistant',
          content: 'React项目架构设计应遵循以下核心原则：\n\n1. **组件化设计**：将UI拆分为独立、可复用的组件\n2. **单一职责原则**：每个组件只负责一个功能\n3. **状态管理**：合理使用useState、useContext或Redux\n4. **文件夹结构**：按功能模块组织代码\n5. **代码分割**：使用React.lazy实现按需加载',
          timestamp: new Date('2024-01-15 14:20:30'),
          sources: [
            {
              id: 'src-1-1',
              title: 'React官方文档 - 组件设计',
              type: 'document',
              content: 'React组件应该是独立、可复用的代码片段...',
              confidence: 0.92
            }
          ]
        },
        {
          id: '1-3',
          type: 'user',
          content: '如何处理组件间的状态共享？',
          timestamp: new Date('2024-01-15 14:25:00')
        },
        {
          id: '1-4',
          type: 'assistant',
          content: '组件间状态共享有多种方案：\n\n**1. Props传递**\n- 适用于父子组件间的简单数据传递\n\n**2. Context API**\n- 适用于跨层级组件的状态共享\n- 避免props drilling问题\n\n**3. 状态管理库**\n- Redux：适合大型应用的复杂状态管理\n- Zustand：轻量级状态管理方案\n\n**4. 自定义Hook**\n- 封装状态逻辑，实现组件间共享',
          timestamp: new Date('2024-01-15 14:25:45')
        }
      ],
      '2': [
        {
          id: '2-1',
          type: 'user',
          content: 'TypeScript中如何定义更灵活的接口类型？',
          timestamp: new Date('2024-01-14 16:40:00')
        },
        {
          id: '2-2',
          type: 'assistant',
          content: 'TypeScript提供了多种方式来定义灵活的接口类型：\n\n**1. 泛型接口**\n```typescript\ninterface ApiResponse<T> {\n  data: T;\n  status: number;\n  message: string;\n}\n```\n\n**2. 可选属性**\n```typescript\ninterface User {\n  id: string;\n  name: string;\n  email?: string; // 可选\n}\n```\n\n**3. 联合类型**\n```typescript\ntype Status = "loading" | "success" | "error";\n```',
          timestamp: new Date('2024-01-14 16:40:30')
        },
        {
          id: '2-3',
          type: 'user',
          content: '能否展示一个复杂的泛型约束示例？',
          timestamp: new Date('2024-01-14 16:42:00')
        },
        {
          id: '2-4',
          type: 'assistant',
          content: '这里是一个复杂的泛型约束示例：\n\n```typescript\n// 基础约束接口\ninterface Identifiable {\n  id: string;\n}\n\ninterface Timestamped {\n  createdAt: Date;\n  updatedAt: Date;\n}\n\n// 复杂泛型约束\ninterface Repository<T extends Identifiable & Timestamped> {\n  findById(id: string): Promise<T | null>;\n  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;\n  update(id: string, data: Partial<Omit<T, "id">>): Promise<T>;\n  delete(id: string): Promise<void>;\n}\n\n// 使用示例\ninterface User extends Identifiable, Timestamped {\n  name: string;\n  email: string;\n}\n\nconst userRepo: Repository<User> = {\n  // 实现方法...\n};\n```',
          timestamp: new Date('2024-01-14 16:42:45')
        }
      ],
      '3': [
        {
          id: '3-1',
          type: 'user',
          content: '如何定制Ant Design组件的主题？',
          timestamp: new Date('2024-01-13 10:15:00')
        },
        {
          id: '3-2',
          type: 'assistant',
          content: 'Ant Design 5.x提供了强大的主题定制功能：\n\n**1. ConfigProvider配置**\n```jsx\nimport { ConfigProvider } from "antd";\n\nconst theme = {\n  token: {\n    colorPrimary: "#00b96b",\n    borderRadius: 6,\n  },\n};\n\n<ConfigProvider theme={theme}>\n  <App />\n</ConfigProvider>\n```\n\n**2. 组件级别定制**\n```jsx\nconst customTheme = {\n  components: {\n    Button: {\n      colorPrimary: "#ff4d4f",\n      algorithm: true,\n    },\n  },\n};\n```',
          timestamp: new Date('2024-01-13 10:15:30')
        }
      ]
    };

    // 如果有预定义的消息，返回预定义的；否则生成通用消息
    if (mockMessagesData[sessionId]) {
      return mockMessagesData[sessionId];
    }

    // 生成通用的历史消息
    return [
      {
        id: `${sessionId}-1`,
        type: 'user',
        content: `关于${sessionTitle}的问题`,
        timestamp: new Date(Date.now() - 3600000) // 1小时前
      },
      {
        id: `${sessionId}-2`,
        type: 'assistant',
        content: `根据您关于${sessionTitle}的询问，我为您整理了相关信息。这是一个复杂的技术话题，涉及多个方面的考虑。\n\n让我为您详细解答...`,
        timestamp: new Date(Date.now() - 3500000),
        sources: [
          {
            id: `src-${sessionId}-1`,
            title: '相关技术文档',
            type: 'document',
            content: `关于${sessionTitle}的详细说明...`,
            confidence: 0.88
          }
        ]
      }
    ];
  };

  // 初始化模拟数据
  useEffect(() => {
    const mockSessions: ChatSession[] = [
      {
        id: '1',
        title: 'React项目架构设计',
        lastMessage: '关于组件拆分和状态管理的最佳实践',
        timestamp: new Date('2024-01-15 14:30:00'),
        messageCount: 15
      },
      {
        id: '2',
        title: 'TypeScript类型定义优化',
        lastMessage: '如何设计更灵活的接口类型',
        timestamp: new Date('2024-01-14 16:45:00'),
        messageCount: 8
      },
      {
        id: '3',
        title: 'Ant Design组件定制',
        lastMessage: '主题配置和样式覆盖方案',
        timestamp: new Date('2024-01-13 10:20:00'),
        messageCount: 12
      },
      {
        id: '4',
        title: 'Vite构建优化策略',
        lastMessage: '打包体积和加载速度优化技巧',
        timestamp: new Date('2024-01-12 09:15:00'),
        messageCount: 6
      },
      {
        id: '5',
        title: 'API接口设计规范',
        lastMessage: 'RESTful API和GraphQL的选择',
        timestamp: new Date('2024-01-11 15:30:00'),
        messageCount: 20
      },
      {
        id: '6',
        title: '数据库设计与优化',
        lastMessage: '索引策略和查询性能调优',
        timestamp: new Date('2024-01-10 11:45:00'),
        messageCount: 18
      },
      {
        id: '7',
        title: '前端性能监控',
        lastMessage: '用户体验指标和性能分析工具',
        timestamp: new Date('2024-01-09 13:20:00'),
        messageCount: 9
      },
      {
        id: '8',
        title: '微服务架构实践',
        lastMessage: '服务拆分和通信机制设计',
        timestamp: new Date('2024-01-08 16:10:00'),
        messageCount: 25
      },
      {
        id: '9',
        title: 'Docker容器化部署',
        lastMessage: '多环境部署和CI/CD流程',
        timestamp: new Date('2024-01-07 14:25:00'),
        messageCount: 14
      },
      {
        id: '10',
        title: 'Redis缓存策略',
        lastMessage: '缓存穿透和雪崩问题解决',
        timestamp: new Date('2024-01-06 11:30:00'),
        messageCount: 11
      },
      {
        id: '11',
        title: 'Elasticsearch搜索优化',
        lastMessage: '全文检索和聚合查询性能调优',
        timestamp: new Date('2024-01-05 15:45:00'),
        messageCount: 16
      },
      {
        id: '12',
        title: 'Kubernetes集群管理',
        lastMessage: 'Pod调度和资源管理策略',
        timestamp: new Date('2024-01-04 10:15:00'),
        messageCount: 22
      }
    ];
    
    setSessions(mockSessions);

    // 为每个会话创建历史消息
    const allSessionMessages: Record<string, ChatMessage[]> = {};
    mockSessions.forEach(session => {
      allSessionMessages[session.id] = createMockMessages(session.id, session.title);
    });
    setSessionMessages(allSessionMessages);
  }, []);

  // 创建新会话
  useEffect(() => {
    const newSessionId = Date.now().toString();
    setCurrentSessionId(newSessionId);
  }, []);

  // 加载会话历史消息
  const loadSessionMessages = (sessionId: string) => {
    const historyMessages = sessionMessages[sessionId] || [];
    setMessages(historyMessages);
    setCurrentSessionId(sessionId);
  };

  // 保存设置
  const handleSaveSettings = () => {
    try {
      localStorage.setItem('chatSettings', JSON.stringify(settings));
      message.success('设置已保存');
      setSettingsVisible(false);
      
      // 应用设置到界面
      applySettings(settings);
    } catch (error) {
      message.error('保存设置失败');
    }
  };

  // 重置设置
  const handleResetSettings = () => {
    const defaultSettings: ChatSettings = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      presencePenalty: 0.0,
      frequencyPenalty: 0.0,
      theme: 'auto',
      fontSize: 14,
      messageDensity: 'normal',
      showTimestamp: true,
      showSources: true,
      sendKey: 'Enter',
      newChatKey: 'Ctrl+N',
      clearChatKey: 'Ctrl+L',
      autoSave: true,
      soundEnabled: false,
      animationEnabled: true
    };
    
    setSettings(defaultSettings);
    form.setFieldsValue(defaultSettings);
    message.success('已重置为默认设置');
  };

  // 应用设置到界面
  const applySettings = (newSettings: ChatSettings) => {
    // 应用字体大小
    document.documentElement.style.setProperty('--chat-font-size', `${newSettings.fontSize}px`);
    
    // 应用主题（这里可以集成主题切换逻辑）
    if (newSettings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (newSettings.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // 跟随系统主题
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
  };

  // 导出对话记录
  const handleExportChats = () => {
    try {
      const exportData = {
        sessions,
        sessionMessages,
        currentMessages: messages,
        exportTime: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('对话记录导出成功');
    } catch (error) {
      message.error('导出对话记录失败');
    }
  };

  // 导出设置配置
  const handleExportSettings = () => {
    try {
      const exportData = {
        settings,
        exportTime: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('设置配置导出成功');
    } catch (error) {
      message.error('导出设置配置失败');
    }
  };

  // 导入对话记录
  const handleImportChats = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.sessions && importData.sessionMessages) {
          setSessions(importData.sessions);
          setSessionMessages(importData.sessionMessages);
          if (importData.currentMessages) {
            setMessages(importData.currentMessages);
          }
          message.success('对话记录导入成功');
        } else {
          message.error('文件格式不正确');
        }
      } catch (error) {
        message.error('导入对话记录失败');
      }
    };
    reader.readAsText(file);
    return false; // 阻止默认上传行为
  };

  // 导入设置配置
  const handleImportSettings = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.settings) {
          setSettings(importData.settings);
          form.setFieldsValue(importData.settings);
          applySettings(importData.settings);
          message.success('设置配置导入成功');
        } else {
          message.error('文件格式不正确');
        }
      } catch (error) {
        message.error('导入设置配置失败');
      }
    };
    reader.readAsText(file);
    return false; // 阻止默认上传行为
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    // 模拟AI响应
    setTimeout(() => {
      const mockSources: KnowledgeSource[] = [
        {
          id: '1',
          title: 'React官方文档 - 性能优化',
          type: 'document',
          content: 'React提供了多种性能优化技术，包括memo、useMemo、useCallback等...',
          confidence: 0.95,
          url: 'https://react.dev/learn/render-and-commit'
        },
        {
          id: '2',
          title: '知识图谱 - React生态系统',
          type: 'knowledge_graph',
          content: 'React与Redux、Next.js等技术栈的关系图谱...',
          confidence: 0.88
        }
      ];

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `根据您的问题"${userMessage.content}"，我为您整理了以下信息：\n\n基于我的知识库检索，React性能优化主要包括以下几个方面：\n\n1. **组件优化**：使用React.memo包装组件，避免不必要的重新渲染\n2. **Hook优化**：合理使用useMemo和useCallback缓存计算结果和函数\n3. **代码分割**：使用React.lazy和Suspense实现组件懒加载\n4. **虚拟化**：对于大列表使用react-window等虚拟化库\n\n这些建议来源于React官方文档和最佳实践指南。`,
        timestamp: new Date(),
        sources: mockSources
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 2000);
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 查看知识来源
  const handleViewSources = (sources: KnowledgeSource[]) => {
    setCurrentSources(sources);
    setSourcesVisible(true);
  };

  // 复制消息内容
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  // 渲染消息项
  const renderMessage = (msg: ChatMessage) => (
    <div key={msg.id} style={{ marginBottom: 24 }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        gap: 12
      }}>
        {msg.type === 'assistant' && (
          <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
        )}
        
        <div style={{ 
          maxWidth: '70%',
          minWidth: '200px'
        }}>
          <Card
            size="small"
            style={{
              backgroundColor: msg.type === 'user' ? '#1890ff' : '#f5f5f5',
              color: msg.type === 'user' ? 'white' : 'inherit',
              border: 'none'
            }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <Paragraph 
              style={{ 
                margin: 0, 
                color: msg.type === 'user' ? 'white' : 'inherit',
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.content}
            </Paragraph>
            
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e8e8e8' }}>
                <Space wrap>
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<BookOutlined />}
                    onClick={() => handleViewSources(msg.sources!)}
                    style={{ padding: 0, color: '#666' }}
                  >
                    查看知识来源 ({msg.sources.length})
                  </Button>
                </Space>
              </div>
            )}
          </Card>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'center',
            gap: 8,
            marginTop: 8
          }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {msg.timestamp.toLocaleTimeString()}
            </Text>
            
            {msg.type === 'assistant' && (
              <Space size={4}>
                <Tooltip title="复制">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyMessage(msg.content)}
                  />
                </Tooltip>
                <Tooltip title="有用">
                  <Button type="text" size="small" icon={<LikeOutlined />} />
                </Tooltip>
                <Tooltip title="无用">
                  <Button type="text" size="small" icon={<DislikeOutlined />} />
                </Tooltip>
              </Space>
            )}
          </div>
        </div>
        
        {msg.type === 'user' && (
          <Avatar icon={<UserOutlined />} src={user?.avatar} />
        )}
      </div>
    </div>
  );

  return (
    <Layout style={{ height: 'calc(100vh - 112px)' }}>
      {/* 主对话区域 */}
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        {/* 对话标题栏 */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>智能对话助手</Title>
            <Text type="secondary">基于RAG架构的知识问答系统</Text>
          </div>
          
          <Space>
            <Badge count={sessions.length}>
              <Button 
                icon={<HistoryOutlined />} 
                onClick={() => setHistoryVisible(true)}
              >
                历史会话
              </Button>
            </Badge>
            <Button 
              icon={<SettingOutlined />}
              onClick={() => setSettingsVisible(true)}
            >
              设置
            </Button>
          </Space>
        </div>
        
        {/* 消息列表 */}
        <div style={{ 
          flex: 1, 
          padding: '24px', 
          overflowY: 'auto',
          backgroundColor: '#fafafa'
        }}>
          {messages.length === 0 ? (
            <Empty 
              description="开始您的智能对话吧！"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            messages.map(renderMessage)
          )}
          
          {loading && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin size="large" />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">AI正在思考中...</Text>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 */}
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #f0f0f0',
          backgroundColor: 'white'
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入您的问题..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ flex: 1 }}
            />
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              loading={loading}
              disabled={!inputValue.trim()}
            >
              发送
            </Button>
          </div>
          
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              按 Enter 发送，Shift + Enter 换行
            </Text>
          </div>
        </div>
      </Content>
      
      {/* 历史会话抽屉 */}
      <Drawer
        title="历史会话"
        placement="left"
        onClose={() => setHistoryVisible(false)}
        open={historyVisible}
        width={400}
      >
        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              style={{ 
                cursor: 'pointer',
                minHeight: '80px', // 设置最小高度
                padding: '12px 0',
                alignItems: 'flex-start' // 顶部对齐
              }}
              onClick={() => {
                loadSessionMessages(session.id); // 加载会话历史消息
                setHistoryVisible(false);
              }}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<RobotOutlined />} />}
                title={<div style={{ fontSize: '14px', fontWeight: 500 }}>{session.title}</div>}
                description={
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ 
                      fontSize: '13px', 
                      color: '#666',
                      marginBottom: '4px',
                      lineHeight: '1.4'
                    }}>
                      {session.lastMessage}
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {session.messageCount} 条消息 · {session.timestamp.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
      
      {/* 知识来源抽屉 */}
      <Drawer
        title="知识来源"
        placement="right"
        onClose={() => setSourcesVisible(false)}
        open={sourcesVisible}
        width={500}
      >
        <List
          dataSource={currentSources}
          renderItem={(source) => (
            <List.Item>
              <Card size="small" style={{ width: '100%' }}>
                <div style={{ marginBottom: 12 }}>
                  <Space>
                    <Tag color={
                      source.type === 'document' ? 'blue' :
                      source.type === 'knowledge_graph' ? 'green' : 'orange'
                    }>
                      {source.type === 'document' ? '文档检索' :
                       source.type === 'knowledge_graph' ? '知识图谱' : '向量搜索'}
                    </Tag>
                    <Text strong>置信度: {(source.confidence * 100).toFixed(1)}%</Text>
                  </Space>
                </div>
                
                <Title level={5}>{source.title}</Title>
                <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                  {source.content}
                </Paragraph>
                
                {source.url && (
                  <Button 
                    type="link" 
                    icon={<LinkOutlined />} 
                    href={source.url}
                    target="_blank"
                    style={{ padding: 0 }}
                  >
                    查看原文
                  </Button>
                )}
              </Card>
            </List.Item>
          )}
        />      </Drawer>
      
      {/* 设置模态框 */}
      <Modal
        title="设置"
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        width={800}
        footer={[
          <Button key="reset" icon={<RestOutlined />} onClick={handleResetSettings}>
            重置默认
          </Button>,
          <Button key="cancel" onClick={() => setSettingsVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSaveSettings}>
            保存设置
          </Button>
        ]}
      >
        <Tabs
          defaultActiveKey="model"
          items={[
            {
              key: 'model',
              label: (
                <span>
                  <RobotOutlined />
                  对话参数
                </span>
              ),
              children: (
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={settings}
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                >
                  <Form.Item
                    label="AI模型"
                    name="model"
                    tooltip="选择不同的AI模型会影响对话质量和响应速度"
                  >
                    <Select>
                      <Select.Option value="gpt-4">GPT-4 (推荐)</Select.Option>
                      <Select.Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Select.Option>
                      <Select.Option value="claude-3">Claude-3</Select.Option>
                      <Select.Option value="gemini-pro">Gemini Pro</Select.Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    label={`创造性 (${settings.temperature})`}
                    name="temperature"
                    tooltip="控制AI回答的创造性，值越高越有创意但可能不够准确"
                  >
                    <Slider
                      min={0}
                      max={2}
                      step={0.1}
                      marks={{
                        0: '保守',
                        1: '平衡',
                        2: '创新'
                      }}
                      onChange={(value) => setSettings(prev => ({ ...prev, temperature: value }))}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    label={`最大Token数 (${settings.maxTokens})`}
                    name="maxTokens"
                    tooltip="限制AI回答的最大长度"
                  >
                    <Slider
                      min={256}
                      max={4096}
                      step={256}
                      marks={{
                        256: '256',
                        2048: '2048',
                        4096: '4096'
                      }}
                      onChange={(value) => setSettings(prev => ({ ...prev, maxTokens: value }))}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    label={`Top P (${settings.topP})`}
                    name="topP"
                    tooltip="控制词汇选择的多样性"
                  >
                    <Slider
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      onChange={(value) => setSettings(prev => ({ ...prev, topP: value }))}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    label={`存在惩罚 (${settings.presencePenalty})`}
                    name="presencePenalty"
                    tooltip="减少重复话题的出现"
                  >
                    <Slider
                      min={-2.0}
                      max={2.0}
                      step={0.1}
                      onChange={(value) => setSettings(prev => ({ ...prev, presencePenalty: value }))}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    label={`频率惩罚 (${settings.frequencyPenalty})`}
                    name="frequencyPenalty"
                    tooltip="减少重复词汇的使用"
                  >
                    <Slider
                      min={-2.0}
                      max={2.0}
                      step={0.1}
                      onChange={(value) => setSettings(prev => ({ ...prev, frequencyPenalty: value }))}
                    />
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'appearance',
              label: (
                <span>
                  <BulbOutlined />
                  界面设置
                </span>
              ),
              children: (
                <Form
                  layout="vertical"
                  initialValues={settings}
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                >
                  <Form.Item
                    label="主题模式"
                    name="theme"
                  >
                    <Radio.Group
                      value={settings.theme}
                      onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                    >
                      <Radio.Button value="light">浅色</Radio.Button>
                      <Radio.Button value="dark">深色</Radio.Button>
                      <Radio.Button value="auto">跟随系统</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  
                  <Form.Item
                    label={`字体大小 (${settings.fontSize}px)`}
                    name="fontSize"
                  >
                    <Slider
                      min={12}
                      max={20}
                      step={1}
                      marks={{
                        12: '小',
                        14: '中',
                        16: '大',
                        20: '特大'
                      }}
                      value={settings.fontSize}
                      onChange={(value) => setSettings(prev => ({ ...prev, fontSize: value }))}
                    />
                  </Form.Item>
                  
                  <Form.Item
                    label="消息密度"
                    name="messageDensity"
                  >
                    <Radio.Group
                      value={settings.messageDensity}
                      onChange={(e) => setSettings(prev => ({ ...prev, messageDensity: e.target.value }))}
                    >
                      <Radio.Button value="compact">紧凑</Radio.Button>
                      <Radio.Button value="normal">正常</Radio.Button>
                      <Radio.Button value="comfortable">舒适</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  
                  <Form.Item label="显示选项">
                    <Space direction="vertical">
                      <Checkbox
                        checked={settings.showTimestamp}
                        onChange={(e) => setSettings(prev => ({ ...prev, showTimestamp: e.target.checked }))}
                      >
                        显示消息时间戳
                      </Checkbox>
                      <Checkbox
                        checked={settings.showSources}
                        onChange={(e) => setSettings(prev => ({ ...prev, showSources: e.target.checked }))}
                      >
                        显示知识来源
                      </Checkbox>
                    </Space>
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'shortcuts',
              label: (
                <span>
                  <ControlOutlined />
                  快捷键
                </span>
              ),
              children: (
                <Form
                  layout="vertical"
                  initialValues={settings}
                  style={{ maxHeight: '400px', overflowY: 'auto' }}
                >
                  <Form.Item
                    label="发送消息"
                    name="sendKey"
                  >
                    <Select
                      value={settings.sendKey}
                      onChange={(value) => setSettings(prev => ({ ...prev, sendKey: value }))}
                    >
                      <Select.Option value="Enter">Enter</Select.Option>
                      <Select.Option value="Ctrl+Enter">Ctrl + Enter</Select.Option>
                      <Select.Option value="Shift+Enter">Shift + Enter</Select.Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    label="新建对话"
                    name="newChatKey"
                  >
                    <Input
                      value={settings.newChatKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, newChatKey: e.target.value }))}
                      placeholder="例如: Ctrl+N"
                    />
                  </Form.Item>
                  
                  <Form.Item
                    label="清空对话"
                    name="clearChatKey"
                  >
                    <Input
                      value={settings.clearChatKey}
                      onChange={(e) => setSettings(prev => ({ ...prev, clearChatKey: e.target.value }))}
                      placeholder="例如: Ctrl+L"
                    />
                  </Form.Item>
                </Form>
              )
            },
            {
              key: 'data',
              label: (
                <span>
                  <DownloadOutlined />
                  数据管理
                </span>
              ),
              children: (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <Card size="small" title="导出数据">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text type="secondary">
                          导出您的对话历史和设置配置
                        </Text>
                        <Space>
                          <Button icon={<DownloadOutlined />} onClick={handleExportChats}>
                            导出对话记录
                          </Button>
                          <Button icon={<DownloadOutlined />} onClick={handleExportSettings}>
                            导出设置配置
                          </Button>
                        </Space>
                      </Space>
                    </Card>
                    
                    <Card size="small" title="导入数据">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Text type="secondary">
                          从文件导入对话历史和设置配置
                        </Text>
                        <Space>
                          <Upload
                            accept=".json"
                            showUploadList={false}
                            beforeUpload={handleImportChats}
                          >
                            <Button icon={<UploadOutlined />}>
                              导入对话记录
                            </Button>
                          </Upload>
                          <Upload
                            accept=".json"
                            showUploadList={false}
                            beforeUpload={handleImportSettings}
                          >
                            <Button icon={<UploadOutlined />}>
                              导入设置配置
                            </Button>
                          </Upload>
                        </Space>
                      </Space>
                    </Card>
                    
                    <Card size="small" title="其他设置">
                      <Space direction="vertical">
                        <Checkbox
                          checked={settings.autoSave}
                          onChange={(e) => setSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                        >
                          自动保存对话记录
                        </Checkbox>
                        <Checkbox
                          checked={settings.soundEnabled}
                          onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                        >
                          启用提示音效
                        </Checkbox>
                        <Checkbox
                          checked={settings.animationEnabled}
                          onChange={(e) => setSettings(prev => ({ ...prev, animationEnabled: e.target.checked }))}
                        >
                          启用动画效果
                        </Checkbox>
                      </Space>
                    </Card>
                  </Space>
                </div>
              )
            }
          ]}
        />
      </Modal>
    </Layout>
  );
};

export default ChatPage;