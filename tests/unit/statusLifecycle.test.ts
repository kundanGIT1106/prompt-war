import { describe, it, expect } from 'vitest';
import { validateStatusTransition } from '../../src/lib/statusLifecycle';

describe('Status Lifecycle State Machine', () => {
  it('allows valid officer transition from submitted to under_review', () => {
    const result = validateStatusTransition('submitted', 'under_review', 'officer');
    expect(result.valid).toBe(true);
  });

  it('allows valid officer transition from under_review to assigned with department', () => {
    const result = validateStatusTransition('under_review', 'assigned', 'officer', {
      assignedDepartment: 'Department of Transportation',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects assignment if assignedDepartment is omitted', () => {
    const result = validateStatusTransition('under_review', 'assigned', 'officer', {
      assignedDepartment: '',
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Assignment requires specifying');
  });

  it('rejects illegal jump from submitted directly to resolved', () => {
    const result = validateStatusTransition('submitted', 'resolved', 'officer');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Illegal status transition');
  });

  it('enforces mandatory resolution notes of at least 15 chars', () => {
    const shortNotes = validateStatusTransition('in_progress', 'resolved', 'officer', {
      resolutionNotes: 'fixed it',
    });
    expect(shortNotes.valid).toBe(false);
    expect(shortNotes.error).toContain('at least 15 characters');

    const validNotes = validateStatusTransition('in_progress', 'resolved', 'officer', {
      resolutionNotes: 'Asphalt cold patch complete and inspected by municipal team.',
    });
    expect(validNotes.valid).toBe(true);
  });

  it('enforces mandatory rejected justification of at least 10 chars', () => {
    const shortRejection = validateStatusTransition('submitted', 'rejected', 'officer', {
      rejectedReason: 'no',
    });
    expect(shortRejection.valid).toBe(false);
    expect(shortRejection.error).toContain('at least 10 characters');

    const validRejection = validateStatusTransition('submitted', 'rejected', 'officer', {
      rejectedReason: 'Outside municipal jurisdiction boundaries (private road).',
    });
    expect(validRejection.valid).toBe(true);
  });

  it('strictly rejects status changes attempted by citizen role', () => {
    const result = validateStatusTransition('submitted', 'resolved', 'citizen');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Citizens are not authorized');
  });
});
