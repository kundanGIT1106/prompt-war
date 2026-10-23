import React, { useState } from 'react';
import { HelpCircle, ShieldAlert, Info } from 'lucide-react';
import { PriorityScore } from '../../types';
import { Modal } from '../common/Modal';

interface PriorityScoreBadgeProps {
  priorityScore: PriorityScore;
  showExplanationModal?: boolean;
}

export const PriorityScoreBadge: React.FC<PriorityScoreBadgeProps> = ({
  priorityScore,
  showExplanationModal = true,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300';
    if (score >= 65) return 'text-amber-800 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300';
    if (score >= 35) return 'text-blue-800 bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300';
    return 'text-emerald-800 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300';
  };

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${getScoreColor(
            priorityScore.score
          )}`}
          aria-label={`Priority Score: ${priorityScore.score} out of 100`}
        >
          <span className="font-sans font-semibold text-[10px] uppercase text-slate-500 dark:text-slate-400">
            Score
          </span>
          <span>{priorityScore.score}</span>
          <span className="text-[10px] text-slate-400 font-normal">/100</span>
        </span>

        {showExplanationModal && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded cursor-pointer"
            aria-label="View explainable priority score breakdown"
            title="Why this score?"
          >
            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Explainable Priority Score Breakdown"
          description="Transparent, deterministic municipal triage formula"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Total Calculated Score
                </span>
                <span className="text-lg font-bold font-mono text-primary-600">
                  {priorityScore.score} / 100
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                {priorityScore.explanation}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Factor Breakdown
              </h4>

              {/* Safety Impact */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    1. Potential Safety Impact
                  </span>
                  <span className="font-mono text-slate-500">
                    {priorityScore.breakdown.safetyImpact} / 35 pts
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(priorityScore.breakdown.safetyImpact / 35) * 100}%` }}
                  />
                </div>
              </div>

              {/* Related Reports */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    2. Community Signal & Duplicates
                  </span>
                  <span className="font-mono text-slate-500">
                    {priorityScore.breakdown.relatedCount} / 20 pts
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${(priorityScore.breakdown.relatedCount / 20) * 100}%` }}
                  />
                </div>
              </div>

              {/* Time Unresolved */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    3. Time Unresolved / Aging
                  </span>
                  <span className="font-mono text-slate-500">
                    {priorityScore.breakdown.timeUnresolved} / 15 pts
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(priorityScore.breakdown.timeUnresolved / 15) * 100}%` }}
                  />
                </div>
              </div>

              {/* Reported Severity */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    4. Reported Urgency Level
                  </span>
                  <span className="font-mono text-slate-500">
                    {priorityScore.breakdown.reportedSeverity} / 20 pts
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(priorityScore.breakdown.reportedSeverity / 20) * 100}%` }}
                  />
                </div>
              </div>

              {/* Evidence Completeness */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    5. Evidence Completeness (Photo + Geolocation)
                  </span>
                  <span className="font-mono text-slate-500">
                    {priorityScore.breakdown.evidenceCompleteness} / 10 pts
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(priorityScore.breakdown.evidenceCompleteness / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Regulatory Notice:</strong> This score is a deterministic triage guide
                for municipal workflow prioritization and must not be represented as an emergency 911/emergency dispatcher assessment.
              </span>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
