import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { renderWithProviders } from '@/test/render-with-providers';
import { WarmupGate } from './WarmupGate';

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

function contentWrapper() {
  return screen.getByTestId('content').parentElement as HTMLElement;
}

function renderGate() {
  return renderWithProviders(
    <WarmupGate>
      <p data-testid="content">content</p>
    </WarmupGate>,
  );
}

describe('WarmupGate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    setOnline(true);
    resetWarmup();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetWarmup();
  });

  it('shows nothing extra while the status is unknown', () => {
    renderGate();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(contentWrapper()).not.toHaveAttribute('inert');
  });

  it('waits for the delay before the waiting screen', () => {
    renderGate();
    act(() => {
      useWarmup.setState({ server: 'warming', startedAt: Date.now() });
    });
    expect(screen.queryByText('Server is waking up')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Server is waking up')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(contentWrapper()).toHaveAttribute('inert');
  });

  it('shows the waiting screen at once when the delay has already passed', () => {
    renderGate();
    act(() => {
      useWarmup.setState({ server: 'warming', startedAt: Date.now() - 5000 });
    });
    expect(screen.getByText('Server is waking up')).toBeInTheDocument();
  });

  it('shows the waiting screen at once after an earlier overlay', () => {
    renderGate();
    act(() => {
      useWarmup.setState({ server: 'failed' });
    });
    expect(screen.getByText('The server did not answer')).toBeInTheDocument();
    act(() => {
      useWarmup.setState({ server: 'warming', startedAt: Date.now() });
    });
    expect(screen.getByText('Server is waking up')).toBeInTheDocument();
    expect(contentWrapper()).toHaveAttribute('inert');
  });

  it('keeps the waiting screen when warming restarts after it was shown', () => {
    renderGate();
    act(() => {
      useWarmup.setState({ server: 'warming', startedAt: Date.now() - 5000 });
    });
    act(() => {
      useWarmup.setState({ server: 'warming', startedAt: Date.now() });
    });
    expect(screen.getByText('Server is waking up')).toBeInTheDocument();
  });

  it('shows the failure state with retry', () => {
    renderGate();
    act(() => {
      useWarmup.setState({ server: 'failed' });
    });
    expect(screen.getByText('The server did not answer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('shows the offline state instead of the error', () => {
    renderGate();
    act(() => {
      useWarmup.setState({ server: 'failed', network: 'offline' });
    });
    expect(screen.getByText('No internet connection')).toBeInTheDocument();
    expect(
      screen.queryByText('The server did not answer'),
    ).not.toBeInTheDocument();
  });

  it('releases the content when the server is ready', () => {
    renderGate();
    act(() => {
      useWarmup.setState({ server: 'failed' });
    });
    act(() => {
      useWarmup.setState({ server: 'ready' });
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(contentWrapper()).not.toHaveAttribute('inert');
  });
});
