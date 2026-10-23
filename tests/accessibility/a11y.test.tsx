import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { BrowserRouter } from 'react-router-dom';
import { StatusBadge, UrgencyBadge } from '../../src/components/common/Badge';
import { Button } from '../../src/components/common/Button';
import { Alert } from '../../src/components/common/Alert';
import { SkipLink } from '../../src/components/common/SkipLink';
import { PriorityScoreBadge } from '../../src/components/reports/PriorityScoreBadge';

describe('WCAG 2.2 AA Accessibility Automated Audit', () => {
  it('Badge components have accessible roles and no axe violations', async () => {
    const { container } = render(
      <div>
        <StatusBadge status="submitted" />
        <StatusBadge status="under_review" />
        <StatusBadge status="assigned" />
        <StatusBadge status="in_progress" />
        <StatusBadge status="resolved" />
        <StatusBadge status="rejected" />
        <UrgencyBadge urgency="low" />
        <UrgencyBadge urgency="medium" />
        <UrgencyBadge urgency="high" />
        <UrgencyBadge urgency="critical" />
      </div>
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('Button component provides visible text and no axe violations', async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Submit Complaint</Button>
        <Button variant="outline" isLoading loadingText="Saving...">
          Submit
        </Button>
        <Button variant="danger">Cancel</Button>
      </div>
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('Alert components have appropriate roles and pass axe checks', async () => {
    const { container } = render(
      <div>
        <Alert type="info" title="Information Notice">
          Scheduled maintenance tonight.
        </Alert>
        <Alert type="warning" title="Triage Alert">
          Potential duplicate detected.
        </Alert>
        <Alert type="error" title="Validation Failure">
          Please fill required fields.
        </Alert>
      </div>
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('SkipLink component is keyboard accessible and passes axe checks', async () => {
    const { container } = render(<SkipLink />);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('PriorityScoreBadge satisfies accessibility and role requirements', async () => {
    const priority = {
      score: 75,
      level: 'high' as const,
      breakdown: { safetyImpact: 25, relatedCount: 14, timeUnresolved: 10, reportedSeverity: 16, evidenceCompleteness: 10 },
      explanation: 'Test factor calculation',
      calculatedAt: new Date().toISOString(),
    };

    const { container } = render(<PriorityScoreBadge priorityScore={priority} />);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
