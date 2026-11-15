import { RepeatWrapping, SRGBColorSpace, Texture } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTextureCache } from './texture-cache';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  capture: vi.fn(),
}));

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  class TextureLoader {
    load = mocks.load;
  }
  return { ...actual, TextureLoader };
});

vi.mock('@/lib/monitoring/client', () => ({
  captureException: mocks.capture,
}));

type Call = {
  url: string;
  resolve: () => Texture;
  fail: (error?: unknown) => void;
};

let calls: Call[];

function callFor(url: string): Call {
  const call = calls.find((c) => c.url === url);
  if (!call) throw new Error(`no load for ${url}`);
  return call;
}

beforeEach(() => {
  calls = [];
  mocks.load.mockReset();
  mocks.capture.mockReset();
  mocks.load.mockImplementation(
    (
      url: string,
      onLoad: (t: Texture) => void,
      _progress: unknown,
      onError: (e: unknown) => void,
    ) => {
      calls.push({
        url,
        resolve: () => {
          const texture = new Texture();
          vi.spyOn(texture, 'dispose');
          onLoad(texture);
          return texture;
        },
        fail: (error = new Error('boom')) => onError(error),
      });
    },
  );
});

describe('createTextureCache', () => {
  it('configures loaded textures', () => {
    const cache = createTextureCache({ anisotropy: 16 });
    const onReady = vi.fn();
    cache.request('floor', 'a', onReady);
    const texture = callFor('a').resolve();
    expect(onReady).toHaveBeenCalledWith(texture);
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    expect(texture.wrapS).toBe(RepeatWrapping);
    expect(texture.wrapT).toBe(RepeatWrapping);
    expect(texture.anisotropy).toBe(4);
  });

  it('keeps anisotropy below the cap', () => {
    const cache = createTextureCache({ anisotropy: 2 });
    cache.request('floor', 'a', vi.fn());
    expect(callFor('a').resolve().anisotropy).toBe(2);
  });

  it('serves cached textures synchronously without loading again', () => {
    const cache = createTextureCache({ anisotropy: 4 });
    cache.request('floor', 'a', vi.fn());
    const texture = callFor('a').resolve();
    const onReady = vi.fn();
    cache.request('walls', 'a', onReady);
    expect(onReady).toHaveBeenCalledWith(texture);
    expect(mocks.load).toHaveBeenCalledTimes(1);
  });

  it('shares one in-flight load between slots', () => {
    const cache = createTextureCache({ anisotropy: 4 });
    const floor = vi.fn();
    const walls = vi.fn();
    cache.request('floor', 'a', floor);
    cache.request('walls', 'a', walls);
    expect(mocks.load).toHaveBeenCalledTimes(1);
    const texture = callFor('a').resolve();
    expect(floor).toHaveBeenCalledWith(texture);
    expect(walls).toHaveBeenCalledWith(texture);
  });

  it('evicts and disposes the least recently used texture', () => {
    const cache = createTextureCache({ anisotropy: 4 });
    const textures: Texture[] = [];
    for (let i = 0; i < 13; i += 1) {
      cache.request('floor', `u${i}`, vi.fn());
      textures.push(callFor(`u${i}`).resolve());
    }
    expect(textures[0].dispose).toHaveBeenCalledTimes(1);
    expect(textures[1].dispose).not.toHaveBeenCalled();
    const onReady = vi.fn();
    cache.request('floor', 'u0', onReady);
    expect(onReady).not.toHaveBeenCalled();
    expect(mocks.load).toHaveBeenCalledTimes(14);
  });

  it('protects recently touched entries from eviction', () => {
    const cache = createTextureCache({ anisotropy: 4 });
    const textures: Texture[] = [];
    for (let i = 0; i < 12; i += 1) {
      cache.request('floor', `u${i}`, vi.fn());
      textures.push(callFor(`u${i}`).resolve());
    }
    cache.request('floor', 'u0', vi.fn());
    cache.request('floor', 'u12', vi.fn());
    callFor('u12').resolve();
    expect(textures[0].dispose).not.toHaveBeenCalled();
    expect(textures[1].dispose).toHaveBeenCalledTimes(1);
  });

  it('never evicts a texture pinned to a slot', () => {
    const cache = createTextureCache({ anisotropy: 4 });
    const textures: Texture[] = [];
    cache.request('walls', 'u0', vi.fn());
    textures.push(callFor('u0').resolve());
    for (let i = 1; i < 13; i += 1) {
      cache.request('floor', `u${i}`, vi.fn());
      textures.push(callFor(`u${i}`).resolve());
    }
    expect(textures[0].dispose).not.toHaveBeenCalled();
    expect(textures[1].dispose).toHaveBeenCalledTimes(1);
  });

  it('allows eviction after release', () => {
    const cache = createTextureCache({ anisotropy: 4 });
    const textures: Texture[] = [];
    cache.request('walls', 'u0', vi.fn());
    textures.push(callFor('u0').resolve());
    cache.release('walls');
    for (let i = 1; i < 13; i += 1) {
      cache.request('floor', `u${i}`, vi.fn());
      textures.push(callFor(`u${i}`).resolve());
    }
    expect(textures[0].dispose).toHaveBeenCalledTimes(1);
  });

  it('ignores a stale request that resolves after a newer one', () => {
    const cache = createTextureCache({ anisotropy: 4 });
    const onA = vi.fn();
    const onB = vi.fn();
    cache.request('floor', 'a', onA);
    cache.request('floor', 'b', onB);
    const b = callFor('b').resolve();
    callFor('a').resolve();
    expect(onA).not.toHaveBeenCalled();
    expect(onB).toHaveBeenCalledTimes(1);
    expect(onB).toHaveBeenCalledWith(b);
  });

  it('ignores a pending request after release', () => {
    const cache = createTextureCache({ anisotropy: 4 });
    const onReady = vi.fn();
    cache.request('floor', 'a', onReady);
    cache.release('floor');
    callFor('a').resolve();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('reports load errors, skips the callback and retries later', () => {
    const cache = createTextureCache({ anisotropy: 4 });
    const onReady = vi.fn();
    cache.request('floor', 'a', onReady);
    callFor('a').fail();
    expect(onReady).not.toHaveBeenCalled();
    expect(mocks.capture).toHaveBeenCalledTimes(1);
    const error = mocks.capture.mock.calls[0][0] as Error;
    expect(error.message).toContain('a');
    expect(error.cause).toBeInstanceOf(Error);
    cache.request('floor', 'a', onReady);
    expect(mocks.load).toHaveBeenCalledTimes(2);
  });

  it('disposes everything and ignores late callbacks', () => {
    const cache = createTextureCache({ anisotropy: 4 });
    cache.request('floor', 'a', vi.fn());
    const texture = callFor('a').resolve();
    const late = vi.fn();
    cache.request('walls', 'b', late);
    cache.dispose();
    expect(texture.dispose).toHaveBeenCalledTimes(1);
    callFor('b').resolve();
    expect(late).not.toHaveBeenCalled();
    const after = vi.fn();
    cache.request('floor', 'a', after);
    expect(after).not.toHaveBeenCalled();
    expect(mocks.load).toHaveBeenCalledTimes(2);
  });
});
