
import React from 'react';
import { LogEntry } from '../../types'; // Assuming LogEntry is your activity item type

interface ActivityFeedItemProps {
  item: LogEntry;
}

const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ item }) => {
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <li className="py-3 sm:py-4 border-b border-secondary-200 last:border-b-0">
      <div className="flex items-center space-x-3">
        {/* Optional: Icon based on item.action type */}
        <div className="flex-shrink-0">
          {/* Example: <UserIcon className="w-5 h-5 text-secondary-400" /> */}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary-900 truncate">
            {item.action}
          </p>
          <p className="text-xs text-secondary-500 truncate" title={item.details}>
            By: {item.userEmail} - {item.details}
          </p>
        </div>
        <div className="inline-flex items-center text-xs text-secondary-500">
          {timeAgo(item.timestamp)}
        </div>
      </div>
    </li>
  );
};

export default ActivityFeedItem;
