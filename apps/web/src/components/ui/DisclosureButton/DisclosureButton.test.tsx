import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { DisclosureButton } from './DisclosureButton';

describe('DisclosureButton', () => {
  it('reflects the expanded state and points at the region', () => {
    const { rerender } = render(
      <DisclosureButton expanded={false} controls="details" label="Show" />,
    );
    const button = screen.getByRole('button', { name: 'Show' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'details');
    rerender(<DisclosureButton expanded controls="details" label="Hide" />);
    expect(screen.getByRole('button', { name: 'Hide' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('calls onClick', () => {
    const onClick = vi.fn();
    render(
      <DisclosureButton
        expanded={false}
        controls="details"
        label="Show"
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <DisclosureButton expanded controls="details" label="Hide" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
