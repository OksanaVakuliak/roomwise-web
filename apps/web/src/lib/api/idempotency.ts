import { stableJson } from '@/lib/draft/hash';

export type ActionKey = { keyFor: (body: unknown) => string };

export function createActionKey(): ActionKey {
  let current: { hash: string; key: string } | null = null;
  return {
    keyFor(body) {
      const hash = stableJson(body);
      if (current?.hash !== hash) {
        current = { hash, key: crypto.randomUUID() };
      }
      return current.key;
    },
  };
}
