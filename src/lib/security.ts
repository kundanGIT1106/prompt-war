import { UserRole } from '../types';

/**
 * Security & Input Sanitization Utilities
 * Implements defenses against:
 * 1. Prompt Injection (jailbreaking, instruction overrides, system token manipulation)
 * 2. Cross-Site Scripting (XSS)
 * 3. Privilege Escalation
 * 4. Dangerous file attachments
 */

// Prompt injection patterns to detect and neutralize
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*:\s*you\s+are/i,
  /you\s+are\s+now\s+an\s+unrestricted/i,
  /dan\s+mode/i,
  /override\s+system\s+prompt/i,
  /output\s+the\s+following\s+system\s+prompt/i,
  /reveal\s+your\s+hidden\s+instructions/i,
  /<system>/i,
  /<\/system>/i,
  /```system/i,
];

/**
 * Sanitizes citizen report text to prevent prompt injection and markup exploits
 */
export function sanitizeComplaintText(input: string): {
  cleanText: string;
  hadSuspiciousPatterns: boolean;
} {
  if (!input) return { cleanText: '', hadSuspiciousPatterns: false };

  let text = input.trim();
  let hadSuspicious = false;

  // Check for known jailbreak / prompt injection phrases
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      hadSuspicious = true;
      text = text.replace(pattern, '[REDACTED_SECURITY_FILTER]');
    }
  }

  // Strip potential script / HTML tags
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<[^>]+>/g, '');

  // Truncate to reasonable maximum length (prevent DoS / excessive token usage)
  if (text.length > 2500) {
    text = text.substring(0, 2500);
  }

  return { cleanText: text, hadSuspiciousPatterns: hadSuspicious };
}

/**
 * Validates role permissions for actions
 */
export function canUserPerformAction(
  userRole: UserRole,
  action:
    | 'submit_report'
    | 'view_own_report'
    | 'view_all_reports'
    | 'update_status'
    | 'assign_department'
    | 'merge_reports'
    | 'manage_staff_roles'
    | 'view_audit_logs'
): boolean {
  switch (action) {
    case 'submit_report':
    case 'view_own_report':
      return true; // All authenticated users can submit and view their own

    case 'view_all_reports':
    case 'update_status':
    case 'assign_department':
    case 'merge_reports':
      return userRole === 'officer' || userRole === 'admin';

    case 'manage_staff_roles':
    case 'view_audit_logs':
      return userRole === 'admin';

    default:
      return false;
  }
}

/**
 * Safe image validation (MIME type and size limit)
 */
export function validateImageUpload(file: {
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file format. Only JPEG, PNG, and WebP images are permitted.',
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File size exceeds maximum allowed limit of 5MB.',
    };
  }

  return { valid: true };
}
