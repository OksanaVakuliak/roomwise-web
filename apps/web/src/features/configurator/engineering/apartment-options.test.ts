import { describe, expect, it } from 'vitest';
import { makePricingData } from '@/test/fixtures/pricing-data';
import { apartmentOptions } from './apartment-options';

const { options } = makePricingData();

const texts = [
  {
    id: 'opt-ac',
    name: 'AC',
    description: 'd',
    kind: 'ENGINEERING',
    perRoom: false,
  },
  {
    id: 'opt-heated-floor',
    name: 'HF',
    description: 'd',
    kind: 'ENGINEERING',
    perRoom: false,
    code: 'HEATED_FLOOR',
  },
  {
    id: 'opt-soundproofing',
    name: 'SP',
    description: 'd',
    kind: 'ENGINEERING',
    perRoom: true,
  },
  {
    id: 'opt-design',
    name: 'Design',
    description: 'd',
    kind: 'ADDITIONAL',
    perRoom: false,
  },
  {
    id: 'missing',
    name: 'X',
    description: 'd',
    kind: 'ENGINEERING',
    perRoom: false,
  },
];

describe('apartmentOptions', () => {
  it('keeps only rendered apartment options of the kind', () => {
    expect(
      apartmentOptions(texts, options, 'ENGINEERING', 'FULL', {}).map(
        (o) => o.id,
      ),
    ).toEqual(['opt-ac']);
    expect(
      apartmentOptions(texts, options, 'ADDITIONAL', 'FULL', {}).map(
        (o) => o.id,
      ),
    ).toEqual(['opt-design']);
  });

  it('hides an unavailable option unless it is chosen', () => {
    const unavailable = options.map((o) =>
      o.id === 'opt-ac' ? { ...o, available: false } : o,
    );
    expect(
      apartmentOptions(texts, unavailable, 'ENGINEERING', 'FULL', {}),
    ).toEqual([]);
    expect(
      apartmentOptions(texts, unavailable, 'ENGINEERING', 'FULL', {
        'opt-ac': {},
      }).map((o) => o.id),
    ).toEqual(['opt-ac']);
  });

  it('hides an option outside the scope unless it is chosen', () => {
    const fullOnly = options.map((o) =>
      o.id === 'opt-ac' ? { ...o, scopes: ['FULL' as const] } : o,
    );
    expect(
      apartmentOptions(texts, fullOnly, 'ENGINEERING', 'FULL', {}).map(
        (o) => o.id,
      ),
    ).toEqual(['opt-ac']);
    expect(
      apartmentOptions(texts, fullOnly, 'ENGINEERING', 'PARTIAL', {}),
    ).toEqual([]);
    expect(
      apartmentOptions(texts, fullOnly, 'ENGINEERING', 'PARTIAL', {
        'opt-ac': {},
      }).map((o) => o.id),
    ).toEqual(['opt-ac']);
  });

  it('returns an empty list without texts', () => {
    expect(
      apartmentOptions(undefined, options, 'ENGINEERING', 'FULL', {}),
    ).toEqual([]);
  });
});
