
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  rows?: number; // Added for textarea
}

const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, id, error, className = '', containerClassName = '', type, rows, ...props }, ref) => {
    const baseInputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 sm:text-sm text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500";
    const errorInputClasses = "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400";

    return (
      <div className={`mb-4 ${containerClassName}`}>
        {label && <label htmlFor={id} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">{label}</label>}
        {type === 'textarea' ? (
          <textarea
            id={id}
            rows={rows || 3} // Default rows if not provided
            className={`${baseInputClasses} ${error ? errorInputClasses : ''} ${className}`}
            ref={ref as React.Ref<HTMLTextAreaElement>} // Cast ref for textarea
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={id}
            type={type}
            className={`${baseInputClasses} ${error ? errorInputClasses : ''} ${className}`}
            ref={ref as React.Ref<HTMLInputElement>} // Cast ref for input
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input'; // Optional: for better debugging

export default Input;