
import React from 'react';
import { Notification, NotificationStatus } from '../../types';
import { BellIcon, CheckCircleIcon, MailIcon, UsersIcon as AssignmentIcon } from '../../assets/icons'; // Example icons

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onNavigate: () => void; 
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onNavigate }) => {
  
  const getIconForType = (type: Notification['type']) => {
    switch(type) {
        case 'new_message': return <MailIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
        case 'new_assignment': return <AssignmentIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
        case 'grade_update': return <CheckCircleIcon className="w-5 h-5 text-green-500 dark:text-green-400" />;
        case 'error': return <BellIcon className="w-5 h-5 text-red-500 dark:text-red-400" />; // Example
        case 'warning': return <BellIcon className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />; // Example
        default: return <BellIcon className="w-5 h-5 text-primary-500 dark:text-primary-400" />;
    }
  }
  const IconComponent = getIconForType(notification.type);

  return (
    <li 
      className={`flex items-start p-3 hover:bg-secondary-100 dark:hover:bg-dark-secondary border-b border-secondary-100 dark:border-dark-border last:border-b-0 transition-colors duration-150 ${notification.status === NotificationStatus.UNREAD ? 'bg-primary-50 dark:bg-primary-700 dark:bg-opacity-20' : ''}`}
    >
      <div className="flex-shrink-0 mr-3 mt-1">
        {IconComponent}
      </div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onNavigate}>
        <p className={`text-sm text-secondary-800 dark:text-dark-text ${notification.status === NotificationStatus.UNREAD ? 'font-semibold' : ''}`}>
          {notification.message}
        </p>
        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">
          {new Date(notification.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} - {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          {notification.senderName && <span className="italic"> (from {notification.senderName})</span>}
        </p>
      </div>
      {notification.status === NotificationStatus.UNREAD && (
        <button 
          onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id); }}
          className="ml-2 p-1 rounded-full hover:bg-secondary-200 dark:hover:bg-secondary-600 focus:outline-none"
          aria-label="Mark as read"
          title="Mark as read"
        >
          <CheckCircleIcon className="w-4 h-4 text-secondary-400 dark:text-secondary-500 hover:text-green-500 dark:hover:text-green-400" />
        </button>
      )}
    </li>
  );
};

export default NotificationItem;
