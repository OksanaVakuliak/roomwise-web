import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { ResultRow } from './ResultRow';

describe('ResultRow', () => {
  it('renders position, title, note and value', () => {
    renderWithProviders(
      <ResultRow position="1.2" title="Vinyl" note="floor" value="$314" />,
    );
    for (const text of ['1.2', 'Vinyl', 'floor', '$314']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it('omits the note when absent', () => {
    const { container } = renderWithProviders(
      <ResultRow position="1.2" title="Vinyl" value="$314" />,
    );
    expect(container.querySelectorAll('span')).toHaveLength(1);
  });

  it('marks the new variant differently from the default', () => {
    const { container, rerender } = renderWithProviders(
      <ResultRow position="1" title="A" value="$1" />,
    );
    const defaultClass = (container.firstChild as HTMLElement).className;
    rerender(<ResultRow variant="new" position="1" title="A" value="$1" />);
    expect((container.firstChild as HTMLElement).className).not.toBe(
      defaultClass,
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <ResultRow variant="new" position="1" title="A" value="$1" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
