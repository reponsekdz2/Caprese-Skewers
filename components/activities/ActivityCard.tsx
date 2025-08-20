
import React from 'react';
import { Activity } from '../../types';
import { ActivityIcon, UsersIcon, CalendarDaysIcon, LocationMarkerIcon } from '../../assets/icons';

interface ActivityCardProps {
  activity: Activity;
  children?: React.ReactNode; // For action buttons (enroll/withdraw)
  showEnrollmentStatus?: boolean; 
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, children, showEnrollmentStatus = true }) => {
  const isFull = activity.maxParticipants !== null && (activity.currentParticipantsCount || 0) >= activity.maxParticipants;

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-5 hover:shadow-xl dark:hover:shadow-primary-500/20 transition-all duration-300 transform hover:scale-[1.02] flex flex-col h-full animate-fadeIn">
      {activity.imageUrl ? (
        <img src={activity.imageUrl} alt={activity.name} className="w-full h-40 object-cover rounded-t-lg mb-3" />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-800 rounded-t-lg flex items-center justify-center mb-3">
          <ActivityIcon className="w-16 h-16 text-white opacity-70" />
        </div>
      )}
      <div className="flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-1 truncate" title={activity.name}>{activity.name}</h3>
        <span className="text-xs bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 rounded-full mb-2 self-start">{activity.category}</span>
        
        <p className="text-sm text-secondary-600 dark:text-secondary-300 line-clamp-3 mb-2 flex-grow" title={activity.description}>
          {activity.description}
        </p>

        <div className="text-xs text-secondary-500 dark:text-secondary-400 space-y-1 mb-3">
          {activity.teacherInChargeName && (
            <p className="flex items-center"><UsersIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"/> In Charge: {activity.teacherInChargeName}</p>
          )}
          <p className="flex items-center"><CalendarDaysIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"/> Schedule: {activity.schedule}</p>
          {activity.location && (
            <p className="flex items-center"><LocationMarkerIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"/> Location: {activity.location}</p>
          )}
        </div>
        
        {showEnrollmentStatus && (
            <div className="text-xs font-medium mb-3">
                <span className="mr-2">Participants: {activity.currentParticipantsCount || 0} / {activity.maxParticipants || 'Unlimited'}</span>
                {isFull && activity.isEnrollmentOpen !== false && <span className="text-red-500 dark:text-red-400">(Full)</span>}
                {activity.isEnrollmentOpen === false && <span className="text-yellow-600 dark:text-yellow-400">(Enrollment Closed)</span>}
            </div>
        )}
      </div>
      {children && <div className="mt-auto pt-3 border-t border-secondary-100 dark:border-dark-border">{children}</div>}
    </div>
  );
};

export default ActivityCard;
