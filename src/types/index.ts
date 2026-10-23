export type UserRole = 'citizen' | 'officer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  createdAt: string;
}

export type IssueCategory =
  | 'pothole'
  | 'garbage'
  | 'broken_streetlights'
  | 'water_leakage'
  | 'damaged_infrastructure'
  | 'other';

export type IssueUrgency = 'low' | 'medium' | 'high' | 'critical';

export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export interface LocationData {
  address?: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
}

export interface StatusHistoryEntry {
  status: ReportStatus;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  reason?: string;
  note?: string;
}

export interface PriorityScoreBreakdown {
  safetyImpact: number; // 0 - 35
  relatedCount: number; // 0 - 20
  timeUnresolved: number; // 0 - 15
  reportedSeverity: number; // 0 - 20
  evidenceCompleteness: number; // 0 - 10
}

export interface PriorityScore {
  score: number; // 0 - 100
  level: IssueUrgency;
  breakdown: PriorityScoreBreakdown;
  explanation: string;
  calculatedAt: string;
}

export interface AIAnalysisResult {
  suggestedCategory: IssueCategory;
  shortSummary: string;
  keywords: string[];
  suggestedUrgency: IssueUrgency;
  suggestedDepartment: string;
  missingInformation: string[];
  reasoning: string;
  model: string;
  analyzedAt: string;
  isFallback?: boolean;
}

export interface DuplicateMatch {
  reportId: string;
  reportTitle: string;
  similarityScore: number; // 0 to 1
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface DuplicateDetectionResult {
  isDuplicateSuspected: boolean;
  matches: DuplicateMatch[];
  checkedAt: string;
  method: 'hybrid_ai_rules' | 'deterministic_rules';
}

export interface ResolutionRecommendation {
  recommendedAction: string;
  recommendedDepartment: string;
  checklist: string[];
  estimatedResolutionDays: number;
}

export interface CivicReport {
  id: string; // e.g. CP-2026-0042
  citizenId: string;
  citizenEmail: string;
  citizenName: string;
  title: string;
  description: string;
  category: IssueCategory;
  urgency: IssueUrgency;
  location: LocationData;
  imageUrl?: string;
  status: ReportStatus;
  statusHistory: StatusHistoryEntry[];
  priorityScore: PriorityScore;
  aiAnalysis?: AIAnalysisResult;
  duplicateCheck?: DuplicateDetectionResult;
  assignedDepartment?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  resolutionNotes?: string;
  resolutionEvidenceUrl?: string;
  rejectedReason?: string;
  additionalInfoRequested?: string;
  additionalInfoResponse?: string;
  mergedIntoReportId?: string;
  isMerged?: boolean;
  mergedReportIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  performedByRole: UserRole;
  targetId: string;
  targetType: 'report' | 'user' | 'system';
  timestamp: string;
  details: Record<string, any>;
}

export interface AggregateStats {
  totalReports: number;
  openReports: number;
  resolvedReports: number;
  rejectedReports: number;
  criticalReports: number;
  avgResolutionTimeHours: number;
  categoryCounts: Record<IssueCategory, number>;
  statusCounts: Record<ReportStatus, number>;
  departmentCounts: Record<string, number>;
}
