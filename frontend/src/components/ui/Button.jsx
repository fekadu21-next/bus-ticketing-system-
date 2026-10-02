import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'partner' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  type = 'button',
  className = '',
  onClick,
  ...props
}) => {
  const variantClass = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-slate-600 text-white hover:bg-slate-700 active:bg-slate-800',
    partner: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600',
    outline: 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800',
    'outline-light': 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
  }[variant] || 'bg-blue-600 text-white hover:bg-blue-700';

  const sizeClass = {
    sm: 'px-3 py-1.5 text-sm font-medium rounded-lg',
    md: 'px-4 py-2 text-sm font-semibold rounded-lg',
    lg: 'px-6 py-3 text-base font-semibold rounded-lg',
  }[size] || 'px-4 py-2 text-sm font-semibold rounded-lg';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          <span>{children}</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {icon && iconPosition === 'left' && <span>{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span>{icon}</span>}
        </span>
      )}
    </button>
  );
};

export default Button;
