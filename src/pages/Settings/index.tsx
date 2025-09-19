/**
 * 系统设置页 - 基础配置、安全管理、集成接口管理
 * @author 伍志勇
 */
import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  Upload,
  Avatar,
  Typography,
  Divider,
  Space,
  Table,
  Tag,
  Modal,
  Tabs,
  Alert,
  Progress,
  List,
  Tooltip,
  Badge,
  Radio,
  Checkbox,
  TimePicker,
  DatePicker,
  Slider,
  ColorPicker,
  App,
  Popconfirm,
  Descriptions,
  Steps,
  Result
} from 'antd';
import {
  SettingOutlined,
  SecurityScanOutlined,
  ApiOutlined,
  SaveOutlined,
  ReloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  BellOutlined,
  DatabaseOutlined,
  CloudOutlined,
  LinkOutlined,
  SyncOutlined,
  MonitorOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { useGlobalStore } from '../../store';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
// 移除 TabPane 解构，改用 items 属性
const { Step } = Steps;
const { Password } = Input;

// 系统配置接口
interface SystemConfig {
  basic: {
    siteName: string;
    siteDescription: string;
    logo: any[];
    favicon: string;
    language: string;
    timezone: string;
    dateFormat: string;
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
  };
  security: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expirationDays: number;
    };
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    twoFactorAuth: boolean;
    ipWhitelist: string[];
    sslEnabled: boolean;
  };
  notification: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    emailServer: {
      host: string;
      port: number;
      username: string;
      password: string;
      encryption: 'none' | 'ssl' | 'tls';
    };
    smsProvider: {
      provider: string;
      apiKey: string;
      apiSecret: string;
    };
  };
  storage: {
    provider: 'local' | 'oss' | 's3' | 'cos';
    maxFileSize: number;
    allowedTypes: string[];
    config: Record<string, any>;
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number;
    location: string;
    encryption: boolean;
  };
}

// API接口配置
interface ApiConfig {
  id: string;
  name: string;
  type: 'rest' | 'graphql' | 'webhook';
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  authentication: {
    type: 'none' | 'basic' | 'bearer' | 'apikey' | 'oauth2';
    config: Record<string, any>;
  };
  rateLimit: {
    enabled: boolean;
    requests: number;
    window: number;
  };
  status: 'active' | 'inactive' | 'error';
  lastTest: string;
  description: string;
}

// 安全日志接口
interface SecurityLog {
  id: string;
  timestamp: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'permission_change' | 'api_access';
  user: string;
  ip: string;
  userAgent: string;
  details: string;
  risk: 'low' | 'medium' | 'high';
}

/**
 * 基础配置组件
 */
const BasicSettings: React.FC<{
  config: SystemConfig['basic'];
  onSave: (config: SystemConfig['basic']) => void;
}> = ({ config, onSave }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { message } = App.useApp();
  
  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave(values);
      message.success('基础配置已保存');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="基础配置" className="mb-4">
      <Form
        form={form}
        layout="vertical"
        initialValues={config}
        onFinish={handleSave}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="站点名称"
              name="siteName"
              rules={[{ required: true, message: '请输入站点名称' }]}
            >
              <Input placeholder="请输入站点名称" />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item
              label="语言设置"
              name="language"
            >
              <Select>
                <Option value="zh-CN">简体中文</Option>
                <Option value="en-US">English</Option>
                <Option value="ja-JP">日本語</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24}>
            <Form.Item
              label="站点描述"
              name="siteDescription"
            >
              <TextArea rows={3} placeholder="请输入站点描述" />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={8}>
            <Form.Item
              label="时区设置"
              name="timezone"
            >
              <Select>
                <Option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</Option>
                <Option value="America/New_York">America/New_York (UTC-5)</Option>
                <Option value="Europe/London">Europe/London (UTC+0)</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} md={8}>
            <Form.Item
              label="日期格式"
              name="dateFormat"
            >
              <Select>
                <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} md={8}>
            <Form.Item
              label="主题模式"
              name="theme"
            >
              <Select>
                <Option value="light">浅色主题</Option>
                <Option value="dark">深色主题</Option>
                <Option value="auto">跟随系统</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item
              label="主色调"
              name="primaryColor"
            >
              <ColorPicker showText />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item
              label="站点Logo"
              name="logo"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) {
                  return e;
                }
                return e && e.fileList;
              }}
            >
              <Upload
                listType="picture-card"
                maxCount={1}
                beforeUpload={() => false}
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传Logo</div>
                </div>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存配置
            </Button>
            <Button onClick={() => form.resetFields()} icon={<ReloadOutlined />}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

/**
 * 安全配置组件
 */
