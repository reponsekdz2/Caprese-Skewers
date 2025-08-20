
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  colorClass?: string;
  heightClass?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  colorClass = 'bg-primary-500', 
  heightClass = 'h-2.5',
  showPercentage = false
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full bg-secondary-200 rounded-full dark:bg-secondary-700">
      <div 
        className={`${colorClass} ${heightClass} rounded-full text-center text-white text-xs leading-none`}
        style={{ width: `${clampedProgress}%` }}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {showPercentage && clampedProgress > 10 ? `${clampedProgress}%` : ''}
      </div>
    </div>
  );
};

export default ProgressBar;
