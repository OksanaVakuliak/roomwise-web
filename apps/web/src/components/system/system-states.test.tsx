import { act, fireEvent, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { type ChangeEvent, type ReactNode, useCallback, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import {
  resetWarmup,
  useWarmup,
  useWarmupStart,
  WARMUP_TIMEOUT_MS,
} from '@/lib/warmup';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import en from '../../../messages/en.json';
import uk from '../../../messages/uk.json';
import { ErrorState } from './ErrorState/ErrorState';
import { WarmupGate } from './WarmupGate/WarmupGate';
import { ZoneEmpty } from './ZoneEmpty/ZoneEmpty';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const get = vi.mocked(api.GET);

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

function hang() {
  get.mockImplementation(() => new Promise(() => {}));
}

function answer(ok: boolean) {
  get.mockResolvedValue({ response: { ok } } as never);
}

function Draft() {
  const [value, setValue] = useState('');
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value),
    [],
  );
  return <input aria-label="Room name" value={value} onChange={onChange} />;
}

function App({ children = <Draft /> }: { children?: ReactNode }) {
  useWarmupStart();
  return <WarmupGate>{children}</WarmupGate>;
}

function noop() {}

function DataFailure() {
  return <ErrorState onRetry={noop} />;
}

function EmptyList() {
  const items: string[] = [];
  return items.length === 0 ? <ZoneEmpty kind="rooms" /> : null;
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function goOffline() {
  setOnline(false);
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
}

describe('system states', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setOnline(true);
    get.mockReset();
    resetWarmup();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetWarmup();
  });

  it('shows the waiting screen only after two seconds', async () => {
    hang();
    renderWithProviders(<App />);
    await advance(1900);
    expect(screen.queryByText('Server is waking up')).not.toBeInTheDocument();
    await advance(200);
    expect(screen.getByText('Server is waking up')).toBeInTheDocument();
  });

  it('hides the waiting screen when the server answers and keeps typed data', async () => {
    answer(false);
    renderWithProviders(<App />);
    const input = screen.getByLabelText('Room name');
    fireEvent.change(input, { target: { value: 'Kitchen' } });
    await advance(2500);
    expect(screen.getByText('Server is waking up')).toBeInTheDocument();
    answer(true);
    await advance(10000);
    expect(screen.queryByText('Server is waking up')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Room name')).toBe(input);
    expect(input).toHaveValue('Kitchen');
  });

  it('shows the failure after the timeout, keeps data and retries', async () => {
    answer(false);
    renderWithProviders(<App />);
    fireEvent.change(screen.getByLabelText('Room name'), {
      target: { value: 'Kitchen' },
    });
    await advance(WARMUP_TIMEOUT_MS + 100);
    expect(screen.getByText('The server did not answer')).toBeInTheDocument();
    expect(screen.getByLabelText('Room name')).toHaveValue('Kitchen');
    const calls = get.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await advance(10);
    expect(get.mock.calls.length).toBeGreaterThan(calls);
    expect(useWarmup.getState().server).toBe('warming');
  });

  it('shows a separate offline view and resumes when back online', async () => {
    hang();
    renderWithProviders(<App />);
    await advance(100);
    const calls = get.mock.calls.length;
    goOffline();
    expect(screen.getByText('No internet connection')).toBeInTheDocument();
    expect(
      screen.queryByText('The server did not answer'),
    ).not.toBeInTheDocument();
    setOnline(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    await advance(10);
    expect(
      screen.queryByText('No internet connection'),
    ).not.toBeInTheDocument();
    expect(get.mock.calls.length).toBeGreaterThan(calls);
  });

  it('shows the empty state for an empty list', () => {
    renderWithProviders(<EmptyList />);
    expect(
      screen.getByRole('heading', { name: en.ZoneStates.empty.rooms.title }),
    ).toBeInTheDocument();
  });

  it('translates the waiting screen when the language changes', async () => {
    hang();
    const { rerender } = renderWithProviders(<App />);
    await advance(2500);
    expect(screen.getByText(en.SystemStates.warmupTitle)).toBeInTheDocument();
    rerender(
      <NextIntlClientProvider locale="uk" messages={uk}>
        <App />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(uk.SystemStates.warmupTitle)).toBeInTheDocument();
  });

  it('shows a data error without bringing the waiting screen back', async () => {
    answer(true);
    renderWithProviders(
      <App>
        <DataFailure />
      </App>,
    );
    await advance(3000);
    expect(screen.getByText(en.SystemStates.errorTitle)).toBeInTheDocument();
    expect(screen.queryByText('Server is waking up')).not.toBeInTheDocument();
    expect(useWarmup.getState().server).toBe('ready');
  });

  describe('accessibility', () => {
    it('has no violations while waiting', async () => {
      hang();
      const { container } = renderWithProviders(<App />);
      await advance(2500);
      vi.useRealTimers();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations on failure', async () => {
      answer(false);
      const { container } = renderWithProviders(<App />);
      await advance(WARMUP_TIMEOUT_MS + 100);
      vi.useRealTimers();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations offline', async () => {
      hang();
      const { container } = renderWithProviders(<App />);
      goOffline();
      vi.useRealTimers();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
