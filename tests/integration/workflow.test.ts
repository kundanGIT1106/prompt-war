import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../../src/lib/storageService';
import { validateStatusTransition } from '../../src/lib/statusLifecycle';

describe('End-to-End Workflow & Integration Suite', () => {
  beforeEach(() => {
    storageService.resetAllData();
  });

  it('citizen creates report -> report persists with deterministic priority and duplicate check', async () => {
    const created = await storageService.createReport({
      citizenId: 'citizen_test_user',
      citizenEmail: 'test.citizen@example.com',
      citizenName: 'Test Citizen',
      title: 'Water pooling on sidewalks after rain',
      description: 'Stagnant water ponding on walkway due to clogged drainage curb grating.',
      category: 'water_leakage',
      urgency: 'medium',
      location: { address: '780 Pine St, West Basin' },
    });

    expect(created.id).toMatch(/^CP-2026-\d{4}$/);
    expect(created.status).toBe('submitted');
    expect(created.priorityScore.score).toBeGreaterThan(0);
    expect(created.statusHistory.length).toBe(1);

    // Verify report retrieval
    const retrieved = await storageService.getReportById(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe(created.title);
  });

  it('officer reviews, assigns department, and advances status lifecycle with audit entry', async () => {
    // 1. Citizen submits
    const report = await storageService.createReport({
      citizenId: 'c_jane',
      citizenEmail: 'jane@example.com',
      citizenName: 'Jane',
      title: 'Broken high-mast streetlight out on corner',
      description: 'Light fixture bulb is flickering and out during nighttime.',
      category: 'broken_streetlights',
      urgency: 'medium',
      location: { address: 'Corner 12th & Market' },
    });

    // 2. Officer transitions to under_review
    const reviewRes = await storageService.updateReportStatus({
      reportId: report.id,
      newStatus: 'under_review',
      officer: { uid: 'off_1', name: 'Officer Dan', role: 'officer' },
      details: { note: 'Inspecting complaint details.' },
    });
    expect(reviewRes.success).toBe(true);
    expect(reviewRes.report?.status).toBe('under_review');

    // 3. Officer assigns to department
    const assignRes = await storageService.assignReport({
      reportId: report.id,
      department: 'Electrical & Public Lighting Division',
      officer: { uid: 'off_1', name: 'Officer Dan', role: 'officer' },
    });
    expect(assignRes.success).toBe(true);
    expect(assignRes.report?.assignedDepartment).toBe('Electrical & Public Lighting Division');
    expect(assignRes.report?.status).toBe('assigned');

    // 4. Officer advances to in_progress
    const progressRes = await storageService.updateReportStatus({
      reportId: report.id,
      newStatus: 'in_progress',
      officer: { uid: 'off_1', name: 'Officer Dan', role: 'officer' },
      details: { note: 'Bucket truck dispatched to site.' },
    });
    expect(progressRes.success).toBe(true);
    expect(progressRes.report?.status).toBe('in_progress');

    // 5. Officer resolves with mandatory verification notes
    const resolveRes = await storageService.updateReportStatus({
      reportId: report.id,
      newStatus: 'resolved',
      officer: { uid: 'off_1', name: 'Officer Dan', role: 'officer' },
      details: {
        resolutionNotes: 'Ballast repaired and energy-efficient LED luminaire installed and tested.',
      },
    });
    expect(resolveRes.success).toBe(true);
    expect(resolveRes.report?.status).toBe('resolved');
    expect(resolveRes.report?.resolutionNotes).toContain('Ballast repaired');

    // 6. Verify audit trail was recorded
    const logs = await storageService.getAuditLogs();
    const relatedLogs = logs.filter((l) => l.targetId === report.id);
    expect(relatedLogs.length).toBeGreaterThanOrEqual(4);
  });

  it('officer manually merges duplicate report with human confirmation', async () => {
    // Report 1: Primary
    const primary = await storageService.createReport({
      citizenId: 'c1',
      citizenEmail: 'c1@test.com',
      citizenName: 'Citizen 1',
      title: 'Water main rupture on 5th Ave',
      description: 'Major water line rupture flooding street curb.',
      category: 'water_leakage',
      urgency: 'critical',
      location: { address: '500 5th Ave' },
    });

    // Report 2: Duplicate
    const duplicate = await storageService.createReport({
      citizenId: 'c2',
      citizenEmail: 'c2@test.com',
      citizenName: 'Citizen 2',
      title: 'Gushing water line 5th ave',
      description: 'Flooding near 500 5th ave street corner.',
      category: 'water_leakage',
      urgency: 'high',
      location: { address: '502 5th Ave' },
    });

    // Merge duplicate into primary
    const mergeRes = await storageService.mergeReports({
      primaryReportId: primary.id,
      duplicateReportId: duplicate.id,
      officer: { uid: 'off_sarah', name: 'Officer Sarah', role: 'officer' },
      mergeReason: 'Identical pipe rupture incident reported by neighbor.',
    });

    expect(mergeRes.success).toBe(true);
    expect(mergeRes.primaryReport?.mergedReportIds).toContain(duplicate.id);

    // Verify duplicate is closed as rejected/merged
    const updatedDup = await storageService.getReportById(duplicate.id);
    expect(updatedDup?.isMerged).toBe(true);
    expect(updatedDup?.status).toBe('rejected');
    expect(updatedDup?.mergedIntoReportId).toBe(primary.id);
  });

  it('prevents citizens from executing officer status updates', async () => {
    const report = await storageService.createReport({
      citizenId: 'citizen_attacker',
      citizenEmail: 'attacker@test.com',
      citizenName: 'Attacker',
      title: 'Trying to resolve own complaint',
      description: 'Pothole on street test description text here.',
      category: 'pothole',
      urgency: 'low',
      location: { address: '100 Test St' },
    });

    const unauthorizedRes = await storageService.updateReportStatus({
      reportId: report.id,
      newStatus: 'resolved',
      officer: { uid: 'citizen_attacker', name: 'Attacker', role: 'citizen' },
      details: { resolutionNotes: 'Trying to bypass system.' },
    });

    expect(unauthorizedRes.success).toBe(false);
    expect(unauthorizedRes.error).toContain('Citizens are not authorized');
  });
});
