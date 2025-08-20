
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Notification, NotificationStatus } from '../../types';
import Button from '../../components/common/Button';
import { BellIcon } from '../../assets/icons';
import NotificationItem from '../../components/common/NotificationItem';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

const NotificationsPage: React.FC = () => {
  const { user, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  // Placeholder for pagination state
  // const [currentPage, setCurrentPage] = useState(1);
  // const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(async (/* page = 1 */) => {
    if (!user) return;
    setLoading(true);
    try {
      // Example: Add pagination query params: `?page=${page}&limit=20`
      const response = await fetch(`${API_URL}/notifications`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data: Notification[] = await response.json(); // Assuming API returns sorted data
      setNotifications(data);
      // if (data.totalPages) setTotalPages(data.totalPages); // If API provides total pages
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not load notifications.' });
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders, addToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      // Optimistically update UI or re-fetch
      setNotifications(prev => prev.map(n => n.id === notificationId ? {...n, status: NotificationStatus.READ} : n));
      addToast({type: 'success', message: 'Notification marked as read.'});
    } catch (error) {
      addToast({ type: 'error', message: 'Could not mark notification as read.' });
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      addToast({ type: 'success', message: 'All notifications marked as read.' });
      fetchNotifications(); // Refresh the list
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Could not mark all notifications as read.' });
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800 dark:text-dark-text flex items-center">
          <BellIcon className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
          All Notifications
        </h1>
        {notifications.some(n => n.status === NotificationStatus.UNREAD) && (
            <Button onClick={handleMarkAllAsRead} variant="secondary" size="sm" className="mt-3 sm:mt-0">
                Mark All as Read
            </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-secondary-600 dark:text-secondary-400">Loading notifications...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg">
          <ul className="divide-y divide-secondary-100 dark:divide-dark-border">
            {notifications.map(notif => (
              <NotificationItem 
                key={notif.id} 
                notification={notif} 
                onMarkAsRead={handleMarkAsRead}
                onNavigate={() => {
                    if (notif.linkTo) navigate(notif.linkTo);
                    if (notif.status === NotificationStatus.UNREAD) handleMarkAsRead(notif.id);
                }}
              />
            ))}
          </ul>
          {/* Placeholder for Pagination Controls */}
          {/* {totalPages > 1 && (
            <div className="p-4 flex justify-center">
              {[...Array(totalPages).keys()].map(num => (
                <Button key={num} onClick={() => fetchNotifications(num + 1)} variant={currentPage === num + 1 ? 'primary' : 'secondary'} size="sm" className="mx-1">
                  {num + 1}
                </Button>
              ))}
            </div>
          )} */}
        </div>
      ) : (
        <div className="text-center py-10 bg-white dark:bg-dark-card rounded-xl shadow-md">
          <BellIcon className="w-16 h-16 text-secondary-400 dark:text-secondary-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-secondary-700 dark:text-dark-text">No Notifications</h2>
          <p className="text-secondary-500 dark:text-secondary-400 mt-2">You're all caught up!</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
