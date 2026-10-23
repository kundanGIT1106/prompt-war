import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = '',
}) => {
  const configs = {
    info: {
      role: 'status',
      style: 'bg-primary-50 border-primary-200 text-primary-900 dark:bg-primary-950/40 dark:border-primary-800 dark:text-primary-200',
      icon: <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" aria-hidden="true" />,
    },
    success: {
      role: 'status',
      style: 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />,
    },
    warning: {
      role: 'alert',
      style: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />,
    },
    error: {
      role: 'alert',
      style: 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />,
    },
  }[type];

  return (
    <div
      role={configs.role}
      className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${configs.style} ${className}`}
    >
      {configs.icon}
      <div className="flex-1">
        {title && <h3 className="font-semibold text-sm mb-1">{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  );
};
