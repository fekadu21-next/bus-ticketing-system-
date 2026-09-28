import React from 'react';

export const Badge = ({
  children,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  className = '',
}) => {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
};

export default Badge;
