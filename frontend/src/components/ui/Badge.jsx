import React from "react";

export const Badge = ({
  status,
  children,
  variant,
  className = "",
}) => {
  const variantClass = {
    primary: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    info: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  }[variant] || 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';

  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClass} ${className}`}>{children}</span>;
};

export default Badge;
