import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { EstimateStamp, type EstimateStampProps } from './EstimateStamp';

const parts = [
  { key: 'base', label: 'Base', value: '$6,844', share: 60 },
  { key: 'materials', label: 'Materials', value: '$4,912', share: 30 },
  { key: 'engineering', label: 'Engineering', value: '$1,260', share: 8 },
  { key: 'options', label: 'Options', value: '$340', share: 2 },
];

function stamp(props: Partial<EstimateStampProps> = {}) {
  return (
    <EstimateStamp
      totalLabel="Total"
      total="$13,356"
      parts={parts}
      barLabel="Split"
      toggleLabel="Show breakdown"
      announcement="Total changed"
      actions={<button type="button">Next</button>}
      {...props}
    />
  );
}

describe('EstimateStamp', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the total, every part and the actions', () => {
    renderWithProviders(stamp());
    expect(screen.getByText('$13,356')).toBeInTheDocument();
    for (const part of parts) {
      expect(screen.getByText(part.label)).toBeInTheDocument();
      expect(screen.getByText(part.value)).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Split' })).toBeInTheDocument();
  });

  it('starts collapsed and expands through a labelled disclosure', () => {
    const { container } = renderWithProviders(stamp());
    const toggle = screen.getByRole('button', { name: 'Show breakdown' });
    const panel = container.querySelector('dl') as HTMLElement;
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', panel.id);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('can start expanded', () => {
    renderWithProviders(stamp({ defaultExpanded: true }));
    expect(
      screen.getByRole('button', { name: 'Show breakdown' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('stays silent on first render and announces a changed total', () => {
    const { rerender } = renderWithProviders(stamp());
    expect(screen.getByRole('status')).toHaveTextContent('');
    rerender(stamp());
    expect(screen.getByRole('status')).toHaveTextContent('');
    vi.useFakeTimers();
    rerender(stamp({ total: '$13,500' }));
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByRole('status')).toHaveTextContent('Total changed');
  });

  it('announces a fixed message again on every change', () => {
    vi.useFakeTimers();
    const { rerender } = renderWithProviders(stamp());
    const status = screen.getByRole('status');
    rerender(stamp({ total: '$1' }));
    expect(status).toHaveTextContent('');
    act(() => {
      vi.runAllTimers();
    });
    expect(status).toHaveTextContent('Total changed');
    rerender(stamp({ total: '$2' }));
    expect(status).toHaveTextContent('');
    act(() => {
      vi.runAllTimers();
    });
    expect(status).toHaveTextContent('Total changed');
  });

  it('falls back to the total when no announcement is given', () => {
    const { rerender } = renderWithProviders(
      stamp({ announcement: undefined }),
    );
    vi.useFakeTimers();
    rerender(stamp({ announcement: undefined, total: '$1' }));
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByRole('status')).toHaveTextContent('$1');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(stamp());
    expect(await axe(container)).toHaveNoViolations();
  });
});
