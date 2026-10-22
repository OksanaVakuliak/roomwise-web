import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { TapeStep } from './TapeStep';

function renderInList(ui: React.ReactElement) {
  return renderWithProviders(<ol>{ui}</ol>);
}

describe('TapeStep', () => {
  it('marks only the current step with aria-current', () => {
    renderInList(
      <>
        <TapeStep
          number="A1"
          state="done"
          stateLabel="done"
          onClick={vi.fn()}
        />
        <TapeStep
          number="A2"
          state="now"
          stateLabel="current"
          onClick={vi.fn()}
        />
        <TapeStep number="A3" state="later" stateLabel="upcoming" />
      </>,
    );
    expect(screen.getByRole('button', { name: 'A2 current' })).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(screen.getByRole('button', { name: 'A1 done' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('includes number, label and state in the accessible name', () => {
    renderInList(
      <TapeStep
        number="A3"
        label="Interior"
        state="done"
        stateLabel="done"
        onClick={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'A3 Interior done' }),
    ).toBeInTheDocument();
  });

  it('keeps the name without a visible label', () => {
    renderInList(
      <TapeStep number="A4" state="done" stateLabel="done" onClick={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'A4 done' })).toBeInTheDocument();
  });

  it('is a native button, focusable and activated by click', () => {
    const onClick = vi.fn();
    renderInList(
      <TapeStep number="A1" state="done" stateLabel="done" onClick={onClick} />,
    );
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('tabindex', '-1');
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a link when href is given', () => {
    renderInList(
      <TapeStep number="A1" state="done" stateLabel="done" href="/step-1" />,
    );
    expect(screen.getByRole('link', { name: 'A1 done' })).toHaveAttribute(
      'href',
      '/step-1',
    );
  });

  it('keeps later steps non-interactive', () => {
    const onClick = vi.fn();
    renderInList(
      <TapeStep
        number="A5"
        state="later"
        stateLabel="upcoming"
        onClick={onClick}
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    fireEvent.click(screen.getByText('A5'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows the pointer only on the current step', () => {
    const { container } = render(
      <ol>
        <TapeStep number="A1" state="now" stateLabel="current" />
        <TapeStep number="A2" state="done" stateLabel="done" />
      </ol>,
    );
    expect(container.querySelectorAll('li svg')).toHaveLength(1);
    expect(container.querySelector('li:first-child svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('keeps labels of non-current responsive steps in the DOM', () => {
    renderInList(
      <>
        <TapeStep
          size="responsive"
          number="A1"
          state="now"
          stateLabel="current"
          label="Room"
        />
        <TapeStep
          size="responsive"
          number="A2"
          state="later"
          stateLabel="upcoming"
          label="Walls"
        />
      </>,
    );
    expect(screen.getByText('Room')).toBeInTheDocument();
    expect(screen.getByText('Walls')).toBeInTheDocument();
  });

  it('has no accessibility violations in any state', async () => {
    const { container } = renderInList(
      <>
        <TapeStep
          number="A1"
          state="done"
          stateLabel="done"
          onClick={vi.fn()}
        />
        <TapeStep
          number="A2"
          label="Style"
          state="now"
          size="desktop"
          stateLabel="current"
          href="/a2"
        />
        <TapeStep
          number="A3"
          label="Plan"
          state="later"
          stateLabel="upcoming"
        />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
