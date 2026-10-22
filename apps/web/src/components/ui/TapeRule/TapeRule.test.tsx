import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { TapeRule } from './TapeRule';

describe('TapeRule', () => {
  it('draws decorative ticks hidden from assistive tech', () => {
    const { container } = render(<TapeRule />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(container.querySelector('ol')).toBeNull();
  });

  it.each(['mobile', 'desktop', 'responsive'] as const)(
    'applies the %s size',
    (size) => {
      const { container } = render(<TapeRule size={size} />);
      expect(container.firstElementChild?.className).toContain(size);
    },
  );

  it('becomes a labelled navigation landmark with a label', () => {
    render(
      <TapeRule label="Steps">
        <li>one</li>
      </TapeRule>,
    );
    expect(screen.getByRole('navigation', { name: 'Steps' })).toBeVisible();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithProviders(
      <TapeRule label="Steps">
        <li>one</li>
      </TapeRule>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
