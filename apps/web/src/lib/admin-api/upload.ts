import type { components } from '@/generated/api';
import { ApiRequestError } from '@/lib/api/request-error';
import { isServerUnavailable } from '@/lib/api/server-unavailable';
import { RateLimitedError, waitUntilReady } from '@/lib/api/write';
import { rewarm } from '@/lib/warmup';

export type UploadedImage = components['schemas']['AdminImageDto_Output'];

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',');

const UPLOAD_URL = '/api/v1/admin/images';

export type PendingUpload = {
  localId: string;
  file: File;
  previewUrl: string;
  progress: number;
  state: 'queued' | 'uploading' | 'done' | 'error';
  imageId?: string;
  error?: unknown;
};

export type UploadOptions = {
  realSizeMm?: number;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

const failure = (status: number, code: string) =>
  new ApiRequestError(status, { error: { code } });

export function validateImageFile(file: File): ApiRequestError | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return failure(415, 'UNSUPPORTED_IMAGE_TYPE');
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return failure(413, 'PAYLOAD_TOO_LARGE');
  }
  return null;
}

const parseBody = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

function toFailure(status: number, text: string): ApiRequestError {
  const body = parseBody(text);
  const error = new ApiRequestError(status, body);
  if (status === 429) {
    return new RateLimitedError(
      error.apiError.code === 'RATE_LIMITED'
        ? error
        : failure(429, 'RATE_LIMITED'),
    );
  }
  if (error.apiError.code !== 'unknown') {
    return error;
  }
  if (isServerUnavailable(status, error.apiError)) {
    void rewarm();
    return failure(0, 'network');
  }
  switch (status) {
    case 413:
      return failure(status, 'PAYLOAD_TOO_LARGE');
    case 415:
      return failure(status, 'UNSUPPORTED_IMAGE_TYPE');
    default:
      return error;
  }
}

const aborted = () => new DOMException('Aborted', 'AbortError');

function readyOrAborted(signal: AbortSignal | undefined): Promise<void> {
  if (!signal) return waitUntilReady();
  return new Promise<void>((resolve, reject) => {
    const abort = () => reject(aborted());
    signal.addEventListener('abort', abort, { once: true });
    waitUntilReady().then(
      () => {
        signal.removeEventListener('abort', abort);
        if (signal.aborted) reject(aborted());
        else resolve();
      },
      (reason: unknown) => {
        signal.removeEventListener('abort', abort);
        reject(reason);
      },
    );
  });
}

export async function uploadImage(
  file: File,
  { realSizeMm, onProgress, signal }: UploadOptions = {},
): Promise<UploadedImage> {
  const invalid = validateImageFile(file);
  if (invalid) {
    throw invalid;
  }
  if (signal?.aborted) {
    throw aborted();
  }
  await readyOrAborted(signal);
  return new Promise<UploadedImage>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);
    if (realSizeMm !== undefined) {
      form.append('realSizeMm', String(realSizeMm));
    }
    const abort = () => request.abort();
    const finish = () => signal?.removeEventListener('abort', abort);

    request.open('POST', UPLOAD_URL);
    request.withCredentials = true;
    request.responseType = 'text';
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      finish();
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100);
        resolve(parseBody(request.responseText) as UploadedImage);
        return;
      }
      reject(toFailure(request.status, request.responseText));
    };
    request.onerror = () => {
      finish();
      reject(failure(0, 'network'));
    };
    request.ontimeout = request.onerror;
    request.onabort = () => {
      finish();
      reject(aborted());
    };
    signal?.addEventListener('abort', abort, { once: true });
    request.send(form);
  });
}
