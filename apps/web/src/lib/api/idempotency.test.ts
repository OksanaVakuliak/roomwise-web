import { describe, expect, it } from 'vitest';
import { createActionKey } from './idempotency';

describe('createActionKey', () => {
  it('returns a UUID', () => {
    expect(createActionKey().keyFor({ a: 1 })).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('returns the same key for the same body', () => {
    const action = createActionKey();
    expect(action.keyFor({ a: 1, b: 2 })).toBe(action.keyFor({ b: 2, a: 1 }));
  });

  it('returns a new key when the body changes', () => {
    const action = createActionKey();
    const first = action.keyFor({ phone: '1' });
    const second = action.keyFor({ phone: '2' });
    expect(second).not.toBe(first);
    expect(action.keyFor({ phone: '2' })).toBe(second);
  });

  it('keeps keys independent between actions', () => {
    expect(createActionKey().keyFor({ a: 1 })).not.toBe(
      createActionKey().keyFor({ a: 1 }),
    );
  });
});
