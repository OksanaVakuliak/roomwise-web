import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { CostBar } from './CostBar';

describe('CostBar', () => {
  it('renders label and value as text', () => {
    renderWithProviders(<CostBar label="Base" share={50} value="$6,844" />);
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('$6,844')).toBeInTheDocument();
  });

  it('sets the share as a custom property and hides the track', () => {
    const { container } = renderWithProviders(
      <CostBar label="Base" share={71.8} value="$1" />,
    );
    const fill = container.querySelector('i') as HTMLElement;
    expect(fill.style.getPropertyValue('--share')).toBe('71.8%');
    expect(fill.parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <CostBar label="Base" share={50} value="$6,844" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
