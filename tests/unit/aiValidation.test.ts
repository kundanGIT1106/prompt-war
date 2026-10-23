import { describe, it, expect } from 'vitest';
import { AIAnalysisSchema, generateDeterministicRuleAnalysis } from '../../server/src/geminiService';

describe('AI Output Validation & Fallback Handling', () => {
  it('validates correct structured AI output matching schema', () => {
    const validOutput = {
      suggestedCategory: 'pothole',
      shortSummary: 'Severe road crater on Elm St causing tire blowouts.',
      keywords: ['pothole', 'hazard', 'traffic', 'roadbed'],
      suggestedUrgency: 'high',
      suggestedDepartment: 'Department of Transportation',
      missingInformation: ['Exact house number'],
      reasoning: 'Directly impacts vehicular safety on a primary arterial road.',
    };

    const parsed = AIAnalysisSchema.safeParse(validOutput);
    expect(parsed.success).toBe(true);
  });

  it('rejects malformed output with illegal category or missing fields', () => {
    const invalidCategory = {
      suggestedCategory: 'alien_invasion', // Illegal
      shortSummary: 'Short',
      keywords: ['tag'],
      suggestedUrgency: 'extreme', // Illegal
      suggestedDepartment: 'DoT',
      missingInformation: [],
      reasoning: 'Reason',
    };

    const parsed = AIAnalysisSchema.safeParse(invalidCategory);
    expect(parsed.success).toBe(false);
  });

  it('generates fully compliant deterministic rule fallback when AI provider is unavailable', () => {
    const report = {
      title: 'Water pipe leaking all over sidewalk',
      description: 'Clean water bubbling through concrete pavement since yesterday morning.',
      category: 'water_leakage',
      urgency: 'high',
      location: { address: '320 Main St' },
    };

    const fallback = generateDeterministicRuleAnalysis(report);

    expect(fallback.isFallback).toBe(true);
    expect(fallback.model).toBe('rule-based-fallback-engine');
    expect(fallback.suggestedCategory).toBe('water_leakage');
    expect(fallback.suggestedDepartment).toBe('Water Supply & Public Utilities');
    expect(fallback.keywords.length).toBeGreaterThan(0);

    // Verify fallback output satisfies strict Zod schema
    const parsed = AIAnalysisSchema.safeParse(fallback);
    expect(parsed.success).toBe(true);
  });
});
