# CivicPulse AI — Firebase & Cloud Deployment Guide

## 1. Deployment Architecture

CivicPulse AI utilizes a hybrid serverless architecture designed for security, efficiency, and zero credential leakage:

1. **Frontend Hosting (Firebase Hosting)**
   - Serves the production-compiled Single Page Application (`dist/`) via Firebase's global CDN edge.
   - Enforces SPA rewrites (`"destination": "/index.html"`).
   - Hardened with security headers (CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`).

2. **Database & Authorization (Cloud Firestore + Security Rules)**
   - Persistent store for civic complaint records, user accounts, and immutable audit logs.
   - Governed by `firestore.rules` preventing unauthorized writes, privilege escalation, or cross-citizen record exposure.
   - Optimized with compound query indexes (`firestore.indexes.json`).

3. **Protected AI Gateway (Server / Cloud Run / Cloud Functions)**
   - Houses the Google Gemini 1.5 Flash SDK client.
   - Secret key `GEMINI_API_KEY` is maintained strictly server-side (Google Secret Manager or environment variables) and never exposed to browser clients.

---

## 2. Prerequisites & Tools

- **Node.js** >= 20.0.0 & **npm** >= 10.0.0
- **Firebase CLI** (`firebase-tools`)
- An active Firebase Project (e.g. `civicpulse-ai-prod`)

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Build the Production Frontend

Compile the optimized static bundle:
```bash
npm run build
```
*Output: Production files are generated in `./dist` (HTML: 1.17kB, JS: 88kB gzipped, CSS: 7kB gzipped).*

### Step 2: Authenticate with Firebase CLI

Log into your authorized Google/Firebase account:
```bash
npx firebase login
```

### Step 3: Connect to Your Firebase Project

Select or set your active Firebase project ID:
```bash
npx firebase use --add
# Or directly:
npx firebase use <your-firebase-project-id>
```

### Step 4: Deploy Firestore Rules and Indexes

Deploy database security rules and compound query indexes:
```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```

### Step 5: Deploy the Frontend to Firebase Hosting

Deploy the compiled production website to Firebase Hosting CDN:
```bash
npx firebase deploy --only hosting
```

Upon completion, Firebase CLI prints your live hosting URL:
`✔  Deploy complete! Project Console: https://console.firebase.google.com/project/<project-id>/overview`
`Hosting URL: https://<project-id>.web.app`

### Step 6: Deploy the Protected AI Gateway (Cloud Run / Cloud Functions)

If deploying the backend server as a containerized service on Cloud Run:
```bash
# Build and deploy to Cloud Run
gcloud run deploy civicpulse-api \
  --source . \
  --region us-central1 \
  --set-env-vars GEMINI_API_KEY="<your-secret-gemini-key>" \
  --allow-unauthenticated
```

Or configure Cloud Functions for Firebase:
```bash
npx firebase deploy --only functions
```

---

## 4. Secret Configuration Best Practices

- **Never** store API keys or secrets in `.env`, client code, or Git history.
- The repository includes a `.env.example` with placeholder names only.
- In Google Cloud / Firebase environments, store `GEMINI_API_KEY` in **Google Secret Manager**:
  ```bash
  firebase functions:secrets:set GEMINI_API_KEY
  ```

---

## 5. Billing & Permission Safeguards

- **Zero Charge Guarantee**: CivicPulse AI's frontend build and deterministic fallback engine run completely free under Firebase Spark (free) tier limits.
- Deploying Cloud Functions or Cloud Run requires billing activation on Google Cloud Platform. Always verify quota limits and establish billing alerts before enabling chargeable cloud resources.
