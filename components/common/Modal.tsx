
import React, { ReactNode } from 'react';
import { CloseIcon } from '../../assets/icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4 h-[90vh] overflow-y-auto' 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity duration-300 ease-in-out">
      <div 
        className={`bg-white dark:bg-dark-card rounded-lg shadow-xl p-6 m-4 ${sizeClasses[size]} w-full transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow ${size === 'full' ? 'flex flex-col' : ''}`}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-dark-border">
          <h2 className="text-xl font-semibold text-secondary-800 dark:text-dark-text">{title}</h2>
          <button onClick={onClose} className="text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className={`${size === 'full' ? 'flex-grow overflow-y-auto' : ''}`}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;