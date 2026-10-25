import { selectWarmupStatus, useWarmup } from '@/lib/warmup';
import { ApiRequestError } from './request-error';

export const DEFAULT_RETRY_AFTER_SECONDS = 60;

type WriteResult<T> = {
  data?: T;
  error?: unknown;
  response: { status: number };
};

export type WriteSender<T> = (
  idempotencyKey: string,
) => Promise<WriteResult<T>>;

export class RateLimitedError extends ApiRequestError {
  readonly retryAfterSeconds: number;

  constructor(error: ApiRequestError) {
    super(error.status, { error: error.apiError });
    this.name = 'RateLimitedError';
    const seconds = error.apiError.params?.retryAfterSeconds;
    this.retryAfterSeconds =
      typeof seconds === 'number' && seconds > 0
        ? Math.ceil(seconds)
        : DEFAULT_RETRY_AFTER_SECONDS;
  }
}

const networkFailure = () =>
  new ApiRequestError(0, { error: { code: 'network' } });

function waitUntilReady(): Promise<void> {
  const settle = (resolve: () => void, reject: (reason: Error) => void) => {
    const status = selectWarmupStatus(useWarmup.getState());
    if (status === 'ready') {
      resolve();
      return true;
    }
    if (status === 'failed' || status === 'offline') {
      reject(networkFailure());
      return true;
    }
    return false;
  };
  return new Promise((resolve, reject) => {
    if (settle(resolve, reject)) {
      return;
    }
    const unsubscribe = useWarmup.subscribe(() => {
      if (settle(resolve, reject)) {
        unsubscribe();
      }
    });
  });
}

async function attempt<T>(
  send: WriteSender<T>,
  idempotencyKey: string,
): Promise<WriteResult<T>> {
  await waitUntilReady();
  try {
    return await send(idempotencyKey);
  } catch {
    throw networkFailure();
  }
}

async function sendWithRetry<T>(
  send: WriteSender<T>,
  idempotencyKey: string,
): Promise<WriteResult<T>> {
  try {
    return await attempt(send, idempotencyKey);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 0) {
      return attempt(send, idempotencyKey);
    }
    throw error;
  }
}

export type WriteGate = {
  blockedForSeconds: () => number;
  write: <T>(send: WriteSender<T>, idempotencyKey: string) => Promise<T>;
};

export function createWriteGate(now: () => number = Date.now): WriteGate {
  let blockedUntil = 0;
  const blockedForSeconds = () =>
    Math.max(0, Math.ceil((blockedUntil - now()) / 1000));
  return {
    blockedForSeconds,
    async write(send, idempotencyKey) {
      const remaining = blockedForSeconds();
      if (remaining > 0) {
        throw new RateLimitedError(
          new ApiRequestError(429, {
            error: {
              code: 'RATE_LIMITED',
              params: { retryAfterSeconds: remaining },
            },
          }),
        );
      }
      const { data, error, response } = await sendWithRetry(
        send,
        idempotencyKey,
      );
      if (data !== undefined) {
        return data;
      }
      const failure = new ApiRequestError(response.status, error);
      if (failure.apiError.code === 'RATE_LIMITED') {
        const limited = new RateLimitedError(failure);
        blockedUntil = now() + limited.retryAfterSeconds * 1000;
        throw limited;
      }
      throw failure;
    },
  };
}
