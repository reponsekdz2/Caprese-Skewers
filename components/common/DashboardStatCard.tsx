import React from 'react';
import { Link } from 'react-router-dom'; // Changed import
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '../../assets/icons';
import { DashboardStatCardData } from '../../types';

const TrendIcon: React.FC<{ direction: 'up' | 'down' | 'neutral' }> = ({ direction }) => {
    if (direction === 'up') return <ArrowUpIcon className="w-4 h-4 text-green-300" />;
    if (direction === 'down') return <ArrowDownIcon className="w-4 h-4 text-red-300" />;
    return <MinusIcon className="w-4 h-4 text-gray-300" />;
};


const DashboardStatCard: React.FC<DashboardStatCardData> = ({ title, value, icon, bgColorClass = 'bg-primary-500 dark:bg-primary-600', iconColorClass = 'text-white', linkTo, trend }) => {
  const IconComponent = icon;

  const cardContent = (
    <div className={`p-5 rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-primary-500/50 transition-all duration-300 flex flex-col justify-between h-full ${bgColorClass} text-white group transform hover:scale-105 active:scale-100`}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-full bg-white bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300 group-hover:scale-110`}>
          <IconComponent className={`w-7 h-7 ${iconColorClass}`} />
        </div>
        {linkTo && (
            <Link to={linkTo} className="text-xs font-medium hover:underline opacity-80 group-hover:opacity-100 transition-opacity"> {/* Changed usage */}
                View All &rarr;
            </Link> // Changed usage
        )}
      </div>
      <div>
        <p className="text-3xl sm:text-4xl font-bold mt-3">{value}</p>
        <p className="text-sm font-medium opacity-90 mt-1">{title}</p>
        {trend && (
            <div className="flex items-center text-xs mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <TrendIcon direction={trend.direction} />
                <span className="ml-1">{trend.value}</span>
            </div>
        )}
      </div>
    </div>
  );

  return cardContent;
};

export default DashboardStatCard;