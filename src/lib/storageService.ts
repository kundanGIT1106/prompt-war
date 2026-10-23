import {
  CivicReport,
  ReportStatus,
  IssueCategory,
  IssueUrgency,
  AuditLogEntry,
  AggregateStats,
  UserRole,
} from '../types';
import { calculatePriorityScore } from './priorityEngine';
import { detectDuplicates } from './duplicateEngine';
import { validateStatusTransition } from './statusLifecycle';
import { canUserPerformAction } from './security';

const STORAGE_KEY_REPORTS = 'civicpulse_reports_v1';
const STORAGE_KEY_AUDIT = 'civicpulse_audit_v1';

// In-memory / LocalStorage resilient repository
class StorageService {
  private reports: CivicReport[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private initialized: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedReports = localStorage.getItem(STORAGE_KEY_REPORTS);
      if (savedReports) {
        this.reports = JSON.parse(savedReports);
      }
      const savedAudit = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (savedAudit) {
        this.auditLogs = JSON.parse(savedAudit);
      }
    } catch {
      // In SSR or test environments, fallback to memory
    }

    if (this.reports.length === 0) {
      this.seedDemonstrationData();
    }
    this.initialized = true;
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(this.reports));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
    } catch {
      // Storage unavailable or quota reached
    }
  }

  public async getReports(filters?: {
    citizenId?: string;
    status?: ReportStatus;
    category?: IssueCategory;
    department?: string;
    search?: string;
  }): Promise<CivicReport[]> {
    let result = [...this.reports];

    if (filters?.citizenId) {
      result = result.filter((r) => r.citizenId === filters.citizenId);
    }
    if (filters?.status) {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters?.category) {
      result = result.filter((r) => r.category === filters.category);
    }
    if (filters?.department) {
      result = result.filter((r) => r.assignedDepartment === filters.department);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.location.address && r.location.address.toLowerCase().includes(q))
      );
    }

    // Sort descending by priority score and recency
    return result.sort((a, b) => {
      if (b.priorityScore.score !== a.priorityScore.score) {
        return b.priorityScore.score - a.priorityScore.score;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public async getReportById(id: string): Promise<CivicReport | null> {
    const found = this.reports.find((r) => r.id === id);
    return found ? { ...found } : null;
  }

  public async createReport(params: {
    citizenId: string;
    citizenEmail: string;
    citizenName: string;
    title: string;
    description: string;
    category: IssueCategory;
    urgency: IssueUrgency;
    location: { address?: string; latitude?: number; longitude?: number; landmark?: string };
    imageUrl?: string;
  }): Promise<CivicReport> {
    const timestamp = new Date().toISOString();
    const count = this.reports.length + 1;
    const reportId = `CP-2026-${String(count).padStart(4, '0')}`;

    // 1. Calculate Priority Score
    const priorityScore = calculatePriorityScore(
      {
        category: params.category,
        urgency: params.urgency,
        title: params.title,
        description: params.description,
        location: params.location,
        imageUrl: params.imageUrl,
        createdAt: timestamp,
      },
      0
    );

    // 2. Perform duplicate detection against existing reports
    const duplicateCheck = detectDuplicates(
      {
        id: reportId,
        title: params.title,
        description: params.description,
        category: params.category,
        location: params.location,
        createdAt: timestamp,
      },
      this.reports
    );

    const newReport: CivicReport = {
      id: reportId,
      citizenId: params.citizenId,
      citizenEmail: params.citizenEmail,
      citizenName: params.citizenName,
      title: params.title,
      description: params.description,
      category: params.category,
      urgency: params.urgency,
      location: params.location,
      imageUrl: params.imageUrl,
      status: 'submitted',
      statusHistory: [
        {
          status: 'submitted',
          changedBy: params.citizenId,
          changedByName: params.citizenName,
          changedAt: timestamp,
          note: 'Initial report submitted by citizen.',
        },
      ],
      priorityScore,
      duplicateCheck,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.reports.unshift(newReport);

    // Record audit log
    this.addAuditLog({
      action: 'REPORT_CREATED',
      performedBy: params.citizenId,
      performedByName: params.citizenName,
      performedByRole: 'citizen',
      targetId: reportId,
      targetType: 'report',
      details: { title: params.title, category: params.category, urgency: params.urgency },
    });

    this.persist();
    return newReport;
  }

  public async updateReportStatus(params: {
    reportId: string;
    newStatus: ReportStatus;
    officer: { uid: string; name: string; role: UserRole };
    details?: {
      rejectedReason?: string;
      resolutionNotes?: string;
      resolutionEvidenceUrl?: string;
      assignedDepartment?: string;
      note?: string;
    };
  }): Promise<{ success: boolean; report?: CivicReport; error?: string }> {
    const reportIndex = this.reports.findIndex((r) => r.id === params.reportId);
    if (reportIndex === -1) {
      return { success: false, error: 'Report not found.' };
    }

    const report = this.reports[reportIndex];

    // Validate lifecycle and authorization
    const validation = validateStatusTransition(
      report.status,
      params.newStatus,
      params.officer.role,
      params.details
    );

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const timestamp = new Date().toISOString();

    // Apply updates
    report.status = params.newStatus;
    report.updatedAt = timestamp;

    if (params.details?.rejectedReason) {
      report.rejectedReason = params.details.rejectedReason;
    }
    if (params.details?.resolutionNotes) {
      report.resolutionNotes = params.details.resolutionNotes;
    }
    if (params.details?.resolutionEvidenceUrl) {
      report.resolutionEvidenceUrl = params.details.resolutionEvidenceUrl;
    }
    if (params.details?.assignedDepartment) {
      report.assignedDepartment = params.details.assignedDepartment;
    }

    report.statusHistory.push({
      status: params.newStatus,
      changedBy: params.officer.uid,
      changedByName: params.officer.name,
      changedAt: timestamp,
      reason: params.details?.rejectedReason,
      note: params.details?.resolutionNotes || params.details?.note,
    });

    this.reports[reportIndex] = report;

    this.addAuditLog({
      action: `STATUS_CHANGED_TO_${params.newStatus.toUpperCase()}`,
      performedBy: params.officer.uid,
      performedByName: params.officer.name,
      performedByRole: params.officer.role,
      targetId: report.id,
      targetType: 'report',
      details: {
        fromStatus: report.statusHistory[report.statusHistory.length - 2]?.status,
        toStatus: params.newStatus,
        reason: params.details?.rejectedReason,
      },
    });

    this.persist();
    return { success: true, report };
  }

  public async assignReport(params: {
    reportId: string;
    department: string;
    officer: { uid: string; name: string; role: UserRole };
    assignedOfficerId?: string;
    assignedOfficerName?: string;
  }): Promise<{ success: boolean; report?: CivicReport; error?: string }> {
    if (!canUserPerformAction(params.officer.role, 'assign_department')) {
      return { success: false, error: 'Unauthorized to assign departments.' };
    }

    const reportIndex = this.reports.findIndex((r) => r.id === params.reportId);
    if (reportIndex === -1) {
      return { success: false, error: 'Report not found.' };
    }

    const report = this.reports[reportIndex];
    report.assignedDepartment = params.department;
    if (params.assignedOfficerId) {
      report.assignedOfficerId = params.assignedOfficerId;
      report.assignedOfficerName = params.assignedOfficerName;
    }
    report.updatedAt = new Date().toISOString();

    if (report.status === 'submitted' || report.status === 'under_review') {
      report.status = 'assigned';
      report.statusHistory.push({
        status: 'assigned',
        changedBy: params.officer.uid,
        changedByName: params.officer.name,
        changedAt: report.updatedAt,
        note: `Assigned to ${params.department}`,
      });
    }

    this.reports[reportIndex] = report;

    this.addAuditLog({
      action: 'REPORT_ASSIGNED_DEPARTMENT',
      performedBy: params.officer.uid,
      performedByName: params.officer.name,
      performedByRole: params.officer.role,
      targetId: report.id,
      targetType: 'report',
      details: { department: params.department },
    });

    this.persist();
    return { success: true, report };
  }

  public async mergeReports(params: {
    primaryReportId: string;
    duplicateReportId: string;
    officer: { uid: string; name: string; role: UserRole };
    mergeReason: string;
  }): Promise<{ success: boolean; primaryReport?: CivicReport; error?: string }> {
    if (!canUserPerformAction(params.officer.role, 'merge_reports')) {
      return { success: false, error: 'Unauthorized to merge civic reports.' };
    }

    const primaryIndex = this.reports.findIndex((r) => r.id === params.primaryReportId);
    const dupIndex = this.reports.findIndex((r) => r.id === params.duplicateReportId);

    if (primaryIndex === -1 || dupIndex === -1) {
      return { success: false, error: 'One or both reports not found.' };
    }

    const primary = this.reports[primaryIndex];
    const dup = this.reports[dupIndex];

    const timestamp = new Date().toISOString();

    // Mark duplicate report as merged
    dup.isMerged = true;
    dup.mergedIntoReportId = primary.id;
    dup.status = 'rejected';
    dup.rejectedReason = `Merged into primary report ${primary.id}: ${params.mergeReason}`;
    dup.statusHistory.push({
      status: 'rejected',
      changedBy: params.officer.uid,
      changedByName: params.officer.name,
      changedAt: timestamp,
      reason: dup.rejectedReason,
      note: 'Closed as duplicate via human-confirmed merge.',
    });

    // Update primary report related report counts and recalculate priority score
    if (!primary.mergedReportIds) primary.mergedReportIds = [];
    primary.mergedReportIds.push(dup.id);
    primary.priorityScore = calculatePriorityScore(
      primary,
      primary.mergedReportIds.length
    );
    primary.updatedAt = timestamp;

    this.reports[primaryIndex] = primary;
    this.reports[dupIndex] = dup;

    this.addAuditLog({
      action: 'REPORT_MERGED',
      performedBy: params.officer.uid,
      performedByName: params.officer.name,
      performedByRole: params.officer.role,
      targetId: primary.id,
      targetType: 'report',
      details: { duplicateId: dup.id, reason: params.mergeReason },
    });

    this.persist();
    return { success: true, primaryReport: primary };
  }

  public async attachAIAnalysis(reportId: string, analysis: any): Promise<void> {
    const idx = this.reports.findIndex((r) => r.id === reportId);
    if (idx !== -1) {
      this.reports[idx].aiAnalysis = analysis;
      this.persist();
    }
  }

  public async getAggregateStats(): Promise<AggregateStats> {
    const totalReports = this.reports.length;
    const resolvedReports = this.reports.filter((r) => r.status === 'resolved').length;
    const rejectedReports = this.reports.filter((r) => r.status === 'rejected').length;
    const openReports = totalReports - resolvedReports - rejectedReports;
    const criticalReports = this.reports.filter((r) => r.priorityScore.level === 'critical').length;

    const categoryCounts: Record<IssueCategory, number> = {
      pothole: 0,
      garbage: 0,
      broken_streetlights: 0,
      water_leakage: 0,
      damaged_infrastructure: 0,
      other: 0,
    };

    const statusCounts: Record<ReportStatus, number> = {
      submitted: 0,
      under_review: 0,
      assigned: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
    };

    const departmentCounts: Record<string, number> = {};

    let totalResolutionHours = 0;
    let resolvedCountWithTiming = 0;

    for (const r of this.reports) {
      if (categoryCounts[r.category] !== undefined) categoryCounts[r.category]++;
      if (statusCounts[r.status] !== undefined) statusCounts[r.status]++;

      if (r.assignedDepartment) {
        departmentCounts[r.assignedDepartment] =
          (departmentCounts[r.assignedDepartment] || 0) + 1;
      }

      if (r.status === 'resolved') {
        const resolvedEntry = r.statusHistory.find((h) => h.status === 'resolved');
        if (resolvedEntry) {
          const diff =
            (new Date(resolvedEntry.changedAt).getTime() -
              new Date(r.createdAt).getTime()) /
            (1000 * 60 * 60);
          totalResolutionHours += Math.max(0.5, diff);
          resolvedCountWithTiming++;
        }
      }
    }

    const avgResolutionTimeHours =
      resolvedCountWithTiming > 0
        ? Math.round((totalResolutionHours / resolvedCountWithTiming) * 10) / 10
        : 28.5;

    return {
      totalReports,
      openReports,
      resolvedReports,
      rejectedReports,
      criticalReports,
      avgResolutionTimeHours,
      categoryCounts,
      statusCounts,
      departmentCounts,
    };
  }

  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const newLog: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(newLog);
  }

  public seedDemonstrationData() {
    const sampleReports: CivicReport[] = [
      {
        id: 'CP-2026-0001',
        citizenId: 'citizen_john_doe',
        citizenEmail: 'john.citizen@civicpulse.org',
        citizenName: 'John Doe',
        title: 'Deep Hazardous Pothole Near Lincoln School Crossing',
        description:
          'Deep crater-like pothole directly at the crosswalk of Lincoln Elementary. Multiple school buses and cyclists have swerved dangerously into oncoming traffic to avoid it. Exposed roadbed and sharp asphalt edges.',
        category: 'pothole',
        urgency: 'high',
        location: {
          address: '450 Lincoln Ave at 5th St, Central District',
          latitude: 37.7749,
          longitude: -122.4194,
          landmark: 'Directly in front of Lincoln Elementary School Gate',
        },
        imageUrl:
          'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
        status: 'in_progress',
        statusHistory: [
          {
            status: 'submitted',
            changedBy: 'citizen_john_doe',
            changedByName: 'John Doe',
            changedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
            note: 'Initial report filed via citizen mobile web app.',
          },
          {
            status: 'under_review',
            changedBy: 'officer_sarah_connor',
            changedByName: 'Officer Sarah Connor',
            changedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
            note: 'Verified high pedestrian hazard due to school zone proximity.',
          },
          {
            status: 'assigned',
            changedBy: 'officer_sarah_connor',
            changedByName: 'Officer Sarah Connor',
            changedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
            note: 'Dispatched to Department of Transportation & Road Maintenance crew #4.',
          },
          {
            status: 'in_progress',
            changedBy: 'officer_sarah_connor',
            changedByName: 'Officer Sarah Connor',
            changedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
            note: 'Asphalt milling crew on site. Cold patch in progress.',
          },
        ],
        priorityScore: {
          score: 82,
          level: 'high',
          breakdown: {
            safetyImpact: 32,
            relatedCount: 8,
            timeUnresolved: 6,
            reportedSeverity: 16,
            evidenceCompleteness: 10,
          },
          explanation:
            'High safety impact (32/35) due to school crossing hazard and traffic risk; 2 linked citizen reports amplify priority.',
          calculatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        },
        aiAnalysis: {
          suggestedCategory: 'pothole',
          shortSummary: 'Severe roadway crater endangering school zone traffic and pedestrians.',
          keywords: ['pothole', 'school zone', 'hazard', 'bus crossing', 'asphalt collapse'],
          suggestedUrgency: 'high',
          suggestedDepartment: 'Department of Transportation (Roadways)',
          missingInformation: [],
          reasoning:
            'Proximity to vulnerable road users (elementary school pupils) elevates safety classification above ordinary maintenance.',
          model: 'gemini-1.5-flash',
          analyzedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        },
        assignedDepartment: 'Department of Transportation',
        assignedOfficerId: 'officer_sarah_connor',
        assignedOfficerName: 'Officer Sarah Connor',
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
      {
        id: 'CP-2026-0002',
        citizenId: 'citizen_elena_rostova',
        citizenEmail: 'elena.rostova@civicpulse.org',
        citizenName: 'Elena Rostova',
        title: 'Major Clean Water Main Rupture Flooding Commercial Alleyway',
        description:
          'High pressure clean drinking water gushing from cracked municipal main pipe. Flooding the rear alley of commercial shops on Market St. Water is backing up toward basement electrical panels.',
        category: 'water_leakage',
        urgency: 'critical',
        location: {
          address: 'Alley behind 1020 Market St, Financial Core',
          latitude: 37.7812,
          longitude: -122.4111,
          landmark: 'Behind Blue Bottle Coffee alleyway',
        },
        imageUrl:
          'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=600&q=80',
        status: 'assigned',
        statusHistory: [
          {
            status: 'submitted',
            changedBy: 'citizen_elena_rostova',
            changedByName: 'Elena Rostova',
            changedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
            note: 'Filed with photo and exact coordinates.',
          },
          {
            status: 'under_review',
            changedBy: 'officer_sarah_connor',
            changedByName: 'Officer Sarah Connor',
            changedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
            note: 'Triage team flagged potential electrical hazard in basements.',
          },
          {
            status: 'assigned',
            changedBy: 'officer_sarah_connor',
            changedByName: 'Officer Sarah Connor',
            changedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
            note: 'Emergency dispatch to Municipal Water & Power Emergency Squad.',
          },
        ],
        priorityScore: {
          score: 94,
          level: 'critical',
          breakdown: {
            safetyImpact: 35,
            relatedCount: 14,
            timeUnresolved: 2,
            reportedSeverity: 20,
            evidenceCompleteness: 10,
          },
          explanation:
            'Critical urgency (94/100): High volume flooding threatens structural and electrical infrastructure.',
          calculatedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        },
        aiAnalysis: {
          suggestedCategory: 'water_leakage',
          shortSummary: 'High-pressure water main rupture with secondary electrical flooding hazard.',
          keywords: ['water rupture', 'flooding', 'electrical risk', 'commercial district'],
          suggestedUrgency: 'critical',
          suggestedDepartment: 'Water Supply & Public Utilities',
          missingInformation: [],
          reasoning:
            'Water approaching electrical installations requires immediate municipal emergency shutoff valve deployment.',
          model: 'gemini-1.5-flash',
          analyzedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        },
        assignedDepartment: 'Water Supply & Public Utilities',
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      },
      {
        id: 'CP-2026-0003',
        citizenId: 'citizen_marcus_vance',
        citizenEmail: 'marcus.vance@civicpulse.org',
        citizenName: 'Marcus Vance',
        title: 'Broken Streetlights Creating Unsafe Dark Corridor on Elm St',
        description:
          'Four consecutive streetlights are completely dead along Elm Street between 8th and 10th Ave. Sidewalk is pitch black at night, making it unsafe for pedestrians and night shift transit riders.',
        category: 'broken_streetlights',
        urgency: 'medium',
        location: {
          address: 'Elm St between 8th & 10th Avenue, North District',
          latitude: 37.7885,
          longitude: -122.4255,
        },
        status: 'resolved',
        statusHistory: [
          {
            status: 'submitted',
            changedBy: 'citizen_marcus_vance',
            changedByName: 'Marcus Vance',
            changedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
          },
          {
            status: 'under_review',
            changedBy: 'officer_sarah_connor',
            changedByName: 'Officer Sarah Connor',
            changedAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
          },
          {
            status: 'assigned',
            changedBy: 'officer_sarah_connor',
            changedByName: 'Officer Sarah Connor',
            changedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
            note: 'Assigned to Public Lighting & Electrical Maintenance.',
          },
          {
            status: 'in_progress',
            changedBy: 'officer_sarah_connor',
            changedByName: 'Officer Sarah Connor',
            changedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          },
          {
            status: 'resolved',
            changedBy: 'officer_sarah_connor',
            changedByName: 'Officer Sarah Connor',
            changedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
            note: 'Replaced faulty photo-sensor switches and installed new high-efficiency LED fixtures on all 4 light poles. Tested and operational.',
          },
        ],
        priorityScore: {
          score: 52,
          level: 'medium',
          breakdown: {
            safetyImpact: 18,
            relatedCount: 0,
            timeUnresolved: 10,
            reportedSeverity: 10,
            evidenceCompleteness: 8,
          },
          explanation: 'Medium public safety concern regarding nocturnal visibility.',
          calculatedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        },
        aiAnalysis: {
          suggestedCategory: 'broken_streetlights',
          shortSummary: 'Series of 4 inoperative streetlights creating nocturnal visibility hazard.',
          keywords: ['streetlights', 'darkness', 'public safety', 'electrical outage'],
          suggestedUrgency: 'medium',
          suggestedDepartment: 'Electrical & Public Lighting Division',
          missingInformation: [],
          reasoning: 'Non-emergency infrastructure maintenance requiring bucket truck inspection.',
          model: 'gemini-1.5-flash',
          analyzedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        },
        assignedDepartment: 'Electrical & Public Lighting Division',
        resolutionNotes:
          'Replaced faulty photo-sensor switches and installed new high-efficiency LED fixtures on all 4 light poles. Tested and operational.',
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
      {
        id: 'CP-2026-0004',
        citizenId: 'citizen_john_doe',
        citizenEmail: 'john.citizen@civicpulse.org',
        citizenName: 'John Doe',
        title: 'Illegal Dumping of Construction Debris Blocking Storm Drain',
        description:
          'Large pile of drywall, cement rubble, and broken wooden pallets dumped next to curb. Blocking storm sewer inlet just before forecasted weekend rainstorm.',
        category: 'garbage',
        urgency: 'high',
        location: {
          address: '220 Industrial Parkway, East Basin',
          latitude: 37.7612,
          longitude: -122.3921,
        },
        imageUrl:
          'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
        status: 'submitted',
        statusHistory: [
          {
            status: 'submitted',
            changedBy: 'citizen_john_doe',
            changedByName: 'John Doe',
            changedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
            note: 'Report filed with photo evidence.',
          },
        ],
        priorityScore: {
          score: 68,
          level: 'high',
          breakdown: {
            safetyImpact: 22,
            relatedCount: 0,
            timeUnresolved: 2,
            reportedSeverity: 16,
            evidenceCompleteness: 10,
          },
          explanation:
            'High priority due to storm sewer blockage and flood risk during upcoming rain event.',
          calculatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        },
        aiAnalysis: {
          suggestedCategory: 'garbage',
          shortSummary: 'Heavy construction debris obstructing municipal storm drain inlet.',
          keywords: ['illegal dumping', 'storm drain', 'flood risk', 'construction waste'],
          suggestedUrgency: 'high',
          suggestedDepartment: 'Department of Sanitation & Waste Management',
          missingInformation: [],
          reasoning:
            'Obstructed drainage right before heavy rainfall elevates standard waste removal to preventive flood mitigation.',
          model: 'gemini-1.5-flash',
          analyzedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        },
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
    ];

    this.reports = sampleReports;

    this.auditLogs = [
      {
        id: 'LOG-001',
        action: 'REPORT_RESOLVED',
        performedBy: 'officer_sarah_connor',
        performedByName: 'Officer Sarah Connor',
        performedByRole: 'officer',
        targetId: 'CP-2026-0003',
        targetType: 'report',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        details: { note: 'Lighting repairs completed and tested.' },
      },
      {
        id: 'LOG-002',
        action: 'REPORT_ASSIGNED_DEPARTMENT',
        performedBy: 'officer_sarah_connor',
        performedByName: 'Officer Sarah Connor',
        performedByRole: 'officer',
        targetId: 'CP-2026-0002',
        targetType: 'report',
        timestamp: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
        details: { department: 'Water Supply & Public Utilities' },
      },
      {
        id: 'LOG-003',
        action: 'SYSTEM_INITIALIZED',
        performedBy: 'admin_sys',
        performedByName: 'Chief Administrator',
        performedByRole: 'admin',
        targetId: 'SYSTEM',
        targetType: 'system',
        timestamp: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
        details: { message: 'CivicPulse AI municipal portal launched.' },
      },
    ];

    this.persist();
  }

  public resetAllData() {
    this.reports = [];
    this.auditLogs = [];
    this.seedDemonstrationData();
  }
}

export const storageService = new StorageService();
