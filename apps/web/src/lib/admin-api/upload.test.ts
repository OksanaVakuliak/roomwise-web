import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitedError } from '@/lib/api/write';
import { adminErrors } from '@/test/fixtures/admin/errors';
import {
  IMAGE_ACCEPT,
  IMAGE_MAX_BYTES,
  uploadImage,
  validateImageFile,
} from './upload';

class FakeXhr {
  static instances: FakeXhr[] = [];
  method = '';
  url = '';
  withCredentials = false;
  responseType = '';
  status = 0;
  responseText = '';
  body: FormData | null = null;
  upload: { onprogress: ((event: ProgressEvent) => void) | null } = {
    onprogress: null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  aborted = false;

  constructor() {
    FakeXhr.instances.push(this);
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  send(body: FormData) {
    this.body = body;
  }

  abort() {
    this.aborted = true;
    this.onabort?.();
  }

  progress(loaded: number, total: number) {
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded,
      total,
    } as ProgressEvent);
  }

  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.onload?.();
  }
}

const imageFile = (type = 'image/png', size = 1024, name = 'a.png') =>
  new File([new Uint8Array(size)], name, { type });

const sent = () => FakeXhr.instances;

beforeEach(() => {
  FakeXhr.instances = [];
  vi.stubGlobal('XMLHttpRequest', FakeXhr);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('constants', () => {
  it('limits to 5 MB and three types', () => {
    expect(IMAGE_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(IMAGE_ACCEPT).toBe('image/jpeg,image/png,image/webp');
  });
});

describe('validateImageFile', () => {
  it('accepts jpeg, png and webp up to the limit', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(validateImageFile(imageFile(type, IMAGE_MAX_BYTES))).toBeNull();
    }
  });
});

describe('uploadImage', () => {
  it('rejects a 6 MB file without sending a request', async () => {
    const file = imageFile('image/png', 6 * 1024 * 1024);

    await expect(uploadImage(file)).rejects.toMatchObject({
      status: 413,
      apiError: { code: 'PAYLOAD_TOO_LARGE' },
    });
    expect(sent()).toHaveLength(0);
  });

  it('rejects a gif without sending a request', async () => {
    const file = imageFile('image/gif', 100, 'a.gif');

    await expect(uploadImage(file)).rejects.toMatchObject({
      status: 415,
      apiError: { code: 'UNSUPPORTED_IMAGE_TYPE' },
    });
    expect(sent()).toHaveLength(0);
  });

  it('posts multipart with the file and real size and reports progress', async () => {
    const file = imageFile();
    const onProgress = vi.fn();
    const promise = uploadImage(file, { realSizeMm: 600, onProgress });
    const [xhr] = sent();

    expect(xhr?.method).toBe('POST');
    expect(xhr?.url).toBe('/api/v1/admin/images');
    expect(xhr?.withCredentials).toBe(true);
    expect(xhr?.body?.get('file')).toBeInstanceOf(File);
    expect(xhr?.body?.get('realSizeMm')).toBe('600');

    xhr?.progress(250, 1000);
    xhr?.progress(1000, 1000);
    const image = { id: 'img', realSizeMm: 600 };
    xhr?.respond(201, image);

    await expect(promise).resolves.toEqual(image);
    expect(onProgress.mock.calls.map(([value]) => value)).toEqual([
      25, 100, 100,
    ]);
  });

  it('omits realSizeMm when not given', () => {
    void uploadImage(imageFile());

    expect(sent()[0]?.body?.has('realSizeMm')).toBe(false);
  });

  it('maps 413 and 415 responses', async () => {
    const tooLarge = uploadImage(imageFile());
    sent()[0]?.respond(413, {});
    await expect(tooLarge).rejects.toMatchObject({
      status: 413,
      apiError: { code: 'PAYLOAD_TOO_LARGE' },
    });

    const unsupported = uploadImage(imageFile());
    sent()[1]?.respond(415, { error: { code: 'UNSUPPORTED_IMAGE_TYPE' } });
    await expect(unsupported).rejects.toMatchObject({
      status: 415,
      apiError: { code: 'UNSUPPORTED_IMAGE_TYPE' },
    });
  });

  it('maps 429 to RateLimitedError with the wait', async () => {
    const { status, body } = adminErrors.rateLimited(17);
    const promise = uploadImage(imageFile());
    sent()[0]?.respond(status, body);

    const failure = await promise.catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(RateLimitedError);
    expect(failure).toMatchObject({ retryAfterSeconds: 17 });
  });

  it('maps 502 to an image storage failure', async () => {
    const promise = uploadImage(imageFile());
    sent()[0]?.respond(502, {});

    await expect(promise).rejects.toMatchObject({
      status: 502,
      apiError: { code: 'IMAGE_STORAGE_FAILED' },
    });
  });

  it('maps a network error', async () => {
    const promise = uploadImage(imageFile());
    sent()[0]?.onerror?.();

    await expect(promise).rejects.toMatchObject({
      status: 0,
      apiError: { code: 'network' },
    });
  });

  it('aborts through the signal', async () => {
    const controller = new AbortController();
    const promise = uploadImage(imageFile(), { signal: controller.signal });

    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    expect(sent()[0]?.aborted).toBe(true);
  });
});
