import { describe, expect, it } from 'vitest';
import {
  makeDraftRoom,
  makeEmptyDraft,
  makePricingData,
} from '@/test/fixtures';
import { optionRoomIds } from './option-room-ids';

const bathroom = makeDraftRoom({
  clientId: 'bath',
  roomTypeCode: 'BATHROOM',
  heatedFloor: true,
});
const bedroom = makeDraftRoom({
  clientId: 'bed',
  roomTypeCode: 'BEDROOM',
  heatedFloor: true,
});
const kitchen = makeDraftRoom({ clientId: 'kitchen', roomTypeCode: 'KITCHEN' });

describe('optionRoomIds', () => {
  it('lists only the heated floor rooms whose type the option allows', () => {
    const draft = makeEmptyDraft({ rooms: [bathroom, bedroom] });

    const result = optionRoomIds(draft, makePricingData());

    expect(result.get('opt-heated-floor')).toEqual(['bath']);
  });

  it('drops chosen rooms that the option does not allow', () => {
    const draft = makeEmptyDraft({
      rooms: [bathroom, bedroom],
      options: { 'opt-ac': { roomClientIds: ['bath', 'bed'] } },
    });

    expect(optionRoomIds(draft, makePricingData()).get('opt-ac')).toEqual([
      'bed',
    ]);
  });

  it('keeps every chosen room when the option allows any room type', () => {
    const draft = makeEmptyDraft({
      rooms: [bedroom, kitchen],
      options: { 'opt-soundproofing': { roomClientIds: ['kitchen', 'bed'] } },
    });

    expect(
      optionRoomIds(draft, makePricingData()).get('opt-soundproofing'),
    ).toEqual(['bed', 'kitchen']);
  });
});
