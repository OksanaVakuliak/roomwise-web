import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { ApiRequestError } from './request-error';
import { createWriteGate, RateLimitedError } from './write';

const ok = (data: unknown) => ({ data, response: { status: 201 } });
const failure = (status: number, error: unknown) => ({
  error,
  response: { status },
});
const limited = (retryAfterSeconds: unknown) =>
  failure(429, {
    error: { code: 'RATE_LIMITED', params: { retryAfterSeconds } },
  });

beforeEach(() => {
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

describe('createWriteGate', () => {
  it('starts warmup when it has not started yet', async () => {
    resetWarmup();
    const send = vi.fn().mockResolvedValue(ok({ id: 1 }));
    const pending = createWriteGate().write(send, 'key-1');

    expect(useWarmup.getState().server).not.toBe('unknown');
    act(() => useWarmup.setState({ server: 'ready' }));
    await expect(pending).resolves.toEqual({ id: 1 });
  });

  it('passes the idempotency key to the sender and returns data', async () => {
    const send = vi.fn().mockResolvedValue(ok({ id: 1 }));
    await expect(createWriteGate().write(send, 'key-1')).resolves.toEqual({
      id: 1,
    });
    expect(send).toHaveBeenCalledExactlyOnceWith('key-1');
  });

  it('waits for warmup to become ready without calling the sender', async () => {
    useWarmup.setState({ server: 'warming' });
    const send = vi.fn().mockResolvedValue(ok('done'));
    const pending = createWriteGate().write(send, 'key-1');
    await Promise.resolve();
    expect(send).not.toHaveBeenCalled();
    act(() => useWarmup.setState({ server: 'ready' }));
    await expect(pending).resolves.toBe('done');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('rejects with a network error when warmup fails', async () => {
    useWarmup.setState({ server: 'warming' });
    const send = vi.fn();
    const pending = createWriteGate().write(send, 'key-1');
    act(() => useWarmup.setState({ server: 'failed' }));
    await expect(pending).rejects.toMatchObject({
      apiError: { code: 'network' },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('retries a network error once with the same key', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(ok('saved'));
    await expect(createWriteGate().write(send, 'key-1')).resolves.toBe('saved');
    expect(send.mock.calls).toEqual([['key-1'], ['key-1']]);
  });

  it('gives up after the second network error', async () => {
    const send = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(createWriteGate().write(send, 'key-1')).rejects.toMatchObject({
      status: 0,
      apiError: { code: 'network' },
    });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('does not retry an API error', async () => {
    const send = vi
      .fn()
      .mockResolvedValue(
        failure(422, { error: { code: 'UNKNOWN_REFERENCE' } }),
      );
    const error = await createWriteGate()
      .write(send, 'key-1')
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 422,
      apiError: { code: 'UNKNOWN_REFERENCE' },
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('exposes retryAfterSeconds on 429 and blocks until it expires', async () => {
    let time = 1_000_000;
    const gate = createWriteGate(() => time);
    const send = vi.fn().mockResolvedValueOnce(limited(30));
    const error = await gate
      .write(send, 'key-1')
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(RateLimitedError);
    expect(error).toMatchObject({ retryAfterSeconds: 30 });
    expect(gate.blockedForSeconds()).toBe(30);

    time += 10_000;
    await expect(gate.write(send, 'key-1')).rejects.toMatchObject({
      retryAfterSeconds: 20,
    });
    expect(send).toHaveBeenCalledTimes(1);

    time += 20_000;
    expect(gate.blockedForSeconds()).toBe(0);
    send.mockResolvedValueOnce(ok('saved'));
    await expect(gate.write(send, 'key-1')).resolves.toBe('saved');
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('falls back to a default delay when retryAfterSeconds is missing', async () => {
    const gate = createWriteGate();
    const send = vi.fn().mockResolvedValue(limited(undefined));
    await expect(gate.write(send, 'key-1')).rejects.toMatchObject({
      retryAfterSeconds: 60,
    });
  });
});
