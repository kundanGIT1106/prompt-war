import React from 'react';
import {
  Clock,
  Search,
  UserCheck,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { ReportStatus, IssueUrgency, IssueCategory } from '../../types';
import { STATUS_METADATA } from '../../lib/statusLifecycle';

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const meta = STATUS_METADATA[status] || STATUS_METADATA.submitted;

  const getIcon = () => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'under_review':
        return <Search className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'assigned':
        return <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'in_progress':
        return <Wrench className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'resolved':
        return <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />;
      case 'rejected':
        return <XCircle className="w-3.5 h-3.5" aria-hidden="true" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${meta.badgeStyle} ${sizeClasses}`}
      role="status"
      aria-label={`Status: ${meta.label}`}
    >
      {getIcon()}
      <span>{meta.label}</span>
    </span>
  );
};

interface UrgencyBadgeProps {
  urgency: IssueUrgency;
  size?: 'sm' | 'md';
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency, size = 'md' }) => {
  const config = {
    low: {
      label: 'Low Urgency',
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
      icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" />,
    },
    medium: {
      label: 'Medium Urgency',
      style: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
      icon: <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />,
    },
    high: {
      label: 'High Urgency',
      style: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
      icon: <Flame className="w-3.5 h-3.5" aria-hidden="true" />,
    },
    critical: {
      label: 'Critical Priority',
      style: 'bg-rose-50 text-rose-900 border-rose-300 font-semibold dark:bg-rose-950/50 dark:text-rose-200',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />,
    },
  }[urgency];

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${config.style} ${sizeClass}`}
      role="status"
      aria-label={`Urgency: ${config.label}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

interface CategoryBadgeProps {
  category: IssueCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const formatted = category
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
      {formatted}
    </span>
  );
};
