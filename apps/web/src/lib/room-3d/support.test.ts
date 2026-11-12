import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loseContext = vi.fn();

function stubContexts(supported: string[]) {
  const context = {
    getExtension: vi.fn((name: string) =>
      name === 'WEBGL_lose_context' ? { loseContext } : null,
    ),
  };
  const getContext = vi.fn((type: string) =>
    supported.includes(type) ? context : null,
  );
  vi.spyOn(document, 'createElement').mockReturnValue({
    getContext,
  } as unknown as HTMLCanvasElement);
  return getContext;
}

async function load() {
  return (await import('./support')).isWebGlSupported;
}

beforeEach(() => {
  vi.resetModules();
  loseContext.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isWebGlSupported', () => {
  it('accepts webgl2 and requires no major performance caveat', async () => {
    const getContext = stubContexts(['webgl2']);

    expect((await load())()).toBe(true);
    expect(getContext).toHaveBeenCalledWith('webgl2', {
      failIfMajorPerformanceCaveat: true,
    });
  });

  it('falls back to webgl', async () => {
    const getContext = stubContexts(['webgl']);

    expect((await load())()).toBe(true);
    expect(getContext).toHaveBeenCalledWith('webgl', {
      failIfMajorPerformanceCaveat: true,
    });
  });

  it('releases the probe context after checking', async () => {
    stubContexts(['webgl2']);

    (await load())();

    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it('rejects when neither context is available', async () => {
    stubContexts([]);

    expect((await load())()).toBe(false);
  });

  it('rejects when getContext throws', async () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => {
        throw new Error('blocked');
      },
    } as unknown as HTMLCanvasElement);

    expect((await load())()).toBe(false);
  });

  it('probes once per session', async () => {
    const getContext = stubContexts(['webgl2']);
    const isSupported = await load();

    isSupported();
    isSupported();

    expect(getContext).toHaveBeenCalledTimes(1);
  });
});
