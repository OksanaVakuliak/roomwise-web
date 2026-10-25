import { describe, expect, it } from 'vitest';
import {
  makeDraftRoom,
  makeEmptyDraft,
  makeInteriorDraft,
  makePricingData,
  styleIds,
} from '@/test/fixtures';
import {
  advance,
  canOpen,
  firstIncomplete,
  nextStep,
  objectComplete,
  STEP_ORDER,
  type StepContext,
  stepState,
  styleComplete,
} from './steps';

const context: StepContext = {
  limits: makePricingData().limits,
  styleIds: Object.values(styleIds),
};

const noBalcony = { present: false, areaSqm: null, tiles: false };

describe('step order', () => {
  it('is fixed', () => {
    expect(STEP_ORDER).toEqual([
      'object',
      'style',
      'interior',
      'engineering',
      'result',
    ]);
  });
});

describe('objectComplete', () => {
  it('is false for an empty draft', () => {
    expect(objectComplete(makeEmptyDraft(), context)).toBe(false);
  });

  it('is true for a filled object', () => {
    expect(objectComplete(makeInteriorDraft(), context)).toBe(true);
  });

  it('requires a finish level', () => {
    const { object } = makeInteriorDraft();
    const draft = makeInteriorDraft({
      object: { ...object, finishLevel: null },
    });
    expect(objectComplete(draft, context)).toBe(false);
  });

  it.each([14, 501, null])('rejects total area %s', (totalAreaSqm) => {
    const { object } = makeInteriorDraft();
    const draft = makeInteriorDraft({ object: { ...object, totalAreaSqm } });
    expect(objectComplete(draft, context)).toBe(false);
  });

  it.each([15, 500])('accepts total area %s', (totalAreaSqm) => {
    const { object } = makeInteriorDraft();
    const draft = makeInteriorDraft({
      object: { ...object, totalAreaSqm, balcony: noBalcony },
    });
    expect(objectComplete(draft, context)).toBe(true);
  });

  it.each([null, -1, 63])('rejects balcony area %s when present', (areaSqm) => {
    const { object } = makeInteriorDraft();
    const draft = makeInteriorDraft({
      object: {
        ...object,
        balcony: { present: true, areaSqm, tiles: false },
      },
    });
    expect(objectComplete(draft, context)).toBe(false);
  });

  it('ignores balcony area when absent', () => {
    const { object } = makeInteriorDraft();
    const draft = makeInteriorDraft({
      object: { ...object, balcony: noBalcony },
    });
    expect(objectComplete(draft, context)).toBe(true);
  });

  it('requires at least one room', () => {
    expect(objectComplete(makeInteriorDraft({ rooms: [] }), context)).toBe(
      false,
    );
  });

  it('rejects more rooms than the limit', () => {
    const rooms = Array.from({ length: 16 }, (_, index) =>
      makeDraftRoom({ clientId: `room-${index}` }),
    );
    expect(objectComplete(makeInteriorDraft({ rooms }), context)).toBe(false);
  });

  it('requires a room type allowed by the kitchen type', () => {
    const { object } = makeInteriorDraft();
    const rooms = [makeDraftRoom({ roomTypeCode: 'KITCHEN_LIVING' })];
    expect(objectComplete(makeInteriorDraft({ rooms }), context)).toBe(false);
    expect(
      objectComplete(
        makeInteriorDraft({
          rooms,
          object: { ...object, kitchenType: 'KITCHEN_LIVING' },
        }),
        context,
      ),
    ).toBe(true);
  });

  it('rejects an unselected room type', () => {
    const rooms = [makeDraftRoom({ roomTypeCode: null })];
    expect(objectComplete(makeInteriorDraft({ rooms }), context)).toBe(false);
  });

  it.each([
    { lengthM: null },
    { widthM: 0.5 },
    { lengthM: 31 },
    { heightM: 2.1 },
    { heightM: 5.1 },
  ])('rejects room dimensions %j', (overrides) => {
    const rooms = [makeDraftRoom(overrides)];
    expect(objectComplete(makeInteriorDraft({ rooms }), context)).toBe(false);
  });

  it('rejects a room name longer than 60 characters', () => {
    const rooms = [makeDraftRoom({ name: 'a'.repeat(61) })];
    expect(objectComplete(makeInteriorDraft({ rooms }), context)).toBe(false);
  });

  it('rejects a room name that is blank after trimming', () => {
    const rooms = [makeDraftRoom({ name: '   ' })];
    expect(objectComplete(makeInteriorDraft({ rooms }), context)).toBe(false);
  });

  it('accepts an automatic or a trimmed custom room name', () => {
    for (const name of [null, '  Study  ']) {
      const rooms = [makeDraftRoom({ name })];
      expect(objectComplete(makeInteriorDraft({ rooms }), context)).toBe(true);
    }
  });

  it('allows rooms area above the total area', () => {
    const rooms = [makeDraftRoom({ lengthM: 30, widthM: 30 })];
    expect(objectComplete(makeInteriorDraft({ rooms }), context)).toBe(true);
  });
});

