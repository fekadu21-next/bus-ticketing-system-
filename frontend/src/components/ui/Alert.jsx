import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const VARIANTS = {
  danger: {
    cls: 'alert alert-danger',
    Icon: AlertCircle,
  },
  success: {
    cls: 'alert alert-success',
    Icon: CheckCircle2,
  },
  warning: {
    cls: 'alert alert-warning',
    Icon: AlertTriangle,
  },
  info: {
    cls: 'alert alert-info',
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
    <div className={cls} role="alert">
      <Icon size={18} style={{ flexShrink: 0 }} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
};

export default Alert;
