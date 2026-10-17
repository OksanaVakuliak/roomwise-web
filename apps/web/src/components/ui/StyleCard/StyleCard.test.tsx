import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { StyleCard } from './StyleCard';

const props = {
  image: <svg role="presentation" />,
  name: 'Scandinavian',
  description: 'Light wood, white walls',
  pickedLabel: 'picked',
};

describe('StyleCard', () => {
  it('renders name and description', () => {
    render(<StyleCard {...props} />);
    expect(screen.getByText('Scandinavian')).toBeInTheDocument();
    expect(screen.getByText('Light wood, white walls')).toBeInTheDocument();
  });

  it('is unpressed without a badge by default', () => {
    render(<StyleCard {...props} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('picked')).toBeNull();
  });

  it('shows pressed state and badge when selected', () => {
    render(<StyleCard {...props} selected />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('picked')).toBeInTheDocument();
  });

  it('calls onSelect on click', () => {
    const onSelect = vi.fn();
    render(<StyleCard {...props} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(<StyleCard {...props} selected />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
