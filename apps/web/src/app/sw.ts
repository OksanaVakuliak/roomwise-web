/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/turbopack/worker';
import { type PrecacheEntry, Serwist, type SerwistGlobalConfig } from 'serwist';
import { fallbacks, withUncachedRoutes, workerOptions } from '@/lib/pwa';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  ...workerOptions,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: withUncachedRoutes(defaultCache),
  fallbacks,
});

serwist.addEventListeners();
