/**
 * 全局状态管理 - Zustand Store
 * @author 伍志勇
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 用户信息接口
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'department_admin' | 'contributor' | 'consumer' | 'auditor';
  department: string;
  avatar?: string;
  permissions?: string[];
}

// 知识内容接口
export interface Knowledge {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'review' | 'published' | 'expired' | 'archived';
  category: string;
  tags: string[];
  creator: string;
  createdAt: string;
  updatedAt: string;
  expireDate?: string;
}

// 全局状态接口
interface GlobalState {
  // 用户相关
  user: User | null;
  isAuthenticated: boolean;
  
  // 主题相关
  theme: 'light' | 'dark';
  collapsed: boolean;
  
  // 知识库相关
  knowledgeList: Knowledge[];
  selectedKnowledge: Knowledge | null;
  
  // 操作方法
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setCollapsed: (collapsed: boolean) => void;
  setKnowledgeList: (list: Knowledge[]) => void;
  setSelectedKnowledge: (knowledge: Knowledge | null) => void;
}

// 创建全局状态store
export const useGlobalStore = create<GlobalState>()(devtools(
  (set) => ({
    // 初始状态
    user: null,
    isAuthenticated: false,
    theme: 'light',
    collapsed: false,
    knowledgeList: [],
    selectedKnowledge: null,
    
    // 操作方法
    setUser: (user) => set({ user }),
    setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
    setTheme: (theme) => set({ theme }),
    setCollapsed: (collapsed) => set({ collapsed }),
    setKnowledgeList: (list) => set({ knowledgeList: list }),
    setSelectedKnowledge: (knowledge) => set({ selectedKnowledge: knowledge }),
  }),
  { name: 'global-store' }
));

// 导出类型
export type { GlobalState };