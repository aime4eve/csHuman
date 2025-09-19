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
  Tree,
  Tabs,
  Tag,
  Popconfirm,
  App,
  Row,
  Col,
  Statistic,
  Badge,
  Tooltip,
  Switch,
  DatePicker,
  Typography,
  Divider,
  Transfer,
  Avatar,
  Timeline
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  AuditOutlined,
  BranchesOutlined,
  CrownOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import type { TransferDirection } from 'antd/es/transfer';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
// const { TabPane } = Tabs; // 已废弃，使用 items 属性替代
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// 类型定义
interface User {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  roles: string[];
  status: 'active' | 'inactive' | 'locked';
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  level: 'system' | 'department' | 'custom';
}

interface Permission {
  id: string;
  name: string;
  code: string;
  type: 'menu' | 'button' | 'api' | 'data';
  parentId?: string;
  description: string;
  resource: string;
  action: string;
  status: 'active' | 'inactive';
}

interface PermissionRequest {
  id: string;
  userId: string;
  userName: string;
  requestType: 'role_assign' | 'permission_grant' | 'access_apply';
  targetResource: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestTime: string;
  approver?: string;
  approveTime?: string;
  comments?: string;
}

/**
 * 权限管理页面
 * @author 伍志勇
 */
const PermissionPage: React.FC = () => {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // 模态框状态
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [assignRoleModalVisible, setAssignRoleModalVisible] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingRequest, setEditingRequest] = useState<PermissionRequest | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [userForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [requestForm] = Form.useForm();

  // 模拟数据
  const mockUsers: User[] = [
    {
      id: '1',
      username: 'admin',
      realName: '系统管理员',
      email: 'admin@company.com',
      phone: '13800138001',
      department: '信息技术部',
      position: '系统管理员',
      roles: ['system_admin', 'knowledge_admin'],
      status: 'active',
      lastLogin: '2024-01-20 14:30:00',
      createdAt: '2023-01-01 00:00:00',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    },
    {
      id: '2',
      username: 'knowledge_manager',
      realName: '张知识',
      email: 'zhang@company.com',
      phone: '13800138002',
      department: '知识管理部',
      position: '知识管理专员',
      roles: ['knowledge_manager', 'content_editor'],
      status: 'active',
      lastLogin: '2024-01-20 13:45:00',
      createdAt: '2023-02-15 00:00:00',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang'
    },
    {
      id: '3',
      username: 'content_editor',
      realName: '李编辑',
      email: 'li@company.com',
      phone: '13800138003',
      department: '内容运营部',
      position: '内容编辑',
      roles: ['content_editor'],
      status: 'active',
      lastLogin: '2024-01-20 12:20:00',
      createdAt: '2023-03-10 00:00:00',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li'
    },
    {
      id: '4',
      username: 'dialog_user',
      realName: '王对话',
      email: 'wang@company.com',
      phone: '13800138004',
      department: '业务部门',
      position: '业务专员',
      roles: ['dialog_user'],
      status: 'active',
      lastLogin: '2024-01-20 11:15:00',
      createdAt: '2023-04-20 00:00:00',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang'
    },
    {
      id: '5',
      username: 'auditor',
      realName: '赵审核',
      email: 'zhao@company.com',
      phone: '13800138005',
      department: '质量管理部',
      position: '内容审核员',
      roles: ['content_auditor'],
      status: 'inactive',
      lastLogin: '2024-01-19 16:30:00',
      createdAt: '2023-05-15 00:00:00',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao'
    }
  ];

  const mockRoles: Role[] = [
    {
      id: 'system_admin',
      name: '系统管理员',
      code: 'SYSTEM_ADMIN',
      description: '拥有系统所有权限，可以管理用户、角色和系统配置',
      permissions: ['user_manage', 'role_manage', 'system_config', 'data_export', 'audit_log'],
      userCount: 1,
      status: 'active',
      createdAt: '2023-01-01 00:00:00',
      level: 'system'
    },
    {
      id: 'knowledge_admin',
      name: '知识库管理员',
      code: 'KNOWLEDGE_ADMIN',
      description: '管理知识库内容、分类和权限配置',
      permissions: ['knowledge_manage', 'category_manage', 'content_audit', 'permission_assign'],
      userCount: 2,
      status: 'active',
      createdAt: '2023-01-01 00:00:00',
      level: 'system'
    },
    {
      id: 'knowledge_manager',
      name: '知识管理专员',
      code: 'KNOWLEDGE_MANAGER',
      description: '负责知识内容的创建、编辑和维护',
      permissions: ['content_create', 'content_edit', 'content_delete', 'category_view'],
      userCount: 3,
      status: 'active',
      createdAt: '2023-02-01 00:00:00',
      level: 'department'
    },
    {
      id: 'content_editor',
      name: '内容编辑',
      code: 'CONTENT_EDITOR',
      description: '创建和编辑知识内容',
      permissions: ['content_create', 'content_edit', 'content_view'],
      userCount: 5,
      status: 'active',
      createdAt: '2023-02-15 00:00:00',
      level: 'department'
    },
    {
      id: 'content_auditor',
      name: '内容审核员',
      code: 'CONTENT_AUDITOR',
      description: '审核知识内容的质量和合规性',
      permissions: ['content_audit', 'content_approve', 'content_reject', 'audit_history'],
      userCount: 2,
      status: 'active',
      createdAt: '2023-03-01 00:00:00',
      level: 'department'
    },
    {
      id: 'dialog_user',
      name: '对话用户',
      code: 'DIALOG_USER',
      description: '使用智能对话功能进行知识查询',
      permissions: ['dialog_chat', 'knowledge_search', 'content_view'],
      userCount: 50,
      status: 'active',
      createdAt: '2023-01-01 00:00:00',
      level: 'custom'
    }
  ];

  const mockPermissions: Permission[] = [
    { id: 'user_manage', name: '用户管理', code: 'USER_MANAGE', type: 'menu', description: '管理系统用户', resource: '/users', action: 'manage', status: 'active' },
    { id: 'role_manage', name: '角色管理', code: 'ROLE_MANAGE', type: 'menu', description: '管理系统角色', resource: '/roles', action: 'manage', status: 'active' },
    { id: 'system_config', name: '系统配置', code: 'SYSTEM_CONFIG', type: 'menu', description: '系统参数配置', resource: '/config', action: 'manage', status: 'active' },
    { id: 'knowledge_manage', name: '知识库管理', code: 'KNOWLEDGE_MANAGE', type: 'menu', description: '管理知识库', resource: '/knowledge', action: 'manage', status: 'active' },
    { id: 'content_create', name: '内容创建', code: 'CONTENT_CREATE', type: 'button', description: '创建知识内容', resource: '/content', action: 'create', status: 'active' },
    { id: 'content_edit', name: '内容编辑', code: 'CONTENT_EDIT', type: 'button', description: '编辑知识内容', resource: '/content', action: 'edit', status: 'active' },
    { id: 'content_delete', name: '内容删除', code: 'CONTENT_DELETE', type: 'button', description: '删除知识内容', resource: '/content', action: 'delete', status: 'active' },
    { id: 'content_audit', name: '内容审核', code: 'CONTENT_AUDIT', type: 'button', description: '审核知识内容', resource: '/content', action: 'audit', status: 'active' },
    { id: 'dialog_chat', name: '智能对话', code: 'DIALOG_CHAT', type: 'api', description: '使用智能对话功能', resource: '/api/chat', action: 'use', status: 'active' },
    { id: 'data_export', name: '数据导出', code: 'DATA_EXPORT', type: 'api', description: '导出系统数据', resource: '/api/export', action: 'export', status: 'active' }
  ];

  const mockRequests: PermissionRequest[] = [
    {
      id: '1',
      userId: '4',
      userName: '王对话',
      requestType: 'role_assign',
      targetResource: '内容编辑角色',
      reason: '需要协助编辑部门知识文档',
      status: 'pending',
      requestTime: '2024-01-20 10:30:00'
    },
    {
      id: '2',
      userId: '5',
      userName: '赵审核',
      requestType: 'permission_grant',
      targetResource: '数据导出权限',
      reason: '需要导出审核报告数据',
      status: 'approved',
      requestTime: '2024-01-19 14:20:00',
      approver: '系统管理员',
      approveTime: '2024-01-19 15:30:00',
      comments: '已批准，有效期3个月'
    },
    {
      id: '3',
      userId: '3',
      userName: '李编辑',
      requestType: 'access_apply',
      targetResource: '高级编辑功能',
      reason: '工作需要使用高级编辑功能',
      status: 'rejected',
      requestTime: '2024-01-18 16:45:00',
      approver: '知识库管理员',
      approveTime: '2024-01-19 09:15:00',
      comments: '当前角色权限已足够，暂不需要额外权限'
    }
  ];

  // 权限树数据
  const permissionTreeData: DataNode[] = [
    {
      title: '系统管理',
      key: 'system',
      children: [
        { title: '用户管理', key: 'user_manage' },
        { title: '角色管理', key: 'role_manage' },
        { title: '系统配置', key: 'system_config' }
      ]
    },
    {
      title: '知识库管理',
      key: 'knowledge',
      children: [
        { title: '知识库管理', key: 'knowledge_manage' },
        { title: '分类管理', key: 'category_manage' },
        { title: '内容管理', key: 'content_manage' }
      ]
    },
    {
      title: '内容操作',
      key: 'content',
      children: [
        { title: '内容创建', key: 'content_create' },
        { title: '内容编辑', key: 'content_edit' },
        { title: '内容删除', key: 'content_delete' },
        { title: '内容审核', key: 'content_audit' }
      ]
    },
    {
      title: '对话功能',
      key: 'dialog',
      children: [
        { title: '智能对话', key: 'dialog_chat' },
        { title: '知识检索', key: 'knowledge_search' }
      ]
    }
  ];

  // 初始化数据
  useEffect(() => {
    setUsers(mockUsers);
    setRoles(mockRoles);
    setPermissions(mockPermissions);
    setRequests(mockRequests);
  }, []);

  // 用户表格列定义
  const userColumns: ColumnsType<User> = [
    {
      title: '用户信息',
      key: 'userInfo',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.realName}</div>
            <div className="text-gray-500 text-sm">@{record.username}</div>
          </div>
        </Space>
      )
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div>{record.email}</div>
          <div className="text-gray-500 text-sm">{record.phone}</div>
        </div>
      )
    },
    {
      title: '部门职位',
      key: 'department',
      render: (_, record) => (
        <div>
          <div>{record.department}</div>
          <div className="text-gray-500 text-sm">{record.position}</div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <Space wrap>
          {roles.map(roleId => {
            const role = mockRoles.find(r => r.id === roleId);
            return role ? (
              <Tag key={roleId} color={role.level === 'system' ? 'red' : role.level === 'department' ? 'blue' : 'green'}>
                {role.name}
              </Tag>
            ) : null;
          })}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'success', text: '正常' },
          inactive: { color: 'warning', text: '停用' },
          locked: { color: 'error', text: '锁定' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge status={config.color as any} text={config.text} />;
      }
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
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
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewUser(record)} />
          </Tooltip>
          <Tooltip title="编辑用户">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEditUser(record)} />
          </Tooltip>
          <Tooltip title="分配角色">
            <Button type="text" icon={<TeamOutlined />} onClick={() => handleAssignRole(record)} />
          </Tooltip>
          <Popconfirm title="确定删除此用户？" onConfirm={() => handleDeleteUser(record.id)}>
            <Tooltip title="删除用户">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 角色表格列定义
  const roleColumns: ColumnsType<Role> = [
    {
      title: '角色信息',
      key: 'roleInfo',
      render: (_, record) => (
        <Space>
          <Avatar 
            icon={record.level === 'system' ? <CrownOutlined /> : record.level === 'department' ? <TeamOutlined /> : <UserOutlined />}
            style={{ backgroundColor: record.level === 'system' ? '#f50' : record.level === 'department' ? '#1890ff' : '#52c41a' }}
          />
          <div>
            <div className="font-medium">{record.name}</div>
            <div className="text-gray-500 text-sm">{record.code}</div>
          </div>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const levelConfig = {
          system: { color: 'red', text: '系统级' },
          department: { color: 'blue', text: '部门级' },
          custom: { color: 'green', text: '自定义' }
        };
        const config = levelConfig[level as keyof typeof levelConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '权限数',
      key: 'permissionCount',
      render: (_, record) => (
        <Badge count={record.permissions.length} style={{ backgroundColor: '#1890ff' }} />
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '启用' : '停用'} />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看权限">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewRolePermissions(record)} />
          </Tooltip>
          <Tooltip title="编辑角色">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEditRole(record)} />
          </Tooltip>
          <Tooltip title="复制角色">
            <Button type="text" icon={<BranchesOutlined />} onClick={() => handleCopyRole(record)} />
          </Tooltip>
          <Popconfirm title="确定删除此角色？" onConfirm={() => handleDeleteRole(record.id)}>
            <Tooltip title="删除角色">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 权限申请表格列定义
  const requestColumns: ColumnsType<PermissionRequest> = [
    {
      title: '申请人',
      dataIndex: 'userName',
      key: 'userName',
      render: (name: string, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: '申请类型',
      dataIndex: 'requestType',
      key: 'requestType',
      render: (type: string) => {
        const typeConfig = {
          role_assign: { color: 'blue', text: '角色分配' },
          permission_grant: { color: 'green', text: '权限授予' },
          access_apply: { color: 'orange', text: '访问申请' }
        };
        const config = typeConfig[type as keyof typeof typeConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '目标资源',
      dataIndex: 'targetResource',
      key: 'targetResource'
    },
    {
      title: '申请原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'processing', text: '待审批' },
          approved: { color: 'success', text: '已批准' },
          rejected: { color: 'error', text: '已拒绝' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Badge status={config.color as any} text={config.text} />;
      }
    },
    {
      title: '申请时间',
      dataIndex: 'requestTime',
      key: 'requestTime',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewRequest(record)} />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="批准">
                <Button type="text" icon={<CheckOutlined />} onClick={() => handleApproveRequest(record.id)} />
              </Tooltip>
              <Tooltip title="拒绝">
                <Button type="text" danger icon={<CloseOutlined />} onClick={() => handleRejectRequest(record.id)} />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  // 事件处理函数
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setUserModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    userForm.setFieldsValue(user);
    setUserModalVisible(true);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    message.success('用户删除成功');
  };

  const handleAssignRole = (user: User) => {
    setSelectedUser(user);
    setAssignRoleModalVisible(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    roleForm.setFieldsValue({
      ...role,
      permissions: role.permissions
    });
    setRoleModalVisible(true);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(r => r.id !== roleId));
    message.success('角色删除成功');
  };

  const handleCopyRole = (role: Role) => {
    const newRole = {
      ...role,
      id: `${role.id}_copy_${Date.now()}`,
      name: `${role.name}(副本)`,
      code: `${role.code}_COPY`,
      userCount: 0
    };
    setRoles([...roles, newRole]);
    message.success('角色复制成功');
  };

  const handleViewRolePermissions = (role: Role) => {
    Modal.info({
      title: `${role.name} - 权限详情`,
      width: 600,
      content: (
        <div className="mt-4">
          <Space wrap>
            {role.permissions.map(permId => {
              const perm = mockPermissions.find(p => p.id === permId);
              return perm ? (
                <Tag key={permId} color="blue">
                  {perm.name}
                </Tag>
              ) : null;
            })}
          </Space>
        </div>
      )
    });
  };

  const handleViewRequest = (request: PermissionRequest) => {
    setEditingRequest(request);
    setRequestModalVisible(true);
  };

  const handleApproveRequest = (requestId: string) => {
    setRequests(requests.map(r => 
      r.id === requestId 
        ? { ...r, status: 'approved', approver: '当前用户', approveTime: dayjs().format('YYYY-MM-DD HH:mm:ss') }
        : r
    ));
    message.success('申请已批准');
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(requests.map(r => 
      r.id === requestId 
        ? { ...r, status: 'rejected', approver: '当前用户', approveTime: dayjs().format('YYYY-MM-DD HH:mm:ss') }
        : r
    ));
    message.success('申请已拒绝');
  };

  const handleUserSubmit = async (values: any) => {
    try {
      if (editingUser) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...values } : u));
        message.success('用户更新成功');
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          ...values,
          status: 'active',
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          lastLogin: '-',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.username}`
        };
        setUsers([...users, newUser]);
        message.success('用户创建成功');
      }
      setUserModalVisible(false);
      setEditingUser(null);
      userForm.resetFields();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleRoleSubmit = async (values: any) => {
    try {
      if (editingRole) {
        setRoles(roles.map(r => r.id === editingRole.id ? { ...r, ...values } : r));
        message.success('角色更新成功');
      } else {
        const newRole: Role = {
          id: Date.now().toString(),
          ...values,
          userCount: 0,
          status: 'active',
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
        };
        setRoles([...roles, newRole]);
        message.success('角色创建成功');
      }
      setRoleModalVisible(false);
      setEditingRole(null);
      roleForm.resetFields();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 统计数据
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalRoles: roles.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题和统计 */}
      <div className="mb-6">
        <Title level={2} className="mb-4">
          <SafetyCertificateOutlined className="mr-2" />
          权限管理
        </Title>
        
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={stats.activeUsers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="角色数量"
                value={stats.totalRoles}
                prefix={<SafetyOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待审批"
                value={stats.pendingRequests}
                prefix={<AuditOutlined />}
                valueStyle={{ color: '#fa8c16' }}
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
              key: 'users',
              label: <span><UserOutlined />用户管理</span>,
              children: (
                <>
                  <div className="mb-4">
                    <Space>
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => setUserModalVisible(true)}>
                        新增用户
                      </Button>
                      <Button icon={<TeamOutlined />}>批量分配角色</Button>
                      <Button icon={<SettingOutlined />}>导入用户</Button>
                    </Space>
                  </div>
                  
                  <Table
                    columns={userColumns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    rowSelection={{
                      selectedRowKeys,
                      onChange: setSelectedRowKeys
                    }}
                    pagination={{
                      total: users.length,
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
              key: 'roles',
              label: <span><SafetyOutlined />角色管理</span>,
              children: (
                <>
                  <div className="mb-4">
                    <Space>
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => setRoleModalVisible(true)}>
                        新增角色
                      </Button>
                      <Button icon={<BranchesOutlined />}>角色继承</Button>
                      <Button icon={<SettingOutlined />}>权限模板</Button>
                    </Space>
                  </div>
                  
                  <Table
                    columns={roleColumns}
                    dataSource={roles}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      total: roles.length,
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
              key: 'requests',
              label: <span><AuditOutlined />权限申请</span>,
              children: (
                <>
                  <div className="mb-4">
                    <Space>
                      <Button type="primary" icon={<PlusOutlined />}>新建申请</Button>
                      <Select defaultValue="all" style={{ width: 120 }}>
                        <Option value="all">全部状态</Option>
                        <Option value="pending">待审批</Option>
                        <Option value="approved">已批准</Option>
                        <Option value="rejected">已拒绝</Option>
                      </Select>
                      <RangePicker placeholder={['开始日期', '结束日期']} />
                    </Space>
                  </div>
                  
                  <Table
                    columns={requestColumns}
                    dataSource={requests}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      total: requests.length,
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
                    }}
                  />
                </>
              )
            }
          ]}
        />
      </Card>

      {/* 用户编辑模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={userModalVisible}
        onCancel={() => {
          setUserModalVisible(false);
          setEditingUser(null);
          setSelectedUser(null);
          userForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleUserSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="realName" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
                <Select placeholder="请选择部门">
                  <Option value="信息技术部">信息技术部</Option>
                  <Option value="知识管理部">知识管理部</Option>
                  <Option value="内容运营部">内容运营部</Option>
                  <Option value="业务部门">业务部门</Option>
                  <Option value="质量管理部">质量管理部</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label="职位" rules={[{ required: true, message: '请输入职位' }]}>
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="roles" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select mode="multiple" placeholder="请选择角色">
              {roles.map(role => (
                <Option key={role.id} value={role.id}>{role.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">正常</Option>
              <Option value="inactive">停用</Option>
              <Option value="locked">锁定</Option>
            </Select>
          </Form.Item>
          
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                setUserModalVisible(false);
                setEditingUser(null);
                userForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色编辑模态框 */}
      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={roleModalVisible}
        onCancel={() => {
          setRoleModalVisible(false);
          setEditingRole(null);
          roleForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleRoleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="code" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }]}>
                <Input placeholder="请输入角色编码" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="description" label="角色描述">
            <TextArea rows={3} placeholder="请输入角色描述" />
          </Form.Item>
          
          <Form.Item name="level" label="角色级别" rules={[{ required: true, message: '请选择角色级别' }]}>
            <Select placeholder="请选择角色级别">
              <Option value="system">系统级</Option>
              <Option value="department">部门级</Option>
              <Option value="custom">自定义</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="permissions" label="权限配置" rules={[{ required: true, message: '请选择权限' }]}>
            <Tree
              checkable
              treeData={permissionTreeData}
              defaultExpandAll
            />
          </Form.Item>
          
          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => {
                setRoleModalVisible(false);
                setEditingRole(null);
                roleForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRole ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色分配模态框 */}
      <Modal
        title={`为 ${selectedUser?.realName} 分配角色`}
        open={assignRoleModalVisible}
        onCancel={() => {
          setAssignRoleModalVisible(false);
          setSelectedUser(null);
        }}
        onOk={() => {
          message.success('角色分配成功');
          setAssignRoleModalVisible(false);
          setSelectedUser(null);
        }}
        width={600}
      >
        {selectedUser && (
          <div>
            <div className="mb-4">
              <Text strong>当前角色：</Text>
              <div className="mt-2">
                <Space wrap>
                  {selectedUser.roles.map(roleId => {
                    const role = roles.find(r => r.id === roleId);
                    return role ? (
                      <Tag key={roleId} color="blue">
                        {role.name}
                      </Tag>
                    ) : null;
                  })}
                </Space>
              </div>
            </div>
            
            <Divider />
            
            <div>
              <Text strong>可分配角色：</Text>
              <div className="mt-2">
                <Space wrap>
                  {roles.filter(role => !selectedUser.roles.includes(role.id)).map(role => (
                    <Tag key={role.id} color="green" style={{ cursor: 'pointer' }}>
                      + {role.name}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 权限申请详情模态框 */}
      <Modal
        title="权限申请详情"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          setEditingRequest(null);
        }}
        footer={editingRequest?.status === 'pending' ? [
          <Button key="reject" danger onClick={() => {
            handleRejectRequest(editingRequest.id);
            setRequestModalVisible(false);
          }}>
            拒绝
          </Button>,
          <Button key="approve" type="primary" onClick={() => {
            handleApproveRequest(editingRequest.id);
            setRequestModalVisible(false);
          }}>
            批准
          </Button>
        ] : null}
        width={600}
      >
        {editingRequest && (
          <div>
            <Timeline>
              <Timeline.Item color="blue">
                <div>
                  <Text strong>申请提交</Text>
                  <div className="text-gray-500">{editingRequest.requestTime}</div>
                  <div className="mt-2">
                    <Text>申请人：{editingRequest.userName}</Text><br />
                    <Text>申请类型：{editingRequest.requestType}</Text><br />
                    <Text>目标资源：{editingRequest.targetResource}</Text><br />
                    <Text>申请原因：{editingRequest.reason}</Text>
                  </div>
                </div>
              </Timeline.Item>
              
              {editingRequest.status !== 'pending' && (
                <Timeline.Item color={editingRequest.status === 'approved' ? 'green' : 'red'}>
                  <div>
                    <Text strong>{editingRequest.status === 'approved' ? '申请批准' : '申请拒绝'}</Text>
                    <div className="text-gray-500">{editingRequest.approveTime}</div>
                    <div className="mt-2">
                      <Text>审批人：{editingRequest.approver}</Text><br />
                      {editingRequest.comments && (
                        <Text>审批意见：{editingRequest.comments}</Text>
                      )}
                    </div>
                  </div>
                </Timeline.Item>
              )}
            </Timeline>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PermissionPage;