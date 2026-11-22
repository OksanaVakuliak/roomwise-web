import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { StatusBadge, type StatusBadgeStatus } from './StatusBadge';

const STATUSES: StatusBadgeStatus[] = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
  'NEW',
  'IN_PROGRESS',
  'DONE',
  'REJECTED',
  'SPAM',
];

describe('StatusBadge', () => {
  it.each(STATUSES)('shows the label text for %s', (status) => {
    render(<StatusBadge status={status} label={`label ${status}`} />);
    expect(screen.getByText(`label ${status}`)).toBeInTheDocument();
  });

  it('exposes the status as a data attribute', () => {
    render(<StatusBadge status="IN_PROGRESS" label="In progress" />);
    expect(screen.getByText('In progress')).toHaveAttribute(
      'data-status',
      'IN_PROGRESS',
    );
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        {STATUSES.map((status) => (
          <StatusBadge key={status} status={status} label={status} />
        ))}
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
