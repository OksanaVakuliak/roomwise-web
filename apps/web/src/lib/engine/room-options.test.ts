import { describe, expect, it } from 'vitest';
import {
  HEATED_FLOOR_CODE,
  isOptionAllowedForRoom,
  roomOptionsFor,
} from './room-options';

const base = {
  code: null,
  kind: 'ENGINEERING',
  perRoom: true,
  roomTypeCodes: [] as string[],
  scopes: ['FULL', 'PARTIAL'] as ('FULL' | 'PARTIAL')[],
};

describe('isOptionAllowedForRoom', () => {
  it('allows an option without room type restriction', () => {
    expect(isOptionAllowedForRoom({ roomTypeCodes: [] }, 'BEDROOM')).toBe(true);
  });

  it('allows only listed room types', () => {
    const option = { roomTypeCodes: ['BATHROOM'] };
    expect(isOptionAllowedForRoom(option, 'BATHROOM')).toBe(true);
    expect(isOptionAllowedForRoom(option, 'BEDROOM')).toBe(false);
  });

  it('rejects an unavailable option', () => {
    expect(
      isOptionAllowedForRoom(
        { roomTypeCodes: [], available: false },
        'BEDROOM',
      ),
    ).toBe(false);
  });
});

describe('roomOptionsFor', () => {
  const options = [
    { ...base, id: 'a' },
    { ...base, id: 'b', roomTypeCodes: ['BATHROOM'] },
    { ...base, id: 'c', kind: 'ADDITIONAL' },
    { ...base, id: 'd', perRoom: false },
    { ...base, id: 'e', code: HEATED_FLOOR_CODE },
    { ...base, id: 'f', available: false },
  ];

  it('keeps allowed per-room engineering options without heated floor', () => {
    expect(
      roomOptionsFor(options, 'BEDROOM', 'FULL', {}).map((o) => o.id),
    ).toEqual(['a']);
    expect(
      roomOptionsFor(options, 'BATHROOM', 'FULL', {}).map((o) => o.id),
    ).toEqual(['a', 'b']);
  });

  it('returns nothing without a room type', () => {
    expect(roomOptionsFor(options, null, 'FULL', {})).toEqual([]);
  });

  it('hides options outside the scope unless chosen', () => {
    const scoped = [
      { ...base, id: 'a', scopes: ['FULL' as const] },
      { ...base, id: 'b', scopes: ['FULL' as const] },
      { ...base, id: 'c' },
    ];
    expect(
      roomOptionsFor(scoped, 'BEDROOM', 'PARTIAL', { b: {} }).map((o) => o.id),
    ).toEqual(['b', 'c']);
    expect(
      roomOptionsFor(scoped, 'BEDROOM', 'FULL', {}).map((o) => o.id),
    ).toEqual(['a', 'b', 'c']);
  });
});
