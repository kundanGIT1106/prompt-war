import React from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReportForm } from '../components/reports/ReportForm';

export const ReportNewPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-600 bg-primary-50 dark:bg-primary-950/60 px-2 py-0.5 rounded-full border border-primary-200 dark:border-primary-800">
          <Sparkles className="w-3 h-3" />
          AI-Assisted Submission
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          File a Civic Infrastructure Complaint
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Provide location details and description. CivicPulse AI will evaluate priority and
          dispatch the responsible municipal division.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <ReportForm />
      </div>
    </div>
  );
};
