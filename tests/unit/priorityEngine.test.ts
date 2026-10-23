import { describe, it, expect } from 'vitest';
import { calculatePriorityScore } from '../../src/lib/priorityEngine';

describe('Priority Scoring Engine', () => {
  it('calculates higher priority score for safety-critical hazards', () => {
    const criticalReport = {
      category: 'damaged_infrastructure' as const,
      urgency: 'critical' as const,
      title: 'Danger: Bridge support beam cracked and falling onto traffic',
      description: 'Major structural collapse hazard near school crossing. Visible concrete fracture.',
      location: { address: 'Lincoln Bridge', latitude: 37.77 },
      imageUrl: 'https://example.com/crack.jpg',
    };

    const result = calculatePriorityScore(criticalReport, 3);

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.level).toMatch(/high|critical/);
    expect(result.breakdown.safetyImpact).toBeGreaterThanOrEqual(25);
    expect(result.breakdown.evidenceCompleteness).toBe(10);
    expect(result.explanation).toContain('safety impact');
  });

  it('calculates lower score for minor routine complaints', () => {
    const lowReport = {
      category: 'other' as const,
      urgency: 'low' as const,
      title: 'Faded municipal park sign',
      description: 'The park hours sign has faded paint.',
    };

    const result = calculatePriorityScore(lowReport, 0);

    expect(result.score).toBeLessThan(35);
    expect(result.level).toBe('low');
    expect(result.breakdown.safetyImpact).toBeLessThanOrEqual(15);
  });

  it('amplifies score when community duplicate reports exist', () => {
    const baseReport = {
      category: 'pothole' as const,
      urgency: 'medium' as const,
      title: 'Pothole on Main St',
      description: 'Pothole in the right lane slowing down commute traffic.',
    };

    const singleResult = calculatePriorityScore(baseReport, 0);
    const amplifiedResult = calculatePriorityScore(baseReport, 5);

    expect(amplifiedResult.score).toBeGreaterThan(singleResult.score);
    expect(amplifiedResult.breakdown.relatedCount).toBe(14);
    expect(amplifiedResult.explanation).toContain('linked report');
  });

  it('factors unresolved aging time into priority escalation', () => {
    const oldReport = {
      category: 'broken_streetlights' as const,
      urgency: 'medium' as const,
      title: 'Dark corner streetlight out',
      description: 'Corner light has been out for over a week.',
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), // 10 days ago
    };

    const result = calculatePriorityScore(oldReport, 0);
    expect(result.breakdown.timeUnresolved).toBe(15);
  });
});