const SecuritySettings: React.FC<{
  config: SystemConfig['security'];
  onSave: (config: SystemConfig['security']) => void;
}> = ({ config, onSave }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // 模拟安全日志数据
  const securityLogs: SecurityLog[] = [
    {
      id: '1',
      timestamp: '2024-01-15 10:30:25',
      type: 'login',
      user: 'admin',
      ip: '192.168.1.100',
      userAgent: 'Chrome/120.0.0.0',
      details: '管理员登录成功',
      risk: 'low'
    },
    {
      id: '2',
      timestamp: '2024-01-15 09:45:12',
      type: 'failed_login',
      user: 'unknown',
      ip: '203.0.113.1',
      userAgent: 'curl/7.68.0',
      details: '连续3次登录失败',
      risk: 'high'
    },
    {
      id: '3',
      timestamp: '2024-01-15 08:20:33',
      type: 'api_access',
      user: 'api_user',
      ip: '10.0.0.50',
      userAgent: 'PostmanRuntime/7.32.3',
      details: 'API访问频率异常',
      risk: 'medium'
    }
  ];

  const { message } = App.useApp();
  
  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave(values);
      message.success('安全配置已保存');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const logColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap = {
          login: { color: 'green', text: '登录' },
          logout: { color: 'blue', text: '登出' },
          failed_login: { color: 'red', text: '登录失败' },
          password_change: { color: 'orange', text: '密码修改' },
          permission_change: { color: 'purple', text: '权限变更' },
          api_access: { color: 'cyan', text: 'API访问' }
        };
        const config = typeMap[type as keyof typeof typeMap];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      }
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 100
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 120
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true
    },
    {
      title: '风险等级',
      dataIndex: 'risk',
      key: 'risk',
      width: 100,
      render: (risk: string) => {
        const riskMap = {
          low: { color: 'green', text: '低' },
          medium: { color: 'orange', text: '中' },
          high: { color: 'red', text: '高' }
        };
        const config = riskMap[risk as keyof typeof riskMap];
        return <Badge color={config?.color} text={config?.text} />;
      }
    }
  ];

  return (
    <div className="space-y-4">
      <Card title="密码策略" className="mb-4">
        <Form
          form={form}
          layout="vertical"
          initialValues={config}
          onFinish={handleSave}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="最小长度"
                name={['passwordPolicy', 'minLength']}
              >
                <InputNumber min={6} max={32} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                label="密码过期天数"
                name={['passwordPolicy', 'expirationDays']}
              >
                <InputNumber min={0} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col xs={24}>
              <Form.Item label="密码复杂度要求">
                <Space direction="vertical">
                  <Form.Item name={['passwordPolicy', 'requireUppercase']} valuePropName="checked" noStyle>
                    <Checkbox>包含大写字母</Checkbox>
                  </Form.Item>
                  <Form.Item name={['passwordPolicy', 'requireLowercase']} valuePropName="checked" noStyle>
                    <Checkbox>包含小写字母</Checkbox>
                  </Form.Item>
                  <Form.Item name={['passwordPolicy', 'requireNumbers']} valuePropName="checked" noStyle>
                    <Checkbox>包含数字</Checkbox>
                  </Form.Item>
                  <Form.Item name={['passwordPolicy', 'requireSpecialChars']} valuePropName="checked" noStyle>
                    <Checkbox>包含特殊字符</Checkbox>
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="访问控制" className="mb-4">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Form.Item
                label="会话超时(分钟)"
                name="sessionTimeout"
              >
                <InputNumber min={5} max={1440} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item
                label="最大登录尝试次数"
                name="maxLoginAttempts"
              >
                <InputNumber min={3} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item
                label="锁定时长(分钟)"
                name="lockoutDuration"
              >
                <InputNumber min={5} max={60} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col xs={24}>
              <Form.Item label="安全选项">
                <Space direction="vertical">
                  <Form.Item name="twoFactorAuth" valuePropName="checked" noStyle>
                    <Checkbox>启用双因素认证</Checkbox>
                  </Form.Item>
                  <Form.Item name="sslEnabled" valuePropName="checked" noStyle>
                    <Checkbox>强制SSL连接</Checkbox>
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
            
            <Col xs={24}>
              <Form.Item
                label="IP白名单"
                name="ipWhitelist"
                help="每行一个IP地址或IP段，支持CIDR格式"
              >
                <TextArea 
                  rows={4} 
                  placeholder="192.168.1.0/24&#10;10.0.0.1&#10;203.0.113.0/24"
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                保存配置
              </Button>
              <Button onClick={() => setShowLogs(true)} icon={<MonitorOutlined />}>
                查看安全日志
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 安全日志模态框 */}
      <Modal
        title="安全日志"
        open={showLogs}
        onCancel={() => setShowLogs(false)}
        width={1000}
        footer={null}
      >
        <Table
          dataSource={securityLogs}
          columns={logColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  );
};