describe('styleComplete', () => {
  it('requires a known style', () => {
    expect(styleComplete(makeInteriorDraft(), context)).toBe(true);
    expect(styleComplete(makeInteriorDraft({ styleId: null }), context)).toBe(
      false,
    );
    expect(styleComplete(makeInteriorDraft({ styleId: 'gone' }), context)).toBe(
      false,
    );
  });

  it('requires a complete object', () => {
    expect(styleComplete(makeInteriorDraft({ rooms: [] }), context)).toBe(
      false,
    );
  });
});

describe('firstIncomplete', () => {
  it('points at the first failing step', () => {
    expect(firstIncomplete(makeEmptyDraft(), context)).toBe('object');
    expect(firstIncomplete(makeInteriorDraft({ styleId: null }), context)).toBe(
      'style',
    );
    expect(firstIncomplete(makeInteriorDraft(), context)).toBeNull();
  });
});

describe('canOpen', () => {
  const openSteps = (draft = makeInteriorDraft()) =>
    STEP_ORDER.filter((step) => canOpen(step, draft, context));

  it('opens only the object step for a new draft', () => {
    expect(openSteps(makeEmptyDraft())).toEqual(['object']);
  });

  it('allows one step past the furthest one', () => {
    expect(openSteps(makeInteriorDraft({ furthestStep: 'style' }))).toEqual([
      'object',
      'style',
      'interior',
    ]);
  });

  it('opens everything once the furthest step is the last', () => {
    expect(openSteps(makeInteriorDraft({ furthestStep: 'result' }))).toEqual([
      ...STEP_ORDER,
    ]);
  });

  it('closes later steps when the object becomes incomplete', () => {
    const draft = makeInteriorDraft({ furthestStep: 'result', rooms: [] });
    expect(openSteps(draft)).toEqual(['object']);
  });

  it('closes steps after style when the style is missing', () => {
    const draft = makeInteriorDraft({ furthestStep: 'result', styleId: null });
    expect(openSteps(draft)).toEqual(['object', 'style']);
  });
});

describe('stepState', () => {
  const states = (draft = makeInteriorDraft()) =>
    STEP_ORDER.map((step) => stepState(step, draft, context));

  it('marks the current step as now', () => {
    const draft = makeInteriorDraft({ step: 'style', furthestStep: 'style' });
    expect(states(draft)[1]).toBe('now');
  });

  it('marks passed complete steps as done and the rest as later', () => {
    const draft = makeInteriorDraft({
      step: 'interior',
      furthestStep: 'engineering',
    });
    expect(states(draft)).toEqual(['done', 'done', 'now', 'later', 'later']);
  });

  it('does not mark an incomplete passed step as done', () => {
    const draft = makeInteriorDraft({
      step: 'object',
      furthestStep: 'engineering',
      styleId: null,
    });
    expect(states(draft)).toEqual(['now', 'later', 'done', 'later', 'later']);
  });
});

describe('nextStep', () => {
  it('follows the order and ends at result', () => {
    expect(nextStep('object')).toBe('style');
    expect(nextStep('engineering')).toBe('result');
    expect(nextStep('result')).toBeNull();
  });
});

describe('advance', () => {
  it('moves forward and raises furthestStep', () => {
    const next = advance(
      makeInteriorDraft({ step: 'interior', furthestStep: 'interior' }),
    );
    expect(next.step).toBe('engineering');
    expect(next.furthestStep).toBe('engineering');
  });

  it('keeps a further furthestStep', () => {
    const next = advance(
      makeInteriorDraft({ step: 'object', furthestStep: 'engineering' }),
    );
    expect(next.step).toBe('style');
    expect(next.furthestStep).toBe('engineering');
  });

  it('stays on result', () => {
    const draft = makeInteriorDraft({ step: 'result', furthestStep: 'result' });
    expect(advance(draft)).toBe(draft);
  });

  it('does not mutate the input', () => {
    const draft = makeInteriorDraft({
      step: 'interior',
      furthestStep: 'interior',
    });
    advance(draft);
    expect(draft.step).toBe('interior');
    expect(draft.furthestStep).toBe('interior');
  });
});
