import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { PickedBadge } from './PickedBadge';

describe('PickedBadge', () => {
  it('renders its label', () => {
    render(<PickedBadge>picked</PickedBadge>);
    expect(screen.getByText('picked')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<PickedBadge>picked</PickedBadge>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
