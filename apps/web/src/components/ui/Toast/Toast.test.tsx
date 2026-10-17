import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { Toast } from './Toast';

const noop = () => {};

afterEach(() => {
  vi.useRealTimers();
});

describe('Toast', () => {
  it('is a polite status region by default', async () => {
    renderWithProviders(
      <Toast dismissLabel="Dismiss" onDismiss={noop}>
        Saved
      </Toast>,
    );
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });

  it('is an alert for the error variant', async () => {
    renderWithProviders(
      <Toast variant="error" dismissLabel="Dismiss" onDismiss={noop}>
        Failed
      </Toast>,
    );
    expect(await screen.findByText('Failed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  it('does not steal focus', () => {
    renderWithProviders(
      <>
        <button type="button">Other</button>
        <Toast dismissLabel="Dismiss" onDismiss={noop}>
          Saved
        </Toast>
      </>,
    );
    screen.getByRole('button', { name: 'Other' }).focus();
    expect(screen.getByRole('button', { name: 'Other' })).toHaveFocus();
  });

  it('dismisses from the button', () => {
    const onDismiss = vi.fn();
    renderWithProviders(
      <Toast dismissLabel="Dismiss" onDismiss={onDismiss}>
        Saved
      </Toast>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses itself after the duration', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    renderWithProviders(
      <Toast dismissLabel="Dismiss" onDismiss={onDismiss} duration={3000}>
        Saved
      </Toast>,
    );
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stays without a duration', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    renderWithProviders(
      <Toast dismissLabel="Dismiss" onDismiss={onDismiss}>
        Saved
      </Toast>,
    );
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <Toast variant="success" dismissLabel="Dismiss" onDismiss={noop}>
        Saved
      </Toast>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
