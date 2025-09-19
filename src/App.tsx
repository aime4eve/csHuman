/**
 * 主应用组件 - 配置路由和全局主题
 * @author 伍志勇
 */
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

// 导入布局组件
import MainLayout from '@/components/Layout/MainLayout';

// 导入页面组件
import HomePage from '@/pages/Home';
import CategoryPage from '@/pages/Category';
import ContentPage from '@/pages/Content';
import PermissionPage from '@/pages/Permission';
import AuditPage from '@/pages/Audit';
import SearchPage from '@/pages/Search';
import AnalyticsPage from '@/pages/Analytics';
import SettingsPage from '@/pages/Settings';
import ChatPage from './pages/Chat';
import ExtractionPage from './pages/Extraction';
import KnowledgeGraphPage from './pages/KnowledgeGraph';
import ChatManagementPage from './pages/ChatManagement';
import TrainingDataPage from './pages/TrainingData';

// 导入状态管理
import { useGlobalStore } from './store';
import { defaultUser } from './data/mockData';

// 设置dayjs中文
dayjs.locale('zh-cn');

/**
 * 主应用组件
 */
const App: React.FC = () => {
  const { theme: appTheme, setUser, setAuthenticated } = useGlobalStore();

  // 初始化用户数据（模拟登录状态）
  useEffect(() => {
    setUser(defaultUser);
    setAuthenticated(true);
  }, [setUser, setAuthenticated]);

  // 主题配置
  const themeConfig = {
    algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      colorBgContainer: '#ffffff',
    },
  };

  return (
    <ConfigProvider 
      locale={zhCN} 
      theme={themeConfig}
    >
      <AntdApp>
        <Router>
          <Routes>
            {/* 主布局路由 */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="category" element={<CategoryPage />} />
              <Route path="content" element={<ContentPage />} />
              <Route path="permission" element={<PermissionPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="extraction" element={<ExtractionPage />} />
              <Route path="knowledge-graph" element={<KnowledgeGraphPage />} />
              <Route path="chat-management" element={<ChatManagementPage />} />
              <Route path="training-data" element={<TrainingDataPage />} />
            </Route>
            
            {/* 重定向到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
