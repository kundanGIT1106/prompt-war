import { describe, it, expect } from 'vitest';
import { detectDuplicates } from '../../src/lib/duplicateEngine';
import { CivicReport } from '../../src/types';

describe('Duplicate Detection Engine', () => {
  const existingReports: CivicReport[] = [
    {
      id: 'CP-2026-0001',
      citizenId: 'c1',
      citizenEmail: 'c1@test.com',
      citizenName: 'Citizen 1',
      title: 'Deep Hazardous Pothole Near Lincoln School',
      description: 'Massive pothole crater directly at crosswalk of Lincoln Elementary school.',
      category: 'pothole',
      urgency: 'high',
      location: {
        address: '450 Lincoln Ave',
        latitude: 37.7749,
        longitude: -122.4194,
      },
      status: 'submitted',
      statusHistory: [],
      priorityScore: {
        score: 70,
        level: 'high',
        breakdown: { safetyImpact: 25, relatedCount: 0, timeUnresolved: 2, reportedSeverity: 16, evidenceCompleteness: 10 },
        explanation: 'Test',
        calculatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'CP-2026-0002',
      citizenId: 'c2',
      citizenEmail: 'c2@test.com',
      citizenName: 'Citizen 2',
      title: 'Water main break flooding downtown market alley',
      description: 'Drinking water gushing out behind retail shops.',
      category: 'water_leakage',
      urgency: 'critical',
      location: {
        address: '1020 Market St',
        latitude: 37.7812,
        longitude: -122.4111,
      },
      status: 'assigned',
      statusHistory: [],
      priorityScore: {
        score: 90,
        level: 'critical',
        breakdown: { safetyImpact: 35, relatedCount: 0, timeUnresolved: 2, reportedSeverity: 20, evidenceCompleteness: 10 },
        explanation: 'Test',
        calculatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('detects duplicate report with similar text, category, and close geographic proximity', () => {
    const incoming = {
      title: 'Huge pothole at Lincoln elementary school crosswalk',
      description: 'Dangerous crater on Lincoln Ave right by the school entrance.',
      category: 'pothole',
      location: {
        address: '455 Lincoln Ave',
        latitude: 37.7750, // ~15 meters away
        longitude: -122.4195,
      },
      createdAt: new Date().toISOString(),
    };

    const result = detectDuplicates(incoming, existingReports);

    expect(result.isDuplicateSuspected).toBe(true);
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0].reportId).toBe('CP-2026-0001');
    expect(result.matches[0].similarityScore).toBeGreaterThanOrEqual(0.5);
    expect(result.matches[0].reason).toContain('pothole');
  });

  it('does not flag duplicate when categories and locations differ completely', () => {
    const unrelated = {
      title: 'Broken streetlight in residential north hills',
      description: 'Dark post lamp 42 is not turning on at night.',
      category: 'broken_streetlights',
      location: {
        address: '890 Oak Ridge Rd',
        latitude: 37.8500, // 8km away
        longitude: -122.3000,
      },
      createdAt: new Date().toISOString(),
    };

    const result = detectDuplicates(unrelated, existingReports);

    expect(result.isDuplicateSuspected).toBe(false);
    expect(result.matches.length).toBe(0);
  });

  it('ignores self when checking duplicates', () => {
    const target = {
      id: 'CP-2026-0001',
      title: 'Deep Hazardous Pothole Near Lincoln School',
      description: 'Massive pothole crater directly at crosswalk of Lincoln Elementary school.',
      category: 'pothole',
      location: {
        address: '450 Lincoln Ave',
        latitude: 37.7749,
        longitude: -122.4194,
      },
      createdAt: new Date().toISOString(),
    };

    const result = detectDuplicates(target, existingReports);
    // Should NOT match against self CP-2026-0001
    const selfMatch = result.matches.find((m) => m.reportId === 'CP-2026-0001');
    expect(selfMatch).toBeUndefined();
  });
});
