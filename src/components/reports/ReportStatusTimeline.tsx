import React from 'react';
import { CheckCircle2, Clock, XCircle, ArrowRight, User } from 'lucide-react';
import { CivicReport, ReportStatus } from '../../types';
import { STATUS_METADATA } from '../../lib/statusLifecycle';

interface ReportStatusTimelineProps {
  report: CivicReport;
}

export const ReportStatusTimeline: React.FC<ReportStatusTimelineProps> = ({ report }) => {
  const lifecycleSteps: ReportStatus[] = [
    'submitted',
    'under_review',
    'assigned',
    'in_progress',
    'resolved',
  ];

  const isRejected = report.status === 'rejected';

  const getStepIndex = (status: ReportStatus) => {
    return lifecycleSteps.indexOf(status);
  };

  const currentIdx = getStepIndex(report.status);

  return (
    <div className="space-y-6">
      {/* High level visual milestone bar */}
      {!isRejected ? (
        <div className="relative">
          <div className="hidden sm:block absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
          <div className="grid grid-cols-5 gap-2 relative z-10">
            {lifecycleSteps.map((step, idx) => {
              const isPast = currentIdx > idx;
              const isCurrent = currentIdx === idx;
              const meta = STATUS_METADATA[step];

              return (
                <div key={step} className="flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950'
                        : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`mt-2 text-[11px] font-semibold ${
                      isCurrent
                        ? 'text-primary-600 dark:text-primary-400 font-bold'
                        : isPast
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400'
                    }`}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-3 text-xs text-rose-900 dark:text-rose-200">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold">Report Marked as Rejected:</span>
            <p className="mt-0.5">{report.rejectedReason || 'Declined during triage inspection.'}</p>
          </div>
        </div>
      )}

      {/* Detailed Audit Step History */}
      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Status Event Log ({report.statusHistory.length} events)
        </h4>

        <div className="space-y-3">
          {report.statusHistory.map((item, idx) => {
            const meta = STATUS_METADATA[item.status];
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="mt-0.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Status transitioned to{' '}
                      <span className="capitalize text-primary-600 font-bold">{meta.label}</span>
                    </span>
                    <time
                      dateTime={item.changedAt}
                      className="text-[11px] text-slate-400 font-mono"
                    >
                      {new Date(item.changedAt).toLocaleString()}
                    </time>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>Updated by: {item.changedByName || item.changedBy}</span>
                  </div>
                  {item.note && (
                    <p className="text-slate-700 dark:text-slate-300 mt-1.5 p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 italic">
                      "{item.note}"
                    </p>
                  )}
                  {item.reason && (
                    <p className="text-rose-700 dark:text-rose-300 mt-1 font-medium">
                      Reason: {item.reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
