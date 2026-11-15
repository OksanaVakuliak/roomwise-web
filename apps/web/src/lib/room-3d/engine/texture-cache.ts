import {
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
} from 'three';
import { captureException } from '@/lib/monitoring/client';
import type { SurfaceKey } from '../types';

const DEFAULT_CAPACITY = 12;
const MAX_ANISOTROPY = 4;

export type TextureCacheOptions = {
  anisotropy: number;
  capacity?: number;
};

export type TextureCache = {
  request(
    slot: SurfaceKey,
    url: string,
    onReady: (texture: Texture) => void,
    onError?: () => void,
  ): void;
  release(slot: SurfaceKey): void;
  dispose(): void;
};

type Waiter = {
  slot: SurfaceKey;
  token: number;
  onReady: (texture: Texture) => void;
  onError?: () => void;
};

export function createTextureCache(options: TextureCacheOptions): TextureCache {
  const capacity = options.capacity ?? DEFAULT_CAPACITY;
  const anisotropy = Math.min(MAX_ANISOTROPY, options.anisotropy);
  const loader = new TextureLoader();
  const textures = new Map<string, Texture>();
  const pending = new Map<string, Waiter[]>();
  const pins = new Map<SurfaceKey, string>();
  const tokens = new Map<SurfaceKey, number>();
  let disposed = false;

  function nextToken(slot: SurfaceKey): number {
    const token = (tokens.get(slot) ?? 0) + 1;
    tokens.set(slot, token);
    return token;
  }

  function evict() {
    const pinned = new Set(pins.values());
    for (const [url, texture] of textures) {
      if (textures.size <= capacity) return;
      if (pinned.has(url)) continue;
      textures.delete(url);
      texture.dispose();
    }
  }

  function settle(url: string, texture: Texture) {
    const waiters = pending.get(url) ?? [];
    pending.delete(url);
    textures.set(url, texture);
    evict();
    for (const { slot, token, onReady, onError } of waiters) {
      if (tokens.get(slot) === token) onReady(texture);
    }
  }

  function load(url: string) {
    loader.load(
      url,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = SRGBColorSpace;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.anisotropy = anisotropy;
        settle(url, texture);
      },
      undefined,
      (error) => {
        if (disposed) return;
        const waiters = pending.get(url) ?? [];
        pending.delete(url);
        captureException(
          new Error(`Texture failed to load: ${url}`, { cause: error }),
        );
        for (const { slot, token, onError } of waiters) {
          if (tokens.get(slot) === token) onError?.();
        }
      },
    );
  }

  return {
    request(slot, url, onReady, onError) {
      if (disposed) return;
      const token = nextToken(slot);
      pins.set(slot, url);
      const cached = textures.get(url);
      if (cached) {
        textures.delete(url);
        textures.set(url, cached);
        onReady(cached);
        return;
      }
      const waiters = pending.get(url);
      if (waiters) {
        waiters.push({ slot, token, onReady, onError });
        return;
      }
      pending.set(url, [{ slot, token, onReady, onError }]);
      load(url);
    },
    release(slot) {
      nextToken(slot);
      pins.delete(slot);
    },
    dispose() {
      disposed = true;
      for (const texture of textures.values()) texture.dispose();
      textures.clear();
      pending.clear();
      pins.clear();
    },
  };
}
