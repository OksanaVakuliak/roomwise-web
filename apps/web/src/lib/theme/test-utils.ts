import { vi } from 'vitest';

type Listener = () => void;

export function stubMatchMedia(initialDark: boolean) {
  let dark = initialDark;
  const listeners = new Set<Listener>();
  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() {
      return dark;
    },
    addEventListener: (_: string, listener: Listener) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) =>
      listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;
  return {
    setDark(value: boolean) {
      dark = value;
      for (const listener of listeners) listener();
    },
    listenerCount: () => listeners.size,
  };
}

export function installMemoryStorage() {
  const items = new Map<string, string>();
  const storage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    clear: () => items.clear(),
  };
  vi.stubGlobal('localStorage', storage);
  return storage;
}

export function resetThemeDom() {
  document.documentElement.removeAttribute('data-theme');
  for (const meta of document.head.querySelectorAll(
    'meta[name="theme-color"]',
  )) {
    meta.remove();
  }
  installMemoryStorage();
}

export function breakStorage(method: 'getItem' | 'setItem') {
  return vi.spyOn(window.localStorage, method).mockImplementation(() => {
    throw new Error('storage blocked');
  });
}