/**
 * API接口管理组件
 */
const ApiManagement: React.FC = () => {
  const [apis, setApis] = useState<ApiConfig[]>([
    {
      id: '1',
      name: '用户认证API',
      type: 'rest',
      endpoint: 'https://api.example.com/auth',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      authentication: {
        type: 'bearer',
        config: { token: 'xxx' }
      },
      rateLimit: {
        enabled: true,
        requests: 100,
        window: 60
      },
      status: 'active',
      lastTest: '2024-01-15 10:30:00',
      description: '用户身份验证接口'
    },
    {
      id: '2',
      name: '数据同步Webhook',
      type: 'webhook',
      endpoint: 'https://webhook.example.com/sync',
      method: 'POST',
      headers: { 'X-API-Key': 'secret' },
      authentication: {
        type: 'apikey',
        config: { key: 'X-API-Key', value: 'secret' }
      },
      rateLimit: {
        enabled: false,
        requests: 0,
        window: 0
      },
      status: 'error',
      lastTest: '2024-01-15 09:15:00',
      description: '数据同步回调接口'
    }
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiConfig | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const handleSaveApi = (values: any) => {
    if (editingApi) {
      setApis(prev => prev.map(api => 
        api.id === editingApi.id ? { ...api, ...values } : api
      ));
      message.success('API配置已更新');
    } else {
      const newApi: ApiConfig = {
        id: Date.now().toString(),
        ...values,
        status: 'inactive',
        lastTest: '从未测试'
      };
      setApis(prev => [...prev, newApi]);
      message.success('API配置已添加');
    }
    setShowModal(false);
    setEditingApi(null);
    form.resetFields();
  };

  const handleTestApi = async (api: ApiConfig) => {
    message.loading('正在测试API连接...', 0);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const success = Math.random() > 0.3;
      if (success) {
        setApis(prev => prev.map(item => 
          item.id === api.id 
            ? { ...item, status: 'active', lastTest: dayjs().format('YYYY-MM-DD HH:mm:ss') }
            : item
        ));
        message.destroy();
        message.success('API连接测试成功');
      } else {
        setApis(prev => prev.map(item => 
          item.id === api.id 
            ? { ...item, status: 'error', lastTest: dayjs().format('YYYY-MM-DD HH:mm:ss') }
            : item
        ));
        message.destroy();
        message.error('API连接测试失败');
      }
    } catch (error) {
      message.destroy();
      message.error('测试过程中发生错误');
    }
  };

  const handleDeleteApi = (id: string) => {
    setApis(prev => prev.filter(api => api.id !== id));
    message.success('API配置已删除');
  };

  const apiColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap = {
          rest: { color: 'blue', text: 'REST API' },
          graphql: { color: 'purple', text: 'GraphQL' },
          webhook: { color: 'green', text: 'Webhook' }
        };
        const config = typeMap[type as keyof typeof typeMap];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      }
    },
    {
      title: '端点',
      dataIndex: 'endpoint',
      key: 'endpoint',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap = {
          active: { color: 'success', text: '正常' },
          inactive: { color: 'default', text: '未激活' },
          error: { color: 'error', text: '错误' }
        };
        const config = statusMap[status as keyof typeof statusMap];
        return <Badge status={config?.color as any} text={config?.text} />;
      }
    },
    {
      title: '最后测试',
      dataIndex: 'lastTest',
      key: 'lastTest'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ApiConfig) => (
        <Space>
          <Button 
            size="small" 
            icon={<SyncOutlined />}
            onClick={() => handleTestApi(record)}
          >
            测试
          </Button>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              setEditingApi(record);
              form.setFieldsValue(record);
              setShowModal(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个API配置吗？"
            onConfirm={() => handleDeleteApi(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card 
        title="API接口管理"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingApi(null);
              form.resetFields();
              setShowModal(true);
            }}
          >
            添加API
          </Button>
        }
      >
        <Table
          dataSource={apis}
          columns={apiColumns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* API配置模态框 */}
      <Modal
        title={editingApi ? '编辑API配置' : '添加API配置'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingApi(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveApi}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="API名称"
                name="name"
                rules={[{ required: true, message: '请输入API名称' }]}
              >
                <Input placeholder="请输入API名称" />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                label="API类型"
                name="type"
                rules={[{ required: true, message: '请选择API类型' }]}
              >
                <Select>
                  <Option value="rest">REST API</Option>
                  <Option value="graphql">GraphQL</Option>
                  <Option value="webhook">Webhook</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24}>
              <Form.Item
                label="端点URL"
                name="endpoint"
                rules={[{ required: true, message: '请输入端点URL' }]}
              >
                <Input placeholder="https://api.example.com/endpoint" />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                label="请求方法"
                name="method"
              >
                <Select>
                  <Option value="GET">GET</Option>
                  <Option value="POST">POST</Option>
                  <Option value="PUT">PUT</Option>
                  <Option value="DELETE">DELETE</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                label="认证类型"
                name={['authentication', 'type']}
              >
                <Select>
                  <Option value="none">无认证</Option>
                  <Option value="basic">Basic Auth</Option>
                  <Option value="bearer">Bearer Token</Option>
                  <Option value="apikey">API Key</Option>
                  <Option value="oauth2">OAuth 2.0</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24}>
              <Form.Item
                label="描述"
                name="description"
              >
                <TextArea rows={3} placeholder="请输入API描述" />
              </Form.Item>
            </Col>
            
            <Col xs={24}>
              <Form.Item label="限流设置">
                <Row gutter={[8, 8]}>
                  <Col span={8}>
                    <Form.Item name={['rateLimit', 'enabled']} valuePropName="checked" noStyle>
                      <Checkbox>启用限流</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['rateLimit', 'requests']} noStyle>
                      <InputNumber placeholder="请求数" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['rateLimit', 'window']} noStyle>
                      <InputNumber placeholder="时间窗口(秒)" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

