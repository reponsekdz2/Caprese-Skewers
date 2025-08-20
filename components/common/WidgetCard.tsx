
import React from 'react';
import { WidgetCardData } from '../../types';

const WidgetCard: React.FC<WidgetCardData> = ({ title, children, size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'md:col-span-1',
    medium: 'md:col-span-2', 
    large: 'md:col-span-3 lg:col-span-2', 
    full: 'md:col-span-full'
  };

  return (
    <div className={`bg-white dark:bg-dark-card rounded-xl shadow-lg p-5 sm:p-6 ${sizeClasses[size]} ${className} transition-all duration-300 transform hover:shadow-xl dark:hover:shadow-primary-500/20 hover:scale-[1.02]`}>
      {title && <h2 className="text-xl font-semibold text-secondary-800 dark:text-dark-text mb-4 pb-2 border-b dark:border-dark-border">{title}</h2>}
      <div>{children}</div>
    </div>
  );
};

export default WidgetCard;
