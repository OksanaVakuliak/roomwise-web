import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title, text and action', () => {
    render(
      <EmptyState
        icon="plus"
        title="No rooms yet"
        text="Add the first room."
        action={<button type="button">Add room</button>}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'No rooms yet' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Add the first room.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add room' }),
    ).toBeInTheDocument();
  });

  it('uses the requested heading level', () => {
    render(<EmptyState title="Nothing" headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('omits icon, text and action when not given', () => {
    const { container } = render(<EmptyState title="Nothing" />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('p')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <EmptyState
        icon="info"
        title="No rooms yet"
        text="Add the first room."
        action={<button type="button">Add room</button>}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
