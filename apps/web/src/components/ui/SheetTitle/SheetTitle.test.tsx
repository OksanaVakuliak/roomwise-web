import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { SheetTitle } from './SheetTitle';

describe('SheetTitle', () => {
  it('renders an h1 by default with the meta line', () => {
    renderWithProviders(
      <SheetTitle
        title="Bedroom"
        primary="15.1 m²"
        secondary="walls 42.1 m²"
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Bedroom' }),
    ).toBeInTheDocument();
    expect(screen.getByText('15.1 m²').tagName).toBe('B');
    expect(screen.getByText('15.1 m²').parentElement).toHaveTextContent(
      '15.1 m²walls 42.1 m²',
    );
  });

  it('uses the requested heading level', () => {
    renderWithProviders(
      <SheetTitle title="Bedroom" primary="15.1 m²" headingLevel={4} />,
    );
    expect(
      screen.getByRole('heading', { level: 4, name: 'Bedroom' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it.each(['mobile', 'desktop'] as const)('applies the %s size', (size) => {
    const { container } = renderWithProviders(
      <SheetTitle title="Bedroom" primary="15.1 m²" size={size} />,
    );
    expect((container.firstChild as HTMLElement).className).toMatch(
      new RegExp(size),
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <SheetTitle
        title="Bedroom"
        primary="15.1 m²"
        secondary="walls 42.1 m²"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
