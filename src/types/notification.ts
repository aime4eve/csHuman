/**
 * 通知相关类型定义
 * 作者：伍志勇
 * 日期：2025年1月20日
 */

// 通知类型枚举
export enum NotificationType {
  SYSTEM = 'system',           // 系统通知
  KNOWLEDGE = 'knowledge',     // 知识库相关
  AUDIT = 'audit',            // 审核通知
  COMMENT = 'comment',        // 评论通知
  LIKE = 'like',              // 点赞通知
  FOLLOW = 'follow',          // 关注通知
  REMINDER = 'reminder'       // 提醒通知
}

// 通知优先级
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 通知状态
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived'
}

// 通知接口
export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  actionUrl?: string;          // 点击通知后跳转的URL
  actionText?: string;         // 操作按钮文本
  metadata?: Record<string, any>; // 额外的元数据
}

// 通知统计信息
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// 通知查询参数
export interface NotificationQuery {
  page?: number;
  pageSize?: number;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  startDate?: string;
  endDate?: string;
}

// 通知操作结果
export interface NotificationActionResult {
  success: boolean;
  message?: string;
  data?: any;
}

// 批量操作参数
export interface BatchNotificationAction {
  ids: string[];
  action: 'read' | 'unread' | 'archive' | 'delete';
}