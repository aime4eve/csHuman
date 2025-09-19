/**
 * 主布局组件 - 包含侧边栏、顶部栏和主内容区域
 * @author 伍志勇
 */
import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Badge, Space, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  FolderOutlined,
  FileTextOutlined,
  UserOutlined,
  AuditOutlined,
  SearchOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
  MessageOutlined,
  NodeIndexOutlined,
  ControlOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  RobotOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useGlobalStore } from '../../store';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

/**
 * 主布局组件
 */
const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, setCollapsed, user, setUser, setAuthenticated } = useGlobalStore();

  // 菜单项配置
  const menuItems = [
    {
      key: 'basic-functions',
      icon: <AppstoreOutlined />,
      label: '基础功能',
      type: 'group' as const,
      children: [
        {
          key: '/',
          icon: <HomeOutlined />,
          label: '知识门户',
        },
        {
          key: '/category',
          icon: <FolderOutlined />,
          label: '分类管理',
        },
        {
          key: '/content',
          icon: <FileTextOutlined />,
          label: '内容管理',
        },
        {
          key: '/search',
          icon: <SearchOutlined />,
          label: '搜索检索',
        }
      ]
    },
    {
      key: 'ai-functions',
      icon: <RobotOutlined />,
      label: '智能AI功能',
      type: 'group' as const,
      children: [
        {
          key: '/chat',
          icon: <MessageOutlined />,
          label: '智能对话',
        },
        {
          key: '/extraction',
          icon: <FileTextOutlined />,
          label: '内容提炼',
        },
        {
          key: '/knowledge-graph',
          icon: <NodeIndexOutlined />,
          label: '知识图谱',
        }
      ]
    },
    {
      key: 'management-functions',
      icon: <TeamOutlined />,
      label: '管理功能',
      type: 'group' as const,
      children: [
        {
          key: '/permission',
          icon: <UserOutlined />,
          label: '权限管理',
        },
        {
          key: '/audit',
          icon: <AuditOutlined />,
          label: '审核工作台',
        },
        {
          key: '/analytics',
          icon: <BarChartOutlined />,
          label: '统计分析',
        },
        {
          key: '/chat-management',
          icon: <ControlOutlined />,
          label: '对话管理',
        },
        {
          key: '/training-data',
          icon: <DatabaseOutlined />,
          label: '训练数据',
        }
      ]
    },
    {
      key: 'system-functions',
      icon: <SettingOutlined />,
      label: '系统功能',
      type: 'group' as const,
      children: [
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: '系统设置',
        }
      ]
    }
  ];

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserSwitchOutlined />,
      label: '个人资料',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      setUser(null);
      setAuthenticated(false);
      navigate('/login');
    } else if (key === 'profile') {
      navigate('/profile');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
          borderRight: '1px solid #f0f0f0'
        }}
      >
        {/* Logo区域 */}
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {collapsed ? (
            <div style={{ 
              width: 32, 
              height: 32, 
              background: '#1890ff', 
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              知
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 32, 
                height: 32, 
                background: '#1890ff', 
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                知
              </div>
              <Text strong style={{ color: '#1890ff', fontSize: 16 }}>知识库管理</Text>
            </div>
          )}
        </div>
        
        {/* 导航菜单 */}
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        {/* 顶部导航栏 */}
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
          </div>
          
          <Space size="middle">
            {/* 通知铃铛 */}
            <Badge count={5} size="small">
              <Button type="text" icon={<BellOutlined />} size="large" />
            </Badge>
            
            {/* 用户信息 */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick
              }}
              placement="bottomRight"
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 6,
                transition: 'background-color 0.2s'
              }}>
                <Avatar 
                  size="small" 
                  src={user?.avatar} 
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 14, fontWeight: 500 }}>
                    {user?.name || '未登录'}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user?.role === 'admin' ? '系统管理员' :
                     user?.role === 'department_admin' ? '部门管理员' :
                     user?.role === 'contributor' ? '知识贡献者' :
                     user?.role === 'consumer' ? '知识消费者' :
                     user?.role === 'auditor' ? '审核专员' : '访客'}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>
        
        {/* 主内容区域 */}
        <Content style={{ 
          margin: '24px', 
          padding: '24px',
          background: '#fff',
          borderRadius: 8,
          minHeight: 'calc(100vh - 112px)',
          overflow: 'auto'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;