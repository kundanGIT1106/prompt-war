import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { CivicReport } from '../../types';
import { StatusBadge, UrgencyBadge, CategoryBadge } from '../common/Badge';
import { PriorityScoreBadge } from './PriorityScoreBadge';

interface ReportCardProps {
  report: CivicReport;
  linkPrefix?: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  linkPrefix = '/reports',
}) => {
  return (
    <article
      aria-labelledby={`report-title-${report.id}`}
      className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-primary-400 dark:hover:border-primary-600 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {report.id}
          </span>
          <CategoryBadge category={report.category} />
          <UrgencyBadge urgency={report.urgency} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <PriorityScoreBadge priorityScore={report.priorityScore} />
          <StatusBadge status={report.status} size="sm" />
        </div>
      </div>

      <div className="mt-3 flex gap-4">
        {report.imageUrl && (
          <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            <img
              src={report.imageUrl}
              alt={`Evidence for issue ${report.title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3
            id={`report-title-${report.id}`}
            className="text-base font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors"
          >
            <Link to={`${linkPrefix}/${report.id}`} className="focus:outline-hidden">
              <span className="absolute inset-0" aria-hidden="true" />
              {report.title}
            </Link>
          </h3>

          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {report.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
            {report.location?.address && (
              <span className="flex items-center gap-1 line-clamp-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                <span>{report.location.address}</span>
              </span>
            )}
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              <span>{new Date(report.createdAt).toLocaleDateString()}</span>
            </span>

            {report.aiAnalysis && (
              <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium shrink-0">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                <span>AI Analyzed</span>
              </span>
            )}

            {report.duplicateCheck?.isDuplicateSuspected && (
              <span className="flex items-center gap-1 text-amber-600 font-medium shrink-0">
                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                <span>Possible Duplicate</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
