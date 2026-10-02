import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
  footer,
  noPadding = false,
  ...props
}) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`} {...props}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
          <div className="flex-1">
            {title && <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={`${noPadding ? '' : 'px-6 py-4'}`}>{children}</div>
      {footer && <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">{footer}</div>}
    </div>
  );
};

export default Card;
