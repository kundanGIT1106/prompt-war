import React from 'react';
import { Sparkles, AlertCircle, Building2, Tag, Check, Brain, ShieldAlert } from 'lucide-react';
import { AIAnalysisResult } from '../../types';

interface AiAnalysisCardProps {
  analysis?: AIAnalysisResult;
  onApplyCategory?: (category: string) => void;
  onApplyDepartment?: (department: string) => void;
  isOfficer?: boolean;
}

export const AiAnalysisCard: React.FC<AiAnalysisCardProps> = ({
  analysis,
  onApplyCategory,
  onApplyDepartment,
  isOfficer = false,
}) => {
  if (!analysis) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center text-xs text-slate-500">
        AI triage analysis has not been performed on this report yet.
      </div>
    );
  }

  return (
    <section
      aria-labelledby="ai-analysis-heading"
      className="rounded-xl border border-primary-200 dark:border-primary-900 bg-gradient-to-b from-primary-50/50 to-white dark:from-primary-950/20 dark:to-slate-900 p-5 shadow-xs"
    >
      {/* Header with clear non-confirmed distinction */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-primary-100 dark:border-primary-900/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary-600 text-white">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 id="ai-analysis-heading" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Gemini AI Report Intelligence
              {analysis.isFallback && (
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                  Rule-Based Engine (Fallback)
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Model: {analysis.model} • Analyzed:{' '}
              {new Date(analysis.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Clear human approval badge */}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
          <Brain className="w-3.5 h-3.5 text-amber-600" />
          Advisory Only • Requires Officer Confirmation
        </span>
      </div>

      <div className="mt-4 space-y-3.5 text-xs">
        {/* Short summary */}
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
            Executive Summary
          </span>
          <p className="text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed bg-white/70 dark:bg-slate-800/70 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
            {analysis.shortSummary}
          </p>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Suggested Department */}
          <div className="p-3 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-500 text-[10px] uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3 text-primary-500" />
                Recommended Department
              </span>
              {isOfficer && onApplyDepartment && (
                <button
                  type="button"
                  onClick={() => onApplyDepartment(analysis.suggestedDepartment)}
                  className="text-[11px] text-primary-600 hover:text-primary-800 font-semibold cursor-pointer"
                >
                  Apply
                </button>
              )}
            </div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              {analysis.suggestedDepartment}
            </div>
          </div>

          {/* Suggested Urgency & Category */}
          <div className="p-3 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-500 text-[10px] uppercase flex items-center gap-1 mb-1">
              <Tag className="w-3 h-3 text-primary-500" />
              Suggested Category & Urgency
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                {analysis.suggestedCategory.replace('_', ' ')}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold uppercase text-primary-600">
                {analysis.suggestedUrgency}
              </span>
            </div>
          </div>
        </div>

        {/* AI Reasoning */}
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
            Model Reasoning
          </span>
          <p className="text-slate-600 dark:text-slate-300 mt-0.5 italic">
            "{analysis.reasoning}"
          </p>
        </div>

        {/* Missing Information Flags */}
        {analysis.missingInformation && analysis.missingInformation.length > 0 && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200 text-[11px] mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Missing Information Identified by Model:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800 dark:text-amber-300 text-[11px]">
              {analysis.missingInformation.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Keywords */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-medium">Keywords:</span>
            {analysis.keywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700"
              >
                #{kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
