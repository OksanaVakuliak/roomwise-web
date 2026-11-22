import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { FilterBar } from './FilterBar';

const noop = () => {};

describe('FilterBar', () => {
  it('renders the filters', () => {
    render(
      <FilterBar toggleLabel="Filters" resetLabel="Reset">
        <button type="button">Status</button>
      </FilterBar>,
    );
    expect(
      screen.getByRole('button', { name: 'Status', hidden: true }),
    ).toBeInTheDocument();
  });

  it('toggles the filter row from the disclosure button', () => {
    render(
      <FilterBar toggleLabel="Filters" resetLabel="Reset">
        <button type="button">Status</button>
      </FilterBar>,
    );
    const toggle = screen.getByRole('button', { name: 'Filters' });
    const panel = document.getElementById(
      toggle.getAttribute('aria-controls') ?? '',
    );
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel).not.toHaveAttribute('data-open');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel).toHaveAttribute('data-open');
  });

  it('shows the reset button only with a handler and calls it', () => {
    const onReset = vi.fn();
    const { rerender } = render(
      <FilterBar toggleLabel="Filters" resetLabel="Reset">
        <span>x</span>
      </FilterBar>,
    );
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull();
    rerender(
      <FilterBar toggleLabel="Filters" resetLabel="Reset" onReset={onReset}>
        <span>x</span>
      </FilterBar>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <FilterBar toggleLabel="Filters" resetLabel="Reset" onReset={noop}>
        <button type="button">Status</button>
      </FilterBar>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
