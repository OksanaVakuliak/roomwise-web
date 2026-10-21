import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import {
  installNetworkListeners,
  resetWarmup,
  retryWarmup,
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

  it('stays warming through the screen delay', async () => {
    get.mockReturnValue(new Promise(() => {}));
    startWarmup();
    const startedAt = useWarmup.getState().startedAt ?? 0;

    await vi.advanceTimersByTimeAsync(WARMUP_SCREEN_DELAY_MS - 1);
    expect(status()).toBe('warming');
    expect(Date.now() - startedAt).toBeLessThan(WARMUP_SCREEN_DELAY_MS);

    await vi.advanceTimersByTimeAsync(1);
    expect(status()).toBe('warming');
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(
      WARMUP_SCREEN_DELAY_MS,
    );
  });

  it('becomes ready on a successful response', async () => {
    get.mockResolvedValue(up);

    startWarmup();
    await vi.advanceTimersByTimeAsync(0);

    expect(status()).toBe('ready');
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

    void retryWarmup();

    expect(status()).toBe('warming');
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS - 1);
    expect(status()).toBe('warming');
    await vi.advanceTimersByTimeAsync(1);
    expect(status()).toBe('failed');
  });

  it('retry does nothing while warming online', () => {
    get.mockReturnValue(new Promise(() => {}));
    startWarmup();

    void retryWarmup();

    expect(get).toHaveBeenCalledTimes(1);
  });

  it('retry while offline becomes ready when the server answers', async () => {
    window.dispatchEvent(new Event('offline'));
    startWarmup();
    get.mockResolvedValue(up);

    await retryWarmup();

    expect(get).toHaveBeenCalledTimes(1);
    expect(useWarmup.getState().network).toBe('online');
    expect(status()).toBe('ready');
  });

  it('retry while offline stays offline when the server fails', async () => {
    window.dispatchEvent(new Event('offline'));
    startWarmup();
    get.mockResolvedValue(down);

    await retryWarmup();

    expect(get).toHaveBeenCalledTimes(1);
    expect(status()).toBe('offline');
  });

  it('retry while offline ignores a probe from an earlier generation', async () => {
    window.dispatchEvent(new Event('offline'));
    startWarmup();
    let finish: (value: unknown) => void = () => {};
    get.mockReturnValue(new Promise((resolve) => (finish = resolve)));

    const pending = retryWarmup();
    resetWarmup();
    finish(up);
    await pending;

    expect(status()).toBe('unknown');
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
    void retryWarmup();
    await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS);

    expect(status()).toBe('ready');
    expect(get).not.toHaveBeenCalled();
  });

  it('always starts online and syncs from the browser after mount', () => {
    const onLine = vi
      .spyOn(window.navigator, 'onLine', 'get')
      .mockReturnValue(false);
    removeListeners();

    resetWarmup();
    expect(useWarmup.getState().network).toBe('online');

    removeListeners = installNetworkListeners();
    expect(useWarmup.getState().network).toBe('offline');
    onLine.mockRestore();
  });

  it('treats an unknown connection state as online', () => {
    const onLine = vi
      .spyOn(window.navigator, 'onLine', 'get')
      .mockReturnValue(undefined as unknown as boolean);
    removeListeners();

    resetWarmup();
    removeListeners = installNetworkListeners();

    expect(useWarmup.getState().network).toBe('online');
    onLine.mockRestore();
  });

  it('stops listening after cleanup', () => {
    removeListeners();

    window.dispatchEvent(new Event('offline'));

    expect(useWarmup.getState().network).toBe('online');
    removeListeners = installNetworkListeners();
  });
});
