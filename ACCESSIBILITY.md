# CivicPulse AI — Accessibility Compliance & Audit (WCAG 2.2 AA)

## 1. Accessibility Policy & Target Standard

CivicPulse AI is engineered to provide universal access for all citizens, including individuals using screen readers, keyboard-only navigation, and high-contrast display modes. The platform targets **WCAG 2.2 AA Compliance**.

---

## 2. Implemented Accessibility Features

### A. Non-Color-Alone Status Indicators (WCAG 1.4.1)
- Traditional civic portals rely solely on green/yellow/red badges to communicate urgency and status, presenting critical barriers for users with color vision deficiencies.
- In CivicPulse AI, every `StatusBadge` and `UrgencyBadge` couples color with:
  1. **Distinct SVG Iconography** (Clock for submitted, Search for under review, UserCheck for assigned, Wrench for in progress, CheckCircle for resolved, XCircle for rejected).
  2. **Explicit Text Labels** (e.g. "Status: In Progress", "Urgency: Critical Priority").
  3. **ARIA Semantic Attributes** (`role="status"`, descriptive `aria-label`).

### B. High-Contrast Focus Indicators (WCAG 2.4.7 & 2.4.11)
- Implemented in `src/index.css`:
  ```css
  *:focus-visible {
    outline: 2px solid #0284c7;
    outline-offset: 2px;
  }
  ```
- Ensures visible focus rings across buttons, inputs, links, and interactive cards for keyboard navigation.

### C. Skip Navigation Links (WCAG 2.4.1)
- The `SkipLink` component renders at the very top of the DOM:
  ```html
  <a href="#main-content" class="skip-to-content">Skip to main content</a>
  ```
- Allows screen reader and keyboard users to bypass header navigation and jump immediately to primary application content.

### D. Accessible Dialogs & Modals (WCAG 2.1.2 & 2.4.3)
- All modal dialogs (`Modal.tsx`) implement:
  - `role="dialog"` and `aria-modal="true"`.
  - `aria-labelledby="modal-title"` linking dialog title to screen reader announcements.
  - Automatic focus management (initial focus directed to close button).
  - Global `Escape` key listener enabling zero-friction keyboard dismissal.
  - Backdrop dismissal for mouse users.

### E. Respect for Reduced Motion (WCAG 2.3.3)
- Implemented global media query respecting user operating system preferences:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

### F. Semantic Heading Hierarchy & Landmarks (WCAG 1.3.1)
- Each page features exactly one `<h1>` heading followed by properly nested `<h2>`, `<h3>` sections.
- Structural landmarks utilized: `<header>`, `<nav>`, `<main id="main-content">`, `<section>`, `<article>`, and `<footer>`.

### G. Live Region Announcements (WCAG 4.1.3)
- Alerts use `role="status"` for non-urgent feedback (success messages, information updates) and `role="alert"` for form validation errors and security warnings.

---

## 3. Automated axe-core Verification

Automated accessibility testing using `axe-core` verifies that key UI primitives have **zero WCAG 2.2 AA violations**:

| Tested Component | axe-core Test Case | Violations Found | Status |
| :--- | :--- | :---: | :---: |
| `StatusBadge` & `UrgencyBadge` | Color contrast, aria roles, icon labels | **0** | **PASS** |
| `Button` | Accessible name, disabled state, aria-busy | **0** | **PASS** |
| `Alert` | Live region roles, text contrast | **0** | **PASS** |
| `SkipLink` | Focus visibility, target href validity | **0** | **PASS** |
| `PriorityScoreBadge` | Popover semantics, factor meter contrast | **0** | **PASS** |

Run the automated accessibility audit anytime via:
```bash
npm run test:a11y
```
