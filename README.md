# CivicPulse AI — Intelligent Civic Issue Reporting and Resolution Platform

[![Competition](https://img.shields.io/badge/Competition-Build%20Beyond%20AI-blue.svg)](https://buildbeyond.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-emerald.svg)](ACCESSIBILITY.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.7-blue.svg)](tsconfig.json)
[![Tests](https://img.shields.io/badge/Tests-35%20Passed-success.svg)](TESTING.md)

**CivicPulse AI** is an intelligent civic complaint intelligence and municipal resolution platform. It solves the critical bottleneck in civic governance: disorganized complaints regarding potholes, garbage accumulation, broken streetlights, water main ruptures, and structural hazards.

Rather than being a simple conversational chatbot, CivicPulse AI implements an **auditable, deterministic, end-to-end municipal operational workflow** combining Google Gemini AI reasoning with deterministic safety rules, duplicate detection, and role-governed lifecycle management.

---

## 🌟 Key Capabilities

1. **AI Report Understanding (Google Gemini 1.5 Flash)**
   - Automatically summarizes complex citizen complaint text into structured JSON.
   - Recommends appropriate municipal divisions (e.g. *Water Supply & Public Utilities*, *Department of Transportation*).
   - Detects missing critical information (such as cross-streets or crater depth).
   - Operates with an automatic **zero-downtime deterministic fallback engine** if API quotas or networks are offline.
   - Strict UI demarcation between **AI Advisory Suggestions** and **Human-Approved Decisions**.

2. **Multi-Factor Duplicate Detection**
   - Synthesizes text token overlap (Jaccard similarity), category matching, geographic coordinates (Haversine distance formula), and reporting timestamps.
   - Flags suspected duplicate incidents with explicit explanations.
   - **Enforces Human Confirmation**: Never automatically merges complaints without authorized municipal officer verification.

3. **Deterministic Explainable Priority Engine (0–100 Score)**
   - Eliminates black-box decisions with a transparent 5-factor scoring model:
     - Potential safety hazard impact (0–35 pts)
     - Community signal & duplicate volume amplifier (0–20 pts)
     - Time unresolved / aging factor (0–15 pts)
     - Citizen-reported urgency level (0–20 pts)
     - Evidence completeness (0–10 pts)
   - Features explicit regulatory emergency disclaimers separating municipal triage from 911 dispatch.

4. **Multi-Portal Role Architecture**
   - **Citizen Portal**: Report filing with input sanitization, image evidence, AI quality pre-screen, and personal history tracking.
   - **Municipal Officer Triage Station**: Multi-criteria search, filters, pagination, priority queue, department assignment, and validated lifecycle updates.
   - **Chief Administrator Console**: Citywide operational statistics, staff role governance (preventing client privilege escalation), and immutable audit logs.
   - **Citywide Analytics**: Live performance telemetry, resolution turnaround times, and category distributions.

5. **Auditable Status Lifecycle**
   $$\text{Submitted} \longrightarrow \text{Under Review} \longrightarrow \text{Assigned} \longrightarrow \text{In Progress} \longrightarrow \text{Resolved}$$
   *(Or $\text{Rejected}$ with mandatory documented justification).*

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript (Strict), Vite, Tailwind CSS, Lucide Icons |
| **Routing** | React Router v6 with role-protected guard boundaries |
| **Backend** | Express, Node.js, Tsx, Zod runtime schema validation |
| **AI Intelligence** | Google Gemini 1.5 Flash via `@google/genai` SDK |
| **Database & Cloud** | Cloud Firestore, Firebase Authentication, Firebase Hosting |
| **Testing** | Vitest, React Testing Library, axe-core (Accessibility) |
| **Accessibility** | WCAG 2.2 AA compliant, high-contrast focus rings, screen reader landmarks |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/civicpulse-ai.git
cd civicpulse-ai

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env
```

### Running Locally

```bash
# Start both client and server concurrently
npm run dev

# Or run separately:
npm run dev:server  # Runs Express AI server on http://localhost:3001
npm run dev:client  # Runs Vite React app on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎭 1-Click Judging Personas

The application features a built-in **Quick-Start Demo Switcher** in the top navigation bar to test all three user journeys:

| Role | Persona Name | Key Verification Scenarios |
| :--- | :--- | :--- |
| **Citizen** | John Doe | Submit new complaints, inspect AI pre-triage assistant, view personal history. |
| **Officer** | Sarah Connor | Triage priority queue, review AI recommendations, execute status transitions, merge duplicates. |
| **Administrator** | Elizabeth Stone | View aggregate telemetry, inspect immutable audit trails, govern staff roles. |

---

## 🧪 Verification & Testing Commands

CivicPulse AI includes a test suite covering unit math, state machine transitions, input sanitization, security rules, and accessibility:

```bash
# Run full automated test suite (35 tests)
npm test

# Run accessibility audit (axe-core WCAG 2.2 AA)
npm run test:a11y

# Run workflow integration tests
npm run test:e2e

# Run strict TypeScript type verification
npm run typecheck

# Build optimized production bundle
npm run build
```

---

## 📁 Repository Directory Structure

```
civicpulse-ai/
├── src/
│   ├── components/
│   │   ├── common/       # Button, Modal, Badge, Alert, SkipLink, Navbar, Footer
│   │   └── reports/      # ReportCard, ReportForm, PriorityScoreBadge, AiAnalysisCard
│   ├── lib/
│   │   ├── api.ts            # Client API caller with zero-downtime fallback
│   │   ├── authContext.tsx   # Auth provider with role enforcement & demo switching
│   │   ├── duplicateEngine.ts# Multi-factor token + geo duplicate matching
│   │   ├── firebase.ts       # Firebase client SDK initialization
│   │   ├── priorityEngine.ts # Deterministic explainable priority scoring math
│   │   ├── security.ts       # Prompt injection filter, sanitization, role guards
│   │   ├── statusLifecycle.ts# Status state machine & transition rules
│   │   └── storageService.ts # LocalStorage/Firestore persistence & demo seeder
│   ├── pages/            # Landing, CitizenDashboard, OfficerDashboard, Admin, Analytics
│   ├── types/            # Domain TypeScript interfaces
│   ├── App.tsx           # Router and role guards
│   └── main.tsx          # Application mount
├── server/
│   └── src/
│       ├── geminiService.ts  # Gemini 1.5 Flash client, Zod schema, rule fallback
│       └── server.ts         # Express server, rate limiter, CORS, payload limits
├── tests/
│   ├── accessibility/    # axe-core WCAG 2.2 AA tests
│   ├── integration/      # End-to-end workflow tests
│   ├── unit/             # Priority, Duplicate, Lifecycle, Security, AI validation tests
│   └── setup.ts          # JSDOM & matcher setup
├── firestore.rules       # Cloud Firestore security rules
├── firestore.indexes.json# Compound database query indexes
├── firebase.json         # Firebase Hosting & security headers configuration
└── package.json          # Dependency specifications and test scripts
```
