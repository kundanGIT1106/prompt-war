import {
  CivicReport,
  IssueCategory,
  IssueUrgency,
  PriorityScore,
  PriorityScoreBreakdown,
} from '../types';

/**
 * Deterministic Explainable Priority Scoring Engine
 * Factors:
 * 1. Potential safety impact (0 - 35 points)
 *    - Water contamination, open manhole/damaged infrastructure, hazardous pothole, electric wires
 * 2. Number of related / duplicate reports (0 - 20 points)
 *    - Community signal amplifier: 1 report = 0, 2-3 = 8, 4-6 = 14, 7+ = 20
 * 3. Time unresolved / Age factor (0 - 15 points)
 *    - 0-24h = 2, 1-3d = 6, 3-7d = 10, >7d = 15
 * 4. Citizen reported severity / urgency (0 - 20 points)
 *    - low = 5, medium = 10, high = 16, critical = 20
 * 5. Evidence completeness (0 - 10 points)
 *    - location present (+4), photo evidence present (+4), detailed description > 40 chars (+2)
 *
 * Total Score = 0 - 100
 * Score Levels:
 *  0 - 34: Low
 *  35 - 64: Medium
 *  65 - 84: High
 *  85 - 100: Critical
 *
 * NOTICE: This score is a deterministic triage guide for municipal queuing and
 * must NOT be represented as a verified emergency dispatcher assessment.
 */

const SAFETY_RISK_KEYWORDS = [
  'danger',
  'hazard',
  'injury',
  'accident',
  'collapse',
  'sinkhole',
  'live wire',
  'electric shock',
  'flooding',
  'toxic',
  'gas leak',
  'manhole',
  'elderly',
  'children',
  'school',
  'hospital',
];

const CATEGORY_DEFAULT_SAFETY_IMPACT: Record<IssueCategory, number> = {
  damaged_infrastructure: 25,
  water_leakage: 20,
  broken_streetlights: 15,
  pothole: 18,
  garbage: 10,
  other: 8,
};

export function calculatePriorityScore(
  report: {
    category: IssueCategory;
    urgency: IssueUrgency;
    title: string;
    description: string;
    location?: { address?: string; latitude?: number };
    imageUrl?: string;
    createdAt?: string;
  },
  relatedReportsCount: number = 0
): PriorityScore {
  const combinedText = `${report.title} ${report.description}`.toLowerCase();

  // 1. Safety Impact (0 - 35)
  let safetyImpact = CATEGORY_DEFAULT_SAFETY_IMPACT[report.category] || 10;
  const matchedKeywords = SAFETY_RISK_KEYWORDS.filter((kw) =>
    combinedText.includes(kw)
  );

  // Add 3 points per safety keyword (capped at 35 total)
  safetyImpact = Math.min(35, safetyImpact + matchedKeywords.length * 3.5);

  // 2. Related reports / Community signal (0 - 20)
  let relatedScore = 0;
  if (relatedReportsCount >= 7) relatedScore = 20;
  else if (relatedReportsCount >= 4) relatedScore = 14;
  else if (relatedReportsCount >= 2) relatedScore = 8;
  else if (relatedReportsCount === 1) relatedScore = 4;

  // 3. Time unresolved (0 - 15)
  let timeScore = 2; // initial baseline
  if (report.createdAt) {
    const ageInHours =
      (Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageInHours > 168) {
      // > 7 days
      timeScore = 15;
    } else if (ageInHours > 72) {
      // 3 - 7 days
      timeScore = 10;
    } else if (ageInHours > 24) {
      // 1 - 3 days
      timeScore = 6;
    } else {
      timeScore = 2;
    }
  }

  // 4. Reported Severity (0 - 20)
  const severityScores: Record<IssueUrgency, number> = {
    low: 5,
    medium: 10,
    high: 16,
    critical: 20,
  };
  const reportedSeverity = severityScores[report.urgency] || 10;

  // 5. Evidence Completeness (0 - 10)
  let evidenceCompleteness = 0;
  if (report.location?.address || report.location?.latitude) {
    evidenceCompleteness += 4;
  }
  if (report.imageUrl && report.imageUrl.trim().length > 0) {
    evidenceCompleteness += 4;
  }
  if (report.description && report.description.trim().length >= 40) {
    evidenceCompleteness += 2;
  }

  // Calculate sum and cap at 100
  const rawScore =
    safetyImpact +
    relatedScore +
    timeScore +
    reportedSeverity +
    evidenceCompleteness;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  let level: IssueUrgency = 'low';
  if (score >= 85) level = 'critical';
  else if (score >= 65) level = 'high';
  else if (score >= 35) level = 'medium';

  const breakdown: PriorityScoreBreakdown = {
    safetyImpact: Math.round(safetyImpact),
    relatedCount: relatedScore,
    timeUnresolved: timeScore,
    reportedSeverity,
    evidenceCompleteness,
  };

  const explanations: string[] = [];
  if (safetyImpact >= 25) {
    explanations.push(
      `High safety impact (${breakdown.safetyImpact}/35) due to category ${report.category}${matchedKeywords.length ? ` and indicators: ${matchedKeywords.slice(0, 3).join(', ')}` : ''}`
    );
  }
  if (relatedReportsCount > 0) {
    explanations.push(
      `${relatedReportsCount} linked report(s) amplify community priority (+${relatedScore} pts)`
    );
  }
  if (timeScore >= 10) {
    explanations.push(`Aging issue unresolved for over 3 days (+${timeScore} pts)`);
  }
  if (evidenceCompleteness >= 8) {
    explanations.push(`High confidence with complete geolocation and evidence (+${evidenceCompleteness} pts)`);
  }

  const explanation =
    explanations.length > 0
      ? explanations.join('; ')
      : `Standard triage assessment with score ${score}/100.`;

  return {
    score,
    level,
    breakdown,
    explanation,
    calculatedAt: new Date().toISOString(),
  };
}
