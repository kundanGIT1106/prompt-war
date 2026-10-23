import {
  AIAnalysisResult,
  DuplicateDetectionResult,
  IssueCategory,
  IssueUrgency,
  ResolutionRecommendation,
} from '../types';

const API_BASE = '/api';

export async function requestAIReportAnalysis(report: {
  title: string;
  description: string;
  category: IssueCategory;
  urgency: IssueUrgency;
  location?: { address?: string };
}): Promise<AIAnalysisResult> {
  try {
    const res = await fetch(`${API_BASE}/ai/analyze-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('AI Server API unavailable or failed, utilizing deterministic rule fallback:', err);
    return getDeterministicRuleFallback(report);
  }
}

export async function requestResolutionAssistance(report: {
  id: string;
  category: IssueCategory;
  title: string;
  description: string;
  urgency: IssueUrgency;
}): Promise<ResolutionRecommendation> {
  try {
    const res = await fetch(`${API_BASE}/ai/suggest-resolution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback below
  }

  // Deterministic municipal standard resolution guide
  const departmentMapping: Record<IssueCategory, { dept: string; action: string; checklist: string[]; days: number }> = {
    pothole: {
      dept: 'Department of Transportation',
      action: 'Dispatch Roadway Maintenance crew for pavement milling and asphalt cold-patch or permanent infill.',
      checklist: [
        'Place high-visibility safety traffic cones around crater',
        'Inspect surrounding roadbed for subsurface moisture failure',
        'Clean debris and apply tack coat bonding emulsion',
        'Fill with hot mix asphalt and compact using vibratory roller',
      ],
      days: 2,
    },
    water_leakage: {
      dept: 'Water Supply & Public Utilities',
      action: 'Emergency dispatch to isolate valve section and excavate damaged piping connection.',
      checklist: [
        'Check utility maps for co-located electrical and gas lines',
        'Turn off municipal isolation valve to halt flooding',
        'Replace burst pipe segment with corrosion-resistant ductile iron',
        'Restore water pressure and conduct water purity test',
      ],
      days: 1,
    },
    broken_streetlights: {
      dept: 'Electrical & Public Lighting Division',
      action: 'Deploy bucket truck to test ballast, wiring harness, and photo-sensor unit.',
      checklist: [
        'Isolate local electrical breaker panel',
        'Inspect pole access door for frayed wiring or water intrusion',
        'Replace ballast and install high-lumen energy-efficient LED luminaire',
        'Test automated photocell activation',
      ],
      days: 3,
    },
    garbage: {
      dept: 'Department of Sanitation & Waste Management',
      action: 'Dispatch bulk collection vehicle and mechanical street sweeper.',
      checklist: [
        'Inspect site for hazardous or biohazard chemical materials',
        'Load bulk refuse into compactor vehicle',
        'Disinfect and sweep curb and stormwater grate entrance',
        'Post municipal anti-dumping signage and citation warning',
      ],
      days: 1,
    },
    damaged_infrastructure: {
      dept: 'Public Works & Civil Engineering',
      action: 'Structural engineer site assessment and installation of perimeter barricade.',
      checklist: [
        'Establish physical perimeter exclusion zone',
        'Structural load-bearing assessment and photographic documentation',
        'Draft remediation work order for contractor bidding',
        'Execute reinforced repair or demolition',
      ],
      days: 5,
    },
    other: {
      dept: 'Municipal Citizen Services Bureau',
      action: 'Conduct citizen outreach call to clarify issue specifics and coordinate multi-agency review.',
      checklist: [
        'Verify complaint jurisdiction',
        'Contact reporting citizen for additional context',
        'Route work order to specialized municipal division',
      ],
      days: 4,
    },
  };

  const plan = departmentMapping[report.category] || departmentMapping.other;
  return {
    recommendedDepartment: plan.dept,
    recommendedAction: plan.action,
    checklist: plan.checklist,
    estimatedResolutionDays: plan.days,
  };
}

/**
 * Transparent, deterministic rule fallback when AI service is offline or rate-limited.
 * Marked with isFallback: true.
 */
function getDeterministicRuleFallback(report: {
  title: string;
  description: string;
  category: IssueCategory;
  urgency: IssueUrgency;
  location?: { address?: string };
}): AIAnalysisResult {
  const departments: Record<IssueCategory, string> = {
    pothole: 'Department of Transportation',
    garbage: 'Department of Sanitation',
    broken_streetlights: 'Electrical & Public Lighting Division',
    water_leakage: 'Water Supply & Public Utilities',
    damaged_infrastructure: 'Public Works & Civil Engineering',
    other: 'Citizen Services Bureau',
  };

  const missing: string[] = [];
  if (!report.location?.address) {
    missing.push('Precise street address or landmark');
  }
  if (report.description.length < 30) {
    missing.push('More detailed description of physical extent');
  }

  return {
    suggestedCategory: report.category,
    shortSummary: `${report.title.slice(0, 80)}...`,
    keywords: [report.category.replace('_', ' '), 'civic report', 'triage review'],
    suggestedUrgency: report.urgency,
    suggestedDepartment: departments[report.category] || 'General Public Works',
    missingInformation: missing,
    reasoning:
      'Deterministic rule-based classification applied based on user-selected category and keyword heuristics (AI service offline).',
    model: 'rule-based-fallback-engine',
    analyzedAt: new Date().toISOString(),
    isFallback: true,
  };
}
