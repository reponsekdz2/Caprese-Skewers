import React, { useEffect, useState } from 'react';
import { ToastMessage, ToastType } from '../../types';
import { CloseIcon, InfoIcon, SuccessIcon, ErrorIcon, WarningIcon } from '../../assets/icons';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const toastConfig = {
  success: {
    bgColor: 'bg-green-500',
    icon: <SuccessIcon className="w-6 h-6 text-white" />,
  },
  error: {
    bgColor: 'bg-red-500',
    icon: <ErrorIcon className="w-6 h-6 text-white" />,
  },
  info: {
    bgColor: 'bg-blue-500',
    icon: <InfoIcon className="w-6 h-6 text-white" />,
  },
  warning: {
    bgColor: 'bg-yellow-500',
    icon: <WarningIcon className="w-6 h-6 text-white" />,
  },
};

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const { id, type, message } = toast;
  const config = toastConfig[type] || toastConfig.info; // Default to info
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    // Animation duration should match tailwind config
    setTimeout(() => onRemove(id), 300); 
  };
  
  // Auto-remove functionality is handled by ToastProvider via duration
  // This component focuses on display and manual close

  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`relative flex items-center p-4 rounded-lg shadow-lg text-white ${config.bgColor} ${isExiting ? 'animate-toastOutRight' : 'animate-toastInRight'} transition-all duration-300`}
    >
      <div className="mr-3 flex-shrink-0">{config.icon}</div>
      <div className="flex-grow text-sm">{message}</div>
      <button
        onClick={handleRemove}
        aria-label="Close notification"
        className="ml-4 p-1 rounded-md hover:bg-black hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
      >
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toast;