/**
 * 系统设置页面组件
 */
const SettingsPage: React.FC = () => {
  const { user } = useGlobalStore();
  const [activeTab, setActiveTab] = useState('basic');
  
  // 模拟系统配置数据
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    basic: {
      siteName: '企业知识库管理系统',
      siteDescription: '专业的企业级知识管理平台，助力组织知识沉淀与传承',
      logo: [],
      favicon: '',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      theme: 'light',
      primaryColor: '#1890ff'
    },
    security: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: 90
      },
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      twoFactorAuth: false,
      ipWhitelist: [],
      sslEnabled: true
    },
    notification: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      emailServer: {
        host: 'smtp.example.com',
        port: 587,
        username: 'noreply@example.com',
        password: '',
        encryption: 'tls'
      },
      smsProvider: {
        provider: 'aliyun',
        apiKey: '',
        apiSecret: ''
      }
    },
    storage: {
      provider: 'local',
      maxFileSize: 100,
      allowedTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'],
      config: {}
    },
    backup: {
      enabled: true,
      frequency: 'daily',
      retention: 30,
      location: '/backup',
      encryption: true
    }
  });

  const handleSaveBasicConfig = (config: SystemConfig['basic']) => {
    setSystemConfig(prev => ({ ...prev, basic: config }));
  };

  const handleSaveSecurityConfig = (config: SystemConfig['security']) => {
    setSystemConfig(prev => ({ ...prev, security: config }));
  };

  // 检查用户权限
  const hasPermission = (permission: string) => {
    return user?.role === 'admin' || user?.permissions?.includes(permission);
  };

  if (!hasPermission('system_settings')) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面。"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回
          </Button>
        }
      />
    );
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2}>系统设置</Title>
        <Text type="secondary">管理系统配置、安全策略和集成接口</Text>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'basic',
            label: (
              <span>
                <SettingOutlined />
                基础配置
              </span>
            ),
            children: (
              <BasicSettings 
                config={systemConfig.basic}
                onSave={handleSaveBasicConfig}
              />
            )
          },
          {
            key: 'security',
            label: (
              <span>
                <SecurityScanOutlined />
                安全管理
              </span>
            ),
            children: (
              <SecuritySettings 
                config={systemConfig.security}
                onSave={handleSaveSecurityConfig}
              />
            )
          },
          {
            key: 'api',
            label: (
              <span>
                <ApiOutlined />
                接口管理
              </span>
            ),
            children: <ApiManagement />
          },
          {
            key: 'notification',
            label: (
              <span>
                <BellOutlined />
                通知配置
              </span>
            ),
            children: (
              <Card title="通知配置" className="mb-4">
                <Alert
                  message="通知配置功能"
                  description="邮件、短信、推送通知等配置功能正在开发中..."
                  type="info"
                  showIcon
                />
              </Card>
            )
          },
          {
            key: 'storage',
            label: (
              <span>
                <DatabaseOutlined />
                存储配置
              </span>
            ),
            children: (
              <Card title="存储配置" className="mb-4">
                <Alert
                  message="存储配置功能"
                  description="文件存储、备份策略等配置功能正在开发中..."
                  type="info"
                  showIcon
                />
              </Card>
            )
          }
        ]}
      />
    </div>
  );
};

export default SettingsPage;