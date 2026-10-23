import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Copy,
  AlertTriangle,
  Send,
  MessageSquare,
  Wrench,
  Shield,
} from 'lucide-react';
import { CivicReport, ReportStatus } from '../types';
import { storageService } from '../lib/storageService';
import { useAuth } from '../lib/authContext';
import { StatusBadge, UrgencyBadge, CategoryBadge } from '../components/common/Badge';
import { PriorityScoreBadge } from '../components/reports/PriorityScoreBadge';
import { AiAnalysisCard } from '../components/reports/AiAnalysisCard';
import { ReportStatusTimeline } from '../components/reports/ReportStatusTimeline';
import { DuplicateWarningModal } from '../components/reports/DuplicateWarningModal';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { requestResolutionAssistance } from '../lib/api';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState<CivicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Officer action form states
  const [newStatus, setNewStatus] = useState<ReportStatus | ''>('');
  const [officerNote, setOfficerNote] = useState('');
  const [rejectedReason, setRejectedReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState('');
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Resolution plan suggestion
  const [resolutionPlan, setResolutionPlan] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    storageService.getReportById(id).then((found) => {
      if (found) {
        setReport(found);
        setAssignedDepartment(found.assignedDepartment || '');
        // Fetch AI resolution assistance
        requestResolutionAssistance(found).then(setResolutionPlan);
      } else {
        setError('Report not found in municipal records.');
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading civic report details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Alert type="error" title="Record Not Found">
          {error || 'Unable to load report.'}
        </Alert>
        <div className="mt-4">
          <Link to="/dashboard">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOfficerOrAdmin = user?.role === 'officer' || user?.role === 'admin';

  // Handle status update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !user) return;

    setActionError(null);
    setActionSuccess(null);
    setIsUpdating(true);

    const res = await storageService.updateReportStatus({
      reportId: report.id,
      newStatus,
      officer: { uid: user.uid, name: user.displayName, role: user.role },
      details: {
        note: officerNote,
        rejectedReason: newStatus === 'rejected' ? rejectedReason : undefined,
        resolutionNotes: newStatus === 'resolved' ? resolutionNotes : undefined,
        assignedDepartment: newStatus === 'assigned' ? assignedDepartment : undefined,
      },
    });

    setIsUpdating(false);

    if (res.success && res.report) {
      setReport(res.report);
      setActionSuccess(`Status successfully transitioned to ${newStatus}.`);
      setOfficerNote('');
      setNewStatus('');
    } else {
      setActionError(res.error || 'Failed to update status.');
    }
  };

  // Handle manual duplicate merge
  const handleConfirmMerge = async (
    primaryId: string,
    duplicateId: string,
    mergeReason: string
  ) => {
    if (!user) return;
    const res = await storageService.mergeReports({
      primaryReportId: primaryId,
      duplicateReportId: duplicateId,
      officer: { uid: user.uid, name: user.displayName, role: user.role },
      mergeReason,
    });
    if (res.success && res.primaryReport) {
      setReport(res.primaryReport);
      setActionSuccess('Reports successfully merged under human confirmation.');
    } else {
      setActionError(res.error || 'Merge failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <PriorityScoreBadge priorityScore={report.priorityScore} />
          <StatusBadge status={report.status} size="lg" />
        </div>
      </div>

      {actionSuccess && <Alert type="success">{actionSuccess}</Alert>}
      {actionError && <Alert type="error">{actionError}</Alert>}

      {/* Main Grid: Details on Left, AI & Officer Actions on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Report Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header info */}
            <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
                  {report.id}
                </span>
                <CategoryBadge category={report.category} />
                <UrgencyBadge urgency={report.urgency} />
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {report.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reported on {new Date(report.createdAt).toLocaleString()}</span>
                </span>
                <span>•</span>
                <span>By: {report.citizenName}</span>
                {report.assignedDepartment && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{report.assignedDepartment}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Citizen Description
              </h2>
              <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>
            </div>

            {/* Location details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-primary-600" />
                <span>Location Information</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {report.location.address || 'Address not specified'}
              </p>
              {report.location.landmark && (
                <p className="text-slate-500 dark:text-slate-400 italic">
                  Landmark: {report.location.landmark}
                </p>
              )}
            </div>

            {/* Photo evidence */}
            {report.imageUrl && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Photographic Evidence
                </h2>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-96 bg-black flex items-center justify-center">
                  <img
                    src={report.imageUrl}
                    alt={`Evidence photograph for ${report.title}`}
                    className="max-h-96 w-auto object-contain"
                  />
                </div>
              </div>
            )}

            {/* Resolution Evidence section if resolved */}
            {report.status === 'resolved' && (
              <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Municipal Resolution Verified</span>
                </div>
                <p className="text-emerald-900 dark:text-emerald-300 leading-relaxed">
                  {report.resolutionNotes}
                </p>
              </div>
            )}

            {/* Status Lifecycle Timeline */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Lifecycle & Verification History
              </h2>
              <ReportStatusTimeline report={report} />
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): AI Advisory + Officer Action Station */}
        <div className="lg:col-span-4 space-y-6">
          {/* Gemini AI Analysis Card */}
          <AiAnalysisCard
            analysis={report.aiAnalysis}
            isOfficer={isOfficerOrAdmin}
            onApplyDepartment={(dept) => setAssignedDepartment(dept)}
          />

          {/* Suspected Duplicates Banner */}
          {report.duplicateCheck?.isDuplicateSuspected && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Duplicate Suspected ({report.duplicateCheck.matches.length})
                </span>
                <button
                  type="button"
                  onClick={() => setDuplicateModalOpen(true)}
                  className="text-primary-600 font-bold hover:underline"
                >
                  Review
                </button>
              </div>
              <p className="text-amber-800 dark:text-amber-300 text-[11px]">
                Potential match with existing open report in the same vicinity.
              </p>
            </div>
          )}

          {/* Officer Action Station */}
          {isOfficerOrAdmin ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Shield className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Officer Management Station
                </h3>
              </div>

              {/* Recommended Action by AI */}
              {resolutionPlan && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1.5">
                  <span className="font-semibold text-slate-500 text-[10px] uppercase">
                    AI Suggested Protocol
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {resolutionPlan.recommendedAction}
                  </p>
                </div>
              )}

              <form onSubmit={handleUpdateStatus} className="space-y-3" noValidate>
                <div>
                  <label htmlFor="next-status" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transition Status:
                  </label>
                  <select
                    id="next-status"
                    required
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose New Status --</option>
                    <option value="under_review">Under Review</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {newStatus === 'assigned' && (
                  <div>
                    <label htmlFor="assign-dept" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Target Municipal Department <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="assign-dept"
                      type="text"
                      required
                      value={assignedDepartment}
                      onChange={(e) => setAssignedDepartment(e.target.value)}
                      placeholder="e.g. Department of Transportation"
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {newStatus === 'resolved' && (
                  <div>
                    <label htmlFor="res-notes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Resolution Notes (Required &ge;15 chars) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="res-notes"
                      rows={3}
                      required
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Detail physical remediation completed, crew ID, and verification..."
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {newStatus === 'rejected' && (
                  <div>
                    <label htmlFor="rej-reason" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rejection Reason (Required &ge;10 chars) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="rej-reason"
                      rows={2}
                      required
                      value={rejectedReason}
                      onChange={(e) => setRejectedReason(e.target.value)}
                      placeholder="Explain reason for rejecting complaint..."
                      className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="officer-note" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Officer Public Note:
                  </label>
                  <input
                    id="officer-note"
                    type="text"
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    placeholder="e.g. Dispatched asphalt crew #4"
                    className="w-full px-3 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={!newStatus}
                  isLoading={isUpdating}
                >
                  Commit Status Update
                </Button>
              </form>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Citizen View Notice
              </span>
              <p>
                Status modifications and resolution notes are managed exclusively by authorized
                municipal officers. You will see timeline updates as soon as work is scheduled.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Modal */}
      {report.duplicateCheck?.matches && (
        <DuplicateWarningModal
          isOpen={duplicateModalOpen}
          onClose={() => setDuplicateModalOpen(false)}
          targetReportId={report.id}
          matches={report.duplicateCheck.matches}
          onConfirmMerge={handleConfirmMerge}
          isOfficer={isOfficerOrAdmin}
        />
      )}
    </div>
  );
};
