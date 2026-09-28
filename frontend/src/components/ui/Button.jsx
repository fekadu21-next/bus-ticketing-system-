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
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    partner: 'btn-partner',
    outline: 'btn-outline',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }[variant] || 'btn-primary';

  const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }[size] || 'btn-md';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="btn-loading-wrapper">
          <LoadingSpinner size="sm" />
          <span style={{ marginLeft: 8 }}>{children}</span>
        </span>
      ) : (
        <span className="btn-content-wrapper">
          {icon && iconPosition === 'left' && <span className="btn-icon left">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="btn-icon right">{icon}</span>}
        </span>
      )}
    </button>
  );
};

export default Button;
