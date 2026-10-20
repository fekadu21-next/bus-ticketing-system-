import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const VARIANTS = {
  danger: {
    cls: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
    Icon: AlertCircle,
  },
  success: {
    cls: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    Icon: CheckCircle2,
  },
  warning: {
    cls: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    Icon: AlertTriangle,
  },
  info: {
    cls: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    Icon: Info,
  },
};

/**
 * Reusable alert component with icon.
 * @param {Object} props
 * @param {'danger'|'success'|'warning'|'info'} [props.variant='danger']
 * @param {React.ReactNode} props.children
 */
const Alert = ({ variant = 'danger', children }) => {
  const { cls, Icon } = VARIANTS[variant] || VARIANTS.danger;
  return (
    <div className={`${cls} rounded-lg px-4 py-3 flex items-start gap-3`} role="alert">
      <Icon size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
};

export default Alert;
