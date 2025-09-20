/**
 * 通知数据管理Hook
 * 作者：伍志勇
 * 日期：2025年1月20日
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Notification, 
  NotificationStats, 
  NotificationQuery, 
  NotificationActionResult,
  NotificationType,
  NotificationPriority,
  NotificationStatus
} from '../types/notification';

// 模拟通知数据
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: '系统维护通知',
    content: '系统将于今晚22:00-24:00进行维护，期间可能影响正常使用',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.HIGH,
    status: NotificationStatus.UNREAD,
    userId: 'user1',
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
    actionUrl: '/system/maintenance',
    actionText: '查看详情'
  },
  {
    id: '2',
    title: '知识文档审核通过',
    content: '您提交的《React最佳实践指南》已通过审核并发布',
    type: NotificationType.AUDIT,
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.UNREAD,
    userId: 'user1',
    createdAt: '2025-01-20T09:30:00Z',
    updatedAt: '2025-01-20T09:30:00Z',
    actionUrl: '/knowledge/documents/123',
    actionText: '查看文档'
  },
  {
    id: '3',
    title: '新的评论',
    content: '张三对您的文档《TypeScript进阶教程》发表了评论',
    type: NotificationType.COMMENT,
    priority: NotificationPriority.LOW,
    status: NotificationStatus.UNREAD,
    userId: 'user1',
    createdAt: '2025-01-20T08:45:00Z',
    updatedAt: '2025-01-20T08:45:00Z',
    actionUrl: '/knowledge/documents/456#comments',
    actionText: '查看评论'
  },
  {
    id: '4',
    title: '文档获得点赞',
    content: '您的文档《Vue3组件设计模式》获得了5个新的点赞',
    type: NotificationType.LIKE,
    priority: NotificationPriority.LOW,
    status: NotificationStatus.read,
    userId: 'user1',
    createdAt: '2025-01-19T16:20:00Z',
    updatedAt: '2025-01-19T16:20:00Z',
    readAt: '2025-01-19T18:00:00Z',
    actionUrl: '/knowledge/documents/789'
  },
  {
    id: '5',
    title: '定期备份提醒',
    content: '建议您定期备份重要的知识文档，确保数据安全',
    type: NotificationType.REMINDER,
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.UNREAD,
    userId: 'user1',
    createdAt: '2025-01-19T14:00:00Z',
    updatedAt: '2025-01-19T14:00:00Z',
    actionUrl: '/settings/backup',
    actionText: '立即备份'
  }
];

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byType: {} as Record<NotificationType, number>,
    byPriority: {} as Record<NotificationPriority, number>
  });

  // 计算统计信息
  const calculateStats = useCallback((notificationList: Notification[]): NotificationStats => {
    const stats: NotificationStats = {
      total: notificationList.length,
      unread: notificationList.filter(n => n.status === NotificationStatus.UNREAD).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>
    };

    // 按类型统计
    Object.values(NotificationType).forEach(type => {
      stats.byType[type] = notificationList.filter(n => n.type === type).length;
    });

    // 按优先级统计
    Object.values(NotificationPriority).forEach(priority => {
      stats.byPriority[priority] = notificationList.filter(n => n.priority === priority).length;
    });

    return stats;
  }, []);

  // 获取通知列表
  const fetchNotifications = useCallback(async (query?: NotificationQuery) => {
    setLoading(true);
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredNotifications = [...mockNotifications];
      
      // 应用过滤条件
      if (query) {
        if (query.type) {
          filteredNotifications = filteredNotifications.filter(n => n.type === query.type);
        }
        if (query.status) {
          filteredNotifications = filteredNotifications.filter(n => n.status === query.status);
        }
        if (query.priority) {
          filteredNotifications = filteredNotifications.filter(n => n.priority === query.priority);
        }
      }
      
      // 按创建时间倒序排列
      filteredNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setNotifications(filteredNotifications);
      setStats(calculateStats(filteredNotifications));
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  // 标记通知为已读
  const markAsRead = useCallback(async (notificationId: string): Promise<NotificationActionResult> => {
    try {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: NotificationStatus.read, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      // 重新计算统计信息
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, status: NotificationStatus.read, readAt: new Date().toISOString() }
          : notification
      );
      setStats(calculateStats(updatedNotifications));
      
      return { success: true, message: '标记为已读成功' };
    } catch (error) {
      console.error('标记已读失败:', error);
      return { success: false, message: '标记为已读失败' };
    }
  }, [notifications, calculateStats]);

  // 标记所有通知为已读
  const markAllAsRead = useCallback(async (): Promise<NotificationActionResult> => {
    try {
      const now = new Date().toISOString();
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          status: NotificationStatus.read,
          readAt: notification.readAt || now
        }))
      );
      
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        status: NotificationStatus.read,
        readAt: notification.readAt || now
      }));
      setStats(calculateStats(updatedNotifications));
      
      return { success: true, message: '全部标记为已读成功' };
    } catch (error) {
      console.error('标记全部已读失败:', error);
      return { success: false, message: '标记全部已读失败' };
    }
  }, [notifications, calculateStats]);

  // 删除通知
  const deleteNotification = useCallback(async (notificationId: string): Promise<NotificationActionResult> => {
    try {
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);
      setStats(calculateStats(updatedNotifications));
      
      return { success: true, message: '删除通知成功' };
    } catch (error) {
      console.error('删除通知失败:', error);
      return { success: false, message: '删除通知失败' };
    }
  }, [notifications, calculateStats]);

  // 初始化加载通知
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    stats,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};