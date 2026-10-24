import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { RevisionMark } from './RevisionMark';

describe('RevisionMark', () => {
  it('shows the number', () => {
    render(<RevisionMark number={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('keeps the number out of the accessibility tree and exposes the label', () => {
    render(<RevisionMark number={1} label="Revision 1" />);
    expect(screen.getByText('1')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Revision 1')).toBeInTheDocument();
  });

  it('renders both sizes', () => {
    const { container, rerender } = render(<RevisionMark number={1} />);
    const mobile = container.firstElementChild?.className;
    rerender(<RevisionMark number={1} size="desktop" />);
    expect(container.firstElementChild?.className).not.toBe(mobile);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <RevisionMark number={1} label="Revision 1" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
