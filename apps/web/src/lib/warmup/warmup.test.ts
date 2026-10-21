import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import {
  installNetworkListeners,
  resetWarmup,
  retryWarmup,
  selectWaitingScreenVisible,
  selectWarmupStatus,
  startWarmup,
  useWarmup,
  WARMUP_SCREEN_DELAY_MS,
  WARMUP_TIMEOUT_MS,
} from './warmup';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;

const up = { response: { ok: true } };
const down = { response: { ok: false } };

function status() {
  return selectWarmupStatus(useWarmup.getState());
}

function waitingScreenVisible() {
  return selectWaitingScreenVisible(useWarmup.getState(), Date.now());
}

describe('warmup', () => {
  let removeListeners: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    get.mockReset();
    resetWarmup();
    removeListeners = installNetworkListeners();
  });

  afterEach(() => {
    removeListeners();
    resetWarmup();
    vi.useRealTimers();
  });

  it('fires the health request immediately on start', () => {
    get.mockReturnValue(new Promise(() => {}));

    startWarmup();

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/api/v1/health');
    expect(status()).toBe('warming');
  });

  it('is idempotent', () => {
    get.mockReturnValue(new Promise(() => {}));

    startWarmup();
    startWarmup();

    expect(get).toHaveBeenCalledTimes(1);
  });

  it('shows the waiting screen only after the delay', async () => {
    get.mockReturnValue(new Promise(() => {}));
    startWarmup();
    const startedAt = useWarmup.getState().startedAt ?? 0;

    await vi.advanceTimersByTimeAsync(WARMUP_SCREEN_DELAY_MS - 1);
    expect(status()).toBe('warming');
    expect(waitingScreenVisible()).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(status()).toBe('warming');
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(
      WARMUP_SCREEN_DELAY_MS,
    );
    expect(waitingScreenVisible()).toBe(true);
  });

  it('becomes ready on a successful response', async () => {
    get.mockResolvedValue(up);

    startWarmup();
    await vi.advanceTimersByTimeAsync(0);

    expect(status()).toBe('ready');
    expect(waitingScreenVisible()).toBe(false);
  });

  it('retries with a growing delay capped at ten seconds', async () => {
    get.mockResolvedValue(down);

    startWarmup();
    await vi.advanceTimersByTimeAsync(0);
    expect(get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(get).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(2000);
    expect(get).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(4000);
    expect(get).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(8000);
    expect(get).toHaveBeenCalledTimes(5);

    await vi.advanceTimersByTimeAsync(10000);
    expect(get).toHaveBeenCalledTimes(6);

    await vi.advanceTimersByTimeAsync(10000);
    expect(get).toHaveBeenCalledTimes(7);
  });

  it('keeps retrying after rejected requests and recovers', async () => {
    get.mockRejectedValueOnce(new TypeError('fetch failed'));
    get.mockResolvedValueOnce(down);
    get.mockResolvedValue(up);

    startWarmup();
    await vi.advanceTimersByTimeAsync(0);
    expect(status()).toBe('warming');

    await vi.advanceTimersByTimeAsync(1000 + 2000);

    expect(status()).toBe('ready');
    expect(get).toHaveBeenCalledTimes(3);
  });

  it('fails after the timeout and not before', async () => {
    get.mockResolvedValue(down);

    startWarmup();
    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS - 1);
    expect(status()).toBe('warming');

    await vi.advanceTimersByTimeAsync(1);
    expect(status()).toBe('failed');

    const calls = get.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60000);
    expect(get).toHaveBeenCalledTimes(calls);
  });

  it('fails after the timeout even when the request never answers', async () => {
    get.mockReturnValue(new Promise(() => {}));

    startWarmup();
    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS);

    expect(status()).toBe('failed');
  });

  it('retry restarts a fresh window from failed', async () => {
    get.mockResolvedValue(down);
    startWarmup();
    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS);
    expect(status()).toBe('failed');
    get.mockClear();

    retryWarmup();

    expect(status()).toBe('warming');
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS - 1);
    expect(status()).toBe('warming');
    await vi.advanceTimersByTimeAsync(1);
    expect(status()).toBe('failed');
  });

  it('retry does nothing unless the warm-up failed', () => {
    get.mockReturnValue(new Promise(() => {}));
    startWarmup();

    retryWarmup();

    expect(get).toHaveBeenCalledTimes(1);
  });

  it('pauses requests while offline and resumes when back online', async () => {
    get.mockResolvedValue(down);
    startWarmup();
    await vi.advanceTimersByTimeAsync(0);
    get.mockClear();

    window.dispatchEvent(new Event('offline'));
    expect(useWarmup.getState().network).toBe('offline');
    expect(status()).toBe('offline');

    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS * 2);
    expect(get).not.toHaveBeenCalled();
    expect(status()).toBe('offline');

    get.mockResolvedValue(up);
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);

    expect(get).toHaveBeenCalledTimes(1);
    expect(status()).toBe('ready');
  });

  it('starts requesting only once online when started offline', async () => {
    window.dispatchEvent(new Event('offline'));
    get.mockResolvedValue(up);

    startWarmup();
    await vi.advanceTimersByTimeAsync(5000);
    expect(get).not.toHaveBeenCalled();
    expect(status()).toBe('offline');

    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);

    expect(status()).toBe('ready');
  });

  it('restarts a failed warm-up when the network returns', async () => {
    get.mockResolvedValue(down);
    startWarmup();
    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS);
    expect(status()).toBe('failed');

    window.dispatchEvent(new Event('offline'));
    get.mockResolvedValue(up);
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);

    expect(status()).toBe('ready');
  });

  it('does not start on its own before any start call', async () => {
    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);

    expect(get).not.toHaveBeenCalled();
    expect(status()).toBe('unknown');
  });

  it('ignores a response from an earlier generation', async () => {
    let finishStale: (value: unknown) => void = () => {};
    get.mockReturnValueOnce(new Promise((resolve) => (finishStale = resolve)));
    startWarmup();

    window.dispatchEvent(new Event('offline'));
    get.mockReturnValue(new Promise(() => {}));
    window.dispatchEvent(new Event('online'));
    finishStale(up);
    await vi.advanceTimersByTimeAsync(0);

    expect(status()).toBe('warming');
  });

  it('ignores a late response after the warm-up failed', async () => {
    let finishStale: (value: unknown) => void = () => {};
    get.mockReturnValueOnce(new Promise((resolve) => (finishStale = resolve)));
    startWarmup();
    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS);
    expect(status()).toBe('failed');

    finishStale(up);
    await vi.advanceTimersByTimeAsync(0);

    expect(status()).toBe('failed');
  });

  it('stays ready through offline events, restarts and retries', async () => {
    get.mockResolvedValue(up);
    startWarmup();
    await vi.advanceTimersByTimeAsync(0);
    get.mockClear();

    window.dispatchEvent(new Event('offline'));
    expect(status()).toBe('ready');
    window.dispatchEvent(new Event('online'));
    startWarmup();
    retryWarmup();
    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS);

    expect(status()).toBe('ready');
    expect(get).not.toHaveBeenCalled();
  });

  it('stops listening after cleanup', () => {
    removeListeners();

    window.dispatchEvent(new Event('offline'));

    expect(useWarmup.getState().network).toBe('online');
    removeListeners = installNetworkListeners();
  });
});
