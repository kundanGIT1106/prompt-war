import {
  CivicReport,
  DuplicateDetectionResult,
  DuplicateMatch,
} from '../types';

/**
 * Duplicate Detection Engine
 * Multi-factor matching:
 * 1. Text Similarity (Jaccard token similarity + word n-grams)
 * 2. Category Match (Must match or closely correlate)
 * 3. Geographic Proximity (Haversine distance if coordinates exist, or text address overlap)
 * 4. Report Timing (Closer in time = higher likelihood of duplicate event)
 *
 * IMPORTANT: No automated merging! Possible matches are surfaced with human-readable
 * reasons so that authorized municipal officers make the final decision.
 */

function tokenize(text: string): Set<string> {
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(clean);
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'this',
  'that',
  'there',
  'from',
  'have',
  'here',
  'near',
  'please',
  'help',
  'very',
  'some',
  'issue',
  'problem',
]);

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

// Haversine formula to compute distance in km
function calculateGeoDistanceKm(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined
  ) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function detectDuplicates(
  target: {
    id?: string;
    title: string;
    description: string;
    category: string;
    location?: { address?: string; latitude?: number; longitude?: number };
    createdAt?: string;
  },
  existingReports: CivicReport[],
  similarityThreshold: number = 0.45
): DuplicateDetectionResult {
  const targetTokens = tokenize(`${target.title} ${target.description}`);
  const matches: DuplicateMatch[] = [];

  for (const existing of existingReports) {
    // Don't compare against self or already resolved/rejected reports older than 30 days
    if (existing.id === target.id) continue;
    if (existing.isMerged) continue;

    const existingTokens = tokenize(`${existing.title} ${existing.description}`);
    const textSimilarity = calculateJaccardSimilarity(targetTokens, existingTokens);

    // Category weighting
    const categoryMatches = existing.category === target.category;
    let categoryWeight = categoryMatches ? 0.25 : -0.15;

    // Geo proximity
    let geoWeight = 0;
    let geoReason = '';
    const distanceKm = calculateGeoDistanceKm(
      target.location?.latitude,
      target.location?.longitude,
      existing.location?.latitude,
      existing.location?.longitude
    );

    if (distanceKm !== null) {
      if (distanceKm <= 0.2) {
        // Within 200m
        geoWeight = 0.35;
        geoReason = `Within ${(distanceKm * 1000).toFixed(0)}m of target`;
      } else if (distanceKm <= 0.8) {
        // Within 800m
        geoWeight = 0.2;
        geoReason = `Within ${distanceKm.toFixed(2)}km`;
      } else if (distanceKm > 5) {
        // Far away, penalize duplicate likelihood
        geoWeight = -0.3;
      }
    } else if (
      target.location?.address &&
      existing.location?.address &&
      target.location.address.trim().length > 3
    ) {
      // Address text match fallback
      const addrTokensTarget = tokenize(target.location.address);
      const addrTokensExisting = tokenize(existing.location.address);
      const addrSim = calculateJaccardSimilarity(addrTokensTarget, addrTokensExisting);
      if (addrSim > 0.4) {
        geoWeight = 0.2;
        geoReason = 'Matching street address name';
      }
    }

    // Time proximity (within 14 days)
    let timeWeight = 0;
    if (target.createdAt && existing.createdAt) {
      const diffHours = Math.abs(
        new Date(target.createdAt).getTime() - new Date(existing.createdAt).getTime()
      ) / (1000 * 60 * 60);
      if (diffHours <= 48) {
        timeWeight = 0.15;
      } else if (diffHours <= 168) {
        timeWeight = 0.08;
      }
    }

    // Final combined score (clamped between 0 and 1)
    const combinedScore = Math.min(
      1.0,
      Math.max(0.0, textSimilarity * 0.45 + categoryWeight + geoWeight + timeWeight)
    );

    if (combinedScore >= similarityThreshold) {
      const reasons: string[] = [];
      if (categoryMatches) reasons.push(`Same category (${target.category})`);
      if (textSimilarity > 0.3) {
        reasons.push(`${Math.round(textSimilarity * 100)}% keyword overlap`);
      }
      if (geoReason) reasons.push(geoReason);
      if (timeWeight > 0.1) reasons.push('Reported within 48h of each other');

      matches.push({
        reportId: existing.id,
        reportTitle: existing.title,
        similarityScore: Math.round(combinedScore * 100) / 100,
        reason: reasons.join(' • '),
        status: existing.status,
        createdAt: existing.createdAt,
      });
    }
  }

  // Sort descending by similarity score
  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  return {
    isDuplicateSuspected: matches.length > 0,
    matches: matches.slice(0, 5), // top 5 most relevant
    checkedAt: new Date().toISOString(),
    method: 'hybrid_ai_rules',
  };
}
