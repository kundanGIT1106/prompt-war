import { ReportStatus, UserRole } from '../types';

/**
 * CivicPulse Status Lifecycle State Machine
 *
 * Valid Transitions:
 *  - submitted     -> under_review, rejected
 *  - under_review  -> assigned, rejected
 *  - assigned      -> in_progress, under_review, rejected
 *  - in_progress   -> resolved, under_review, rejected
 *  - resolved      -> under_review (re-opened upon dispute/re-inspection)
 *  - rejected      -> under_review (appealed / revised)
 *
 * Authorization:
 *  - Citizen: Can only create reports in 'submitted' status. Cannot update status.
 *  - Officer: Can transition between review, assigned, in_progress, resolved, rejected.
 *  - Admin: Can execute any valid transition.
 *
 * Mandatory validations:
 *  - 'rejected' requires a non-empty `rejectedReason` (at least 10 chars).
 *  - 'assigned' requires an `assignedDepartment`.
 *  - 'resolved' requires `resolutionNotes` (at least 15 chars).
 */

export const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  submitted: ['under_review', 'rejected'],
  under_review: ['assigned', 'rejected'],
  assigned: ['in_progress', 'under_review', 'rejected'],
  in_progress: ['resolved', 'under_review', 'rejected'],
  resolved: ['under_review'],
  rejected: ['under_review'],
};

export const STATUS_METADATA: Record<
  ReportStatus,
  { label: string; description: string; color: string; badgeStyle: string }
> = {
  submitted: {
    label: 'Submitted',
    description: 'Initial submission received and waiting for triage.',
    color: 'slate',
    badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200',
  },
  under_review: {
    label: 'Under Review',
    description: 'Municipal officer evaluating priority, AI recommendations, and duplicate checks.',
    color: 'amber',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200',
  },
  assigned: {
    label: 'Assigned',
    description: 'Delegated to responsible municipal department or contractor.',
    color: 'indigo',
    badgeStyle: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200',
  },
  in_progress: {
    label: 'In Progress',
    description: 'Field crew or maintenance team dispatched and working on-site.',
    color: 'blue',
    badgeStyle: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200',
  },
  resolved: {
    label: 'Resolved',
    description: 'Work completed, inspected, and verified with resolution evidence.',
    color: 'emerald',
    badgeStyle: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  rejected: {
    label: 'Rejected',
    description: 'Report declined (out of jurisdiction, duplicate, or invalid). Reason recorded.',
    color: 'rose',
    badgeStyle: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200',
  },
};

export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
}

export function validateStatusTransition(
  currentStatus: ReportStatus,
  newStatus: ReportStatus,
  userRole: UserRole,
  details?: {
    rejectedReason?: string;
    resolutionNotes?: string;
    assignedDepartment?: string;
  }
): TransitionValidationResult {
  // 1. Role-based check
  if (userRole === 'citizen') {
    return {
      valid: false,
      error: 'Citizens are not authorized to modify civic report status directly.',
    };
  }

  // 2. State transition check
  if (currentStatus === newStatus) {
    return { valid: true }; // No change
  }

  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    return {
      valid: false,
      error: `Illegal status transition from '${currentStatus}' to '${newStatus}'. Allowed: [${allowedNext.join(', ')}]`,
    };
  }

  // 3. Conditional business logic checks
  if (newStatus === 'rejected') {
    if (
      !details?.rejectedReason ||
      details.rejectedReason.trim().length < 10
    ) {
      return {
        valid: false,
        error: 'Rejecting a report requires an explicit justification of at least 10 characters.',
      };
    }
  }

  if (newStatus === 'assigned') {
    if (
      !details?.assignedDepartment ||
      details.assignedDepartment.trim().length === 0
    ) {
      return {
        valid: false,
        error: 'Assignment requires specifying the responsible municipal department.',
      };
    }
  }

  if (newStatus === 'resolved') {
    if (
      !details?.resolutionNotes ||
      details.resolutionNotes.trim().length < 15
    ) {
      return {
        valid: false,
        error: 'Resolving a report requires detailed resolution notes (at least 15 characters).',
      };
    }
  }

  return { valid: true };
}
