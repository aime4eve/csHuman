/**
 * 通知下拉菜单组件
 * 作者：伍志勇
 * 日期：2025年1月20日
 */

import React from 'react';
import {
  Dropdown,
  List,
  Button,
  Typography,
  Space,
  Tag,
  Empty,
  Divider,
  Spin,
  Avatar,
  Tooltip
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification, NotificationType, NotificationPriority } from '../../types/notification';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 配置dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text, Title } = Typography;

interface NotificationDropdownProps {
  children: React.ReactNode;
}

/**
 * 获取通知类型图标
 */
const getNotificationIcon = (type: NotificationType) => {
  const iconMap = {
    [NotificationType.SYSTEM]: <SettingOutlined style={{ color: '#1890ff' }} />,
    [NotificationType.KNOWLEDGE]: <InfoCircleOutlined style={{ color: '#52c41a' }} />,
    [NotificationType.AUDIT]: <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />,
    [NotificationType.COMMENT]: <InfoCircleOutlined style={{ color: '#722ed1' }} />,
    [NotificationType.LIKE]: <InfoCircleOutlined style={{ color: '#eb2f96' }} />,
    [NotificationType.FOLLOW]: <InfoCircleOutlined style={{ color: '#13c2c2' }} />,
    [NotificationType.REMINDER]: <ClockCircleOutlined style={{ color: '#faad14' }} />
  };
  return iconMap[type] || <InfoCircleOutlined />;
};

/**
 * 获取优先级标签颜色
 */
const getPriorityColor = (priority: NotificationPriority) => {
  const colorMap = {
    [NotificationPriority.LOW]: 'default',
    [NotificationPriority.MEDIUM]: 'processing',
    [NotificationPriority.HIGH]: 'warning',
    [NotificationPriority.URGENT]: 'error'
  };
  return colorMap[priority] as any;
};

/**
 * 获取优先级文本
 */
const getPriorityText = (priority: NotificationPriority) => {
  const textMap = {
    [NotificationPriority.LOW]: '低',
    [NotificationPriority.MEDIUM]: '中',
    [NotificationPriority.HIGH]: '高',
    [NotificationPriority.URGENT]: '紧急'
  };
  return textMap[priority];
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ children }) => {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    stats,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  // 处理通知点击
  const handleNotificationClick = async (notification: Notification) => {
    // 如果是未读状态，标记为已读
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }
    
    // 如果有跳转链接，进行页面跳转
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  // 处理删除通知
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  // 处理标记已读
  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  // 处理全部标记为已读
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // 渲染通知项
  const renderNotificationItem = (notification: Notification) => {
    const isUnread = notification.status === 'unread';
    
    return (
      <List.Item
        key={notification.id}
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          backgroundColor: isUnread ? '#f6ffed' : 'transparent',
          borderLeft: isUnread ? '3px solid #52c41a' : '3px solid transparent',
          transition: 'all 0.2s'
        }}
        onClick={() => handleNotificationClick(notification)}
        actions={[
          <Space key="actions">
            {isUnread && (
              <Tooltip title="标记为已读">
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={(e) => handleMarkAsRead(e, notification.id)}
                />
              </Tooltip>
            )}
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => handleDeleteNotification(e, notification.id)}
              />
            </Tooltip>
          </Space>
        ]}
      >
        <List.Item.Meta
          avatar={
            <Avatar 
              size="small" 
              icon={getNotificationIcon(notification.type)}
              style={{ backgroundColor: 'transparent' }}
            />
          }
          title={
            <Space>
              <Text strong={isUnread} style={{ fontSize: 14 }}>
                {notification.title}
              </Text>
              {notification.priority !== NotificationPriority.LOW && (
                <Tag 
                  size="small" 
                  color={getPriorityColor(notification.priority)}
                >
                  {getPriorityText(notification.priority)}
                </Tag>
              )}
            </Space>
          }
          description={
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                {notification.content}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(notification.createdAt).fromNow()}
              </Text>
            </div>
          }
        />
      </List.Item>
    );
  };

  // 下拉菜单内容
  const dropdownContent = (
    <div style={{ width: 380, maxHeight: 500, overflow: 'hidden' }}>
      {/* 头部 */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Title level={5} style={{ margin: 0 }}>
          通知中心
          {stats.unread > 0 && (
            <Tag color="red" style={{ marginLeft: 8 }}>
              {stats.unread} 条未读
            </Tag>
          )}
        </Title>
        {stats.unread > 0 && (
          <Button 
            type="link" 
            size="small"
            onClick={handleMarkAllAsRead}
          >
            全部已读
          </Button>
        )}
      </div>

      {/* 通知列表 */}
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知"
            style={{ padding: '40px 20px' }}
          />
        ) : (
          <List
            dataSource={notifications.slice(0, 10)} // 只显示前10条
            renderItem={renderNotificationItem}
            split={false}
          />
        )}
      </div>

      {/* 底部 */}
      {notifications.length > 10 && (
        <>
          <Divider style={{ margin: 0 }} />
          <div style={{ padding: '12px 16px', textAlign: 'center' }}>
            <Button 
              type="link" 
              onClick={() => navigate('/notifications')}
            >
              查看全部通知
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dropdown
      popupRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      arrow
    >
      {children}
    </Dropdown>
  );
};

export default NotificationDropdown;