import type { StateStorage } from 'zustand/middleware';

export function createSafeStorage(onUnavailable?: () => void): StateStorage {
  return {
    getItem: (name) => {
      let raw: string | null;
      try {
        raw = localStorage.getItem(name);
      } catch {
        onUnavailable?.();
        return null;
      }
      if (raw === null) {
        return null;
      }
      try {
        JSON.parse(raw);
        return raw;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        localStorage.setItem(name, value);
      } catch {
        onUnavailable?.();
      }
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        onUnavailable?.();
      }
    },
  };
}
