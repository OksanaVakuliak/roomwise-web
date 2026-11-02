import { describe, expect, it } from 'vitest';
import { toConfiguration } from '@/lib/engine/to-configuration';
import {
  type DraftV1,
  makeDraftRoom,
  makeInteriorDraft,
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

function roomsOf(draft: DraftV1) {
  const pricing = makePricingData();
  const configuration = toConfiguration(draft, pricing, {
    mode: 'preview',
    currency: 'USD',
  });
  if (configuration === null) {
    throw new Error('configuration expected');
  }
  return optionRoomIds(configuration, pricing);
}

describe('optionRoomIds', () => {
  it('lists only the heated floor rooms whose type the option allows', () => {
    const draft = makeInteriorDraft({ rooms: [bathroom, bedroom] });

    expect(roomsOf(draft).get('opt-heated-floor')).toEqual(['bath']);
  });

  it('keeps every chosen room when the option allows any room type', () => {
    const draft = makeInteriorDraft({
      rooms: [bedroom, kitchen],
      options: { 'opt-soundproofing': { roomClientIds: ['kitchen', 'bed'] } },
    });

    expect(roomsOf(draft).get('opt-soundproofing')).toEqual(['kitchen', 'bed']);
  });

  it('skips options that are not priced per room', () => {
    const draft = makeInteriorDraft({
      rooms: [bedroom],
      options: { 'opt-ac': { quantity: 1, roomClientIds: ['bed'] } },
    });

    expect(roomsOf(draft).has('opt-ac')).toBe(false);
  });
});
