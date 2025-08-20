
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from './Button';
import { LogoutIcon, MenuIcon, BellIcon, SunIcon, MoonIcon } from '../../assets/icons';
import { useToast } from '../../hooks/useToast';
import { Link, useNavigate } from 'react-router-dom'; // Changed import
import { useTheme } from '../../hooks/useTheme';
import { Notification, NotificationStatus } from '../../types';
import NotificationItem from './NotificationItem';

const API_URL = 'http://localhost:3001/api';

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout, getAuthHeaders } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate(); // Changed usage
  
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchNotificationsData = useCallback(async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
      const [countResponse, listResponse] = await Promise.all([
        fetch(`${API_URL}/notifications/unread-count`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/notifications?limit=5`, { headers: getAuthHeaders() })
      ]);

      if (countResponse.ok) {
        const countData = await countResponse.json();
        setUnreadCount(countData.count || 0);
      }
      if (listResponse.ok) {
        const listData: Notification[] = await listResponse.json();
        setNotifications(listData);
      }
    } catch (error) {
      console.error("Failed to fetch notification data:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [user, getAuthHeaders]);

  useEffect(() => {
    fetchNotificationsData();
    const intervalId = setInterval(fetchNotificationsData, 30000); // Poll every 30 seconds
    return () => clearInterval(intervalId);
  }, [fetchNotificationsData]);


  const handleNotificationClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
    setShowProfileDropdown(false);
    if (!showNotificationDropdown) {
        fetchNotificationsData(); // Refresh when opening
    }
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setShowNotificationDropdown(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
        const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to mark as read');
        fetchNotificationsData(); // Re-fetch to update counts and list
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
      fetchNotificationsData(); // Re-fetch to update counts and list
    } catch (error) {
      addToast({ type: 'error', message: 'Could not mark all notifications as read.' });
    }
  };

  return (
    <nav className="bg-white dark:bg-dark-card shadow-md sticky top-0 z-40 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="lg:hidden mr-2 p-2 rounded-md text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-secondary-100 dark:hover:bg-dark-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              aria-label="Open sidebar"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <Link to="/" className="text-xl font-bold text-primary-600 dark:text-primary-400"> {/* Changed usage */}
              School Portal
            </Link> {/* Changed usage */}
          </div>
          <div className="flex items-center space-x-3">
             <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
                className="p-2"
            >
                {theme === 'dark' ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-secondary-500" />}
            </Button>
            {user && (
              <>
                 <div className="relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNotificationClick}
                        aria-label="View notifications"
                        className="relative p-2"
                    >
                        <BellIcon className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 block h-4 w-4 rounded-full ring-2 ring-white dark:ring-dark-card bg-red-500 text-white text-xs flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Button>
                    {showNotificationDropdown && (
                        <div
                            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-card rounded-md shadow-lg z-50 border border-secondary-200 dark:border-dark-border max-h-[70vh] flex flex-col"
                            onMouseLeave={() => setShowNotificationDropdown(false)}
                        >
                            <div className="flex justify-between items-center px-4 py-2 border-b dark:border-dark-border">
                                <h3 className="text-sm font-semibold text-secondary-700 dark:text-dark-text">Notifications</h3>
                                {notifications.some(n => n.status === NotificationStatus.UNREAD) && (
                                    <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">Mark all as read</Button>
                                )}
                            </div>
                            {loadingNotifications ? <div className="p-4 text-center text-sm text-secondary-500 dark:text-secondary-400">Loading...</div> :
                             notifications.length > 0 ? (
                                <ul className="overflow-y-auto flex-grow">
                                    {notifications.map(notif => (
                                        <NotificationItem
                                            key={notif.id}
                                            notification={notif}
                                            onMarkAsRead={handleMarkAsRead}
                                            onNavigate={() => {
                                                if (notif.linkTo) navigate(notif.linkTo);
                                                setShowNotificationDropdown(false);
                                                if (notif.status === NotificationStatus.UNREAD) handleMarkAsRead(notif.id);
                                            }}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-400 text-center">No new notifications.</div>
                            )}
                            <div className="px-4 py-2 border-t dark:border-dark-border text-center">
                                <Link // Changed usage
                                    to="/notifications"
                                    onClick={() => setShowNotificationDropdown(false)}
                                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                >
                                    View All Notifications
                                </Link> {/* Changed usage */}
                            </div>
                        </div>
                    )}
                 </div>

                 <div className="relative">
                    <button onClick={handleProfileClick} className="flex items-center focus:outline-none">
                        {user.avatar ? (
                            <img src={user.avatar} alt="User Avatar" className="w-8 h-8 rounded-full object-cover border-2 border-primary-300 dark:border-primary-700 hover:border-primary-500 dark:hover:border-primary-400" />
                        ) : (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 dark:bg-primary-600 text-white dark:text-primary-100 text-sm font-semibold border-2 border-primary-300 dark:border-primary-700 hover:border-primary-500 dark:hover:border-primary-400">
                                {user.name?.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </button>
                    {showProfileDropdown && (
                         <div
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-md shadow-lg py-1 z-50 border border-secondary-200 dark:border-dark-border"
                            onMouseLeave={() => setShowProfileDropdown(false)}
                        >
                            <div className="px-4 py-2 text-sm text-secondary-700 dark:text-dark-text border-b dark:border-dark-border">
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-xs text-secondary-500 dark:text-secondary-400">{user.role}</p>
                            </div>
                            <Link to="/profile" className="block px-4 py-2 text-sm text-secondary-700 dark:text-dark-text hover:bg-secondary-100 dark:hover:bg-dark-secondary">My Profile</Link> {/* Changed usage */}
                            <button
                                onClick={logout}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-secondary-100 dark:hover:bg-dark-secondary"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                 </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;