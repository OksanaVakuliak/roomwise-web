import { act, fireEvent, screen, within } from '@testing-library/react';
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

const detailedParts = [
  {
    ...parts[0],
    detailsLabel: 'Base breakdown',
    details: [
      { key: 'floor', label: 'Floor', value: '$3,000' },
      { key: 'walls', label: 'Walls', value: '$2,844' },
      { key: 'ceiling', label: 'Ceiling', value: '$1,000' },
    ],
  },
  {
    ...parts[1],
    detailsLabel: 'Materials breakdown',
    details: [{ key: 'paint', label: 'Paint', value: '$900' }],
  },
  parts[2],
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

  it('shows the note under the total only when it is given', () => {
    const { rerender } = renderWithProviders(stamp());
    expect(screen.queryByText('NBU rate')).not.toBeInTheDocument();
    rerender(stamp({ note: 'NBU rate' }));
    expect(screen.getByText('NBU rate')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(stamp());
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('part details', () => {
    it('renders a collapsed disclosure button named after the part', () => {
      const { container } = renderWithProviders(
        stamp({ parts: detailedParts }),
      );
      const button = screen.getByRole('button', { name: 'Base' });
      const breakdown = container.querySelector(
        `[id="${button.getAttribute('aria-controls')}"]`,
      );
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(breakdown).toBeInstanceOf(HTMLElement);
      expect(breakdown).not.toBeVisible();
    });

    it('toggles on click', () => {
      renderWithProviders(stamp({ parts: detailedParts }));
      const button = screen.getByRole('button', { name: 'Base' });
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('is a native button so Enter and Space activate it', () => {
      renderWithProviders(stamp({ parts: detailedParts }));
      const button = screen.getByRole('button', { name: 'Base' });
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('points aria-controls at a labelled breakdown with labels and values', () => {
      const { container } = renderWithProviders(
        stamp({ parts: detailedParts }),
      );
      const button = screen.getByRole('button', { name: 'Base' });
      fireEvent.click(button);
      const breakdown = container.querySelector(
        `[id="${button.getAttribute('aria-controls')}"]`,
      ) as HTMLElement;
      expect(breakdown).toBeVisible();
      const list = within(breakdown).getByLabelText('Base breakdown');
      expect(list.tagName).toBe('DL');
      expect(within(list).getByText('Floor')).toBeInTheDocument();
      expect(within(list).getByText('$3,000')).toBeInTheDocument();
      expect(within(list).getByText('Ceiling')).toBeInTheDocument();
      expect(within(list).getByText('$1,000')).toBeInTheDocument();
    });

    it('toggles each part independently', () => {
      renderWithProviders(stamp({ parts: detailedParts }));
      const base = screen.getByRole('button', { name: 'Base' });
      const materials = screen.getByRole('button', { name: 'Materials' });
      expect(base.getAttribute('aria-controls')).not.toBe(
        materials.getAttribute('aria-controls'),
      );
      fireEvent.click(base);
      expect(base).toHaveAttribute('aria-expanded', 'true');
      expect(materials).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(materials);
      fireEvent.click(base);
      expect(base).toHaveAttribute('aria-expanded', 'false');
      expect(materials).toHaveAttribute('aria-expanded', 'true');
    });

    it('renders no button for parts without details', () => {
      renderWithProviders(
        stamp({
          parts: [
            ...detailedParts,
            {
              key: 'empty',
              label: 'Empty',
              value: '$0',
              share: 0,
              details: [],
            },
          ],
        }),
      );
      expect(screen.queryByRole('button', { name: 'Engineering' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Empty' })).toBeNull();
    });

    it('has no axe violations collapsed or expanded', async () => {
      const { container } = renderWithProviders(
        stamp({ parts: detailedParts }),
      );
      expect(await axe(container)).toHaveNoViolations();
      fireEvent.click(screen.getByRole('button', { name: 'Base' }));
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
