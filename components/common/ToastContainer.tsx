import React from 'react';
import ReactDOM from 'react-dom';
import { useToast } from '../../hooks/useToast';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const portalRoot = document.getElementById('toast-container');

  if (!portalRoot) {
    console.warn('Toast container root (toast-container) not found in the DOM.');
    return null; 
  }

  return ReactDOM.createPortal(
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </>,
    portalRoot
  );
};

export default ToastContainer;