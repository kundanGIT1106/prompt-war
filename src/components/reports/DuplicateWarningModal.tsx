import React, { useState } from 'react';
import { Copy, AlertTriangle, ArrowRight, Check, X } from 'lucide-react';
import { DuplicateMatch } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetReportId: string;
  matches: DuplicateMatch[];
  onConfirmMerge: (primaryReportId: string, duplicateReportId: string, reason: string) => Promise<void>;
  isOfficer: boolean;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  targetReportId,
  matches,
  onConfirmMerge,
  isOfficer,
}) => {
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string | null>(null);
  const [mergeReason, setMergeReason] = useState<string>('Identical physical complaint location and issue reported.');
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    if (!selectedDuplicateId) return;
    setIsMerging(true);
    try {
      await onConfirmMerge(selectedDuplicateId, targetReportId, mergeReason);
      onClose();
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Suspected Duplicate Civic Reports"
      description="Multi-factor duplicate detection identified matching reports"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Human Confirmation Required:</strong> The AI detection engine does not
            automatically merge complaints. Authorized officers must verify physical details before
            linking or merging.
          </span>
        </div>

        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Potential Matching Reports ({matches.length})
          </h4>

          {matches.map((match) => (
            <div
              key={match.reportId}
              onClick={() => isOfficer && setSelectedDuplicateId(match.reportId)}
              className={`p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                selectedDuplicateId === match.reportId
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {match.reportId}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {match.reportTitle}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  {Math.round(match.similarityScore * 100)}% Match
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mt-1">
                <strong>Why matched:</strong> {match.reason}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Status: {match.status}</span>
                <span>Reported: {new Date(match.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {isOfficer && selectedDuplicateId && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
            <label htmlFor="merge-reason" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Officer Merge Justification:
            </label>
            <input
              id="merge-reason"
              type="text"
              value={mergeReason}
              onChange={(e) => setMergeReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <p className="text-[10px] text-slate-500">
              Target report <code className="font-mono">{targetReportId}</code> will be merged into primary report{' '}
              <code className="font-mono font-bold">{selectedDuplicateId}</code>.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {isOfficer && (
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedDuplicateId}
              isLoading={isMerging}
              onClick={handleMerge}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              Confirm Human-Approved Merge
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
