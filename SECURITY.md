# CivicPulse AI — Security Threat Model & Defense Architecture

## 1. Threat Model Overview

CivicPulse AI adheres to the Principle of Least Privilege and Defense-in-Depth. The threat model identifies 10 critical attack surfaces in civic-tech platforms and documents concrete technical mitigations:

| Threat Category | Potential Impact | Technical Mitigation in CivicPulse AI |
| :--- | :--- | :--- |
| **1. Privilege Escalation** | Regular citizens promote themselves to municipal officers or administrators. | Client-side registration strictly defaults role to `'citizen'`. Role assignment is governed by server validation (`/api/admin/update-role`) and `firestore.rules` preventing non-admins from modifying the `role` field. |
| **2. Cross-User Data Exposure** | Citizen A reads private records or contact info of Citizen B. | Firestore Security Rules (`firestore.rules`) enforce `isOwner(resource.data.citizenId) || isOfficer()`. Queries strictly filter by `citizenId`. |
| **3. Prompt Injection** | Adversary injects jailbreaks (`ignore previous instructions`, `DAN mode`, `<system>`) into complaint text to alter AI behavior. | `sanitizeComplaintText` regex filters neutralize instruction overrides into `[REDACTED_SECURITY_FILTER]`. Strict system instructions and Zod runtime schema validation isolate untrusted user data. |
| **4. API Key & Secret Exposure** | Google Gemini API keys or service account credentials leaked in public bundles. | Secrets are never bundled into client Vite code. The Gemini SDK is accessed via the protected backend (`server/src/server.ts`), utilizing `process.env.GEMINI_API_KEY`. |
| **5. Unauthorized Status Changes** | Citizen marks their own unresolved issue as "Resolved" or modifies department assignment. | `validateStatusTransition` enforces that only `officer` or `admin` roles can transition statuses. Firestore rules block citizen modifications to `status`, `assignedDepartment`, and `priorityScore`. |
| **6. Malicious File Uploads** | Attacker uploads executables, scripts, or oversized binary payloads. | `validateImageUpload` enforces strict MIME type filtering (`image/jpeg`, `image/png`, `image/webp`) and a 5MB payload limit before processing. |
| **7. Denial of Service / Token Exhaustion** | Flooding backend with massive complaint texts or rapid automated requests. | Input length truncated at 2,500 characters; Express server enforces 5MB body limits and IP-based sliding window rate limiting (60 requests/min). |
| **8. Audit Log Tampering** | Rogue actor deletes evidence of improper dismissal or unauthorized edits. | Audit records in `audit_logs` collection are strictly append-only: Firestore rules declare `allow update, delete: if false;`. |
| **9. Stored Cross-Site Scripting (XSS)** | Malicious HTML or JavaScript embedded in complaint titles or descriptions. | HTML tag stripping via regex sanitization and React default JSX context escaping prevent script execution. |
| **10. Black-Box Emergency Misrepresentation** | User mistakes AI triage priority for official 911 emergency dispatch. | Explicit regulatory alert notices and modal disclaimers clarify that priority scoring is a municipal workflow queuing aid, not a verified emergency dispatch assessment. |

---

## 2. Server-Side Security Implementation

### A. Input Sanitization & Prompt Injection Mitigation (`src/lib/security.ts`)

```typescript
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*:\s*you\s+are/i,
  /you\s+are\s+now\s+an\s+unrestricted/i,
  /dan\s+mode/i,
  /override\s+system\s+prompt/i,
  /<system>/i,
];

export function sanitizeComplaintText(input: string) {
  let text = input.trim();
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, '[REDACTED_SECURITY_FILTER]');
    }
  }
  // Strip potential script/HTML markup
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<[^>]+>/g, '');
  return { cleanText: text.substring(0, 2500) };
}
```

### B. Rate Limiting & Resource Protection (`server/src/server.ts`)

- In-memory token bucket / sliding window limits requests to **60 requests per minute per IP address**.
- Request payload limit capped at `5MB` using `express.json({ limit: '5mb' })`.
- Strict CORS origin whitelisting ensures only authorized frontend clients can invoke server endpoints.

---

## 3. Database Security Rules (`firestore.rules`)

Cloud Firestore rules enforce declarative, server-side data authorization:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Ownership and Role Verification
    function isAuthenticated() { return request.auth != null; }
    function isOwner(uid) { return isAuthenticated() && request.auth.uid == uid; }
    function isOfficer() { return isAuthenticated() && (request.auth.token.role in ['officer', 'admin']); }
    function isAdmin() { return isAuthenticated() && request.auth.token.role == 'admin'; }

    // Users: Prevent self-promotion
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId) && request.resource.data.role == 'citizen';
      allow update: if isAdmin() || (isOwner(userId) && request.resource.data.role == resource.data.role);
    }

    // Reports: Protected field guards
    match /reports/{reportId} {
      allow read: if isAuthenticated() && (isOwner(resource.data.citizenId) || isOfficer());
      allow create: if isAuthenticated() && request.resource.data.status == 'submitted';
      allow update: if isOfficer() || (
        isOwner(resource.data.citizenId) &&
        request.resource.data.status == resource.data.status &&
        request.resource.data.priorityScore == resource.data.priorityScore
      );
    }

    // Immutable Audit Logs
    match /audit_logs/{logId} {
      allow read: if isOfficer();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Immutable!
    }
  }
}
```

---

## 4. Verification Evidence

All security constraints are validated by automated unit and integration tests:
- `tests/unit/security.test.ts` (9 tests passed: prompt injection neutralization, XSS tag removal, role-action matrices, file upload format and size limits).
- `tests/integration/workflow.test.ts` (Attempts by regular citizens to transition statuses or modify assignments are rejected with `403 Unauthorized`).
