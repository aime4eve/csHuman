/**
 * 图谱相关类型定义
 * @author 伍志勇
 */

// 图谱节点类型定义
export interface GraphNode {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'concept' | 'document' | 'process' | 'system';
  properties: Record<string, any>;
  description?: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
}

// 图谱关系类型定义
export interface GraphRelation {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
  weight: number;
  label?: string;
}

// 图谱数据类型定义
export interface GraphData {
  nodes: GraphNode[];
  relations: GraphRelation[];
}

// 路径查询结果类型定义
export interface PathResult {
  id: string;
  path: string[];
  relations: string[];
  distance: number;
  confidence: number;
}

// 布局类型
export type LayoutType = 'force' | 'circular' | 'grid' | 'hierarchical';

// 节点类型颜色映射
export const NODE_TYPE_COLORS = {
  person: '#1677FF',
  organization: '#52C41A',
  concept: '#FA8C16',
  document: '#722ED1',
  process: '#EB2F96',
  system: '#13C2C2'
} as const;

// 节点类型中文名称映射
export const NODE_TYPE_NAMES = {
  person: '人员',
  organization: '组织',
  concept: '概念',
  document: '文档',
  process: '流程',
  system: '系统'
} as const;