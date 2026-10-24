import type { components } from '@/generated/api';
import { categoryIds, productIds } from './catalog';
import { makePricingData } from './pricing-data';

type Schemas = components['schemas'];

export type VersionView = Schemas['VersionViewDto_Output'];
export type VersionLine = VersionView['lines'][number];
export type SaveCalculationResponse =
  Schemas['SaveCalculationResponseDto_Output'];

export const calculationIds = {
  publicId: 'k3m9x2q7',
  livingRoom: 'living',
  bathroom: 'bath',
} as const;

const latestNumber = 3;

function makeLine(overrides: Partial<VersionLine> & { id: string }) {
  return {
    section: 'MATERIALS',
    status: 'OK',
    roomClientId: null,
    categoryId: null,
    productId: null,
    optionId: null,
    packageItemId: null,
    ruleId: null,
    quantity: null,
    unit: null,
    unitPriceCents: null,
    amountCents: 0,
    amountUahKopecks: 0,
    warnings: [],
    error: null,
    roomName: null,
    categoryName: null,
    optionName: null,
    packageItemName: null,
    ruleName: null,
    product: null,
    ...overrides,
  } satisfies VersionLine;
}

function makeLines(): VersionLine[] {
  const laminate = {
    name: 'Oak Natural Laminate',
    brand: 'Roomwise',
    manufacturer: 'Roomwise Factory',
    color: 'Natural',
    size: '1200x190 mm',
    image: null,
  };
  return [
    makeLine({
      id: 'BASE',
      section: 'BASE',
      quantity: 62,
      unit: 'SQM',
      unitPriceCents: 11850,
      amountCents: 734700,
      amountUahKopecks: 32729636,
    }),
    makeLine({
      id: 'OBJECT:rule-balcony-tile',
      section: 'OBJECT',
      ruleId: 'rule-balcony-tile',
      ruleName: 'Balcony tiles',
      amountCents: 30000,
      amountUahKopecks: 1336449,
    }),
    makeLine({
      id: 'MATERIALS:living:cat-floor',
      roomClientId: calculationIds.livingRoom,
      categoryId: categoryIds.floor,
      productId: productIds.laminate,
      roomName: 'Living room',
      categoryName: 'Flooring',
      quantity: 21,
      unit: 'SQM',
      unitPriceCents: 1800,
      amountCents: 42000,
      amountUahKopecks: 1871029,
      product: laminate,
    }),
    makeLine({
      id: 'MATERIALS:living:cat-walls',
      roomClientId: calculationIds.livingRoom,
      categoryId: categoryIds.walls,
      productId: productIds.paint,
      roomName: 'Living room',
      categoryName: 'Walls',
      quantity: 53.46,
      unit: 'SQM',
      unitPriceCents: 675,
      amountCents: 36086,
      amountUahKopecks: 1607570,
      product: {
        ...laminate,
        name: 'Silk White Wall Paint',
        brand: 'Colora',
        manufacturer: 'Colora Paints',
        color: 'White',
        size: '10 l',
      },
    }),
    makeLine({
      id: 'MATERIALS:bath:cat-floor',
      roomClientId: calculationIds.bathroom,
      categoryId: categoryIds.floor,
      productId: productIds.tile,
      roomName: 'Bathroom',
      categoryName: 'Flooring',
      quantity: 4.4,
      unit: 'SQM',
      unitPriceCents: 2250,
      amountCents: 19140,
      amountUahKopecks: 852654,
      product: {
        ...laminate,
        name: 'Stone Grey Porcelain Tile',
        brand: 'Ceramix',
        manufacturer: 'Ceramix Works',
        color: 'Grey',
        size: '600x600 mm',
      },
    }),
    makeLine({
      id: 'MATERIALS:bath:cat-ceiling',
      roomClientId: calculationIds.bathroom,
      categoryId: categoryIds.ceiling,
      productId: productIds.ceilingPaint,
      roomName: 'Bathroom',
      categoryName: 'Ceiling',
      quantity: 4.2,
      unit: 'SQM',
      unitPriceCents: 325,
      amountCents: 1365,
      amountUahKopecks: 60808,
      product: {
        ...laminate,
        name: 'Matt Ceiling Paint',
        brand: 'Colora',
        manufacturer: 'Colora Paints',
        color: 'White',
        size: '10 l',
      },
    }),
    makeLine({
      id: 'ENGINEERING:package:pk-wiring',
      section: 'ENGINEERING',
      status: 'INCLUDED',
      packageItemId: 'pk-wiring',
      packageItemName: 'Electrical wiring',
    }),
    makeLine({
      id: 'ENGINEERING:option:opt-ac',
      section: 'ENGINEERING',
      optionId: 'opt-ac',
      optionName: 'Air conditioner',
      quantity: 3,
      unit: 'PIECE',
      unitPriceCents: 45000,
      amountCents: 135000,
      amountUahKopecks: 6014021,
    }),
    makeLine({
      id: 'ADDITIONAL:option:opt-design',
      section: 'ADDITIONAL',
      optionId: 'opt-design',
      optionName: 'Design project',
      quantity: 1,
      unit: 'PROJECT',
      unitPriceCents: 120000,
      amountCents: 120000,
      amountUahKopecks: 5345796,
    }),
  ];
}

function makeTotals(lines: VersionLine[]): VersionView['totals'] {
  const sections: VersionView['totals']['sections'] = {};
  let usdCents = 0;
  let uahKopecks = 0;
  for (const line of lines) {
    const section = sections[line.section] ?? { usdCents: 0, uahKopecks: 0 };
    sections[line.section] = {
      usdCents: section.usdCents + line.amountCents,
      uahKopecks: (section.uahKopecks ?? 0) + (line.amountUahKopecks ?? 0),
    };
    usdCents += line.amountCents;
    uahKopecks += line.amountUahKopecks ?? 0;
  }
  return { usdCents, uahKopecks, sections };
}

function makeVersions(): VersionView['versions'] {
  return [3, 2, 1].map((number) => ({
    number,
    createdAt: `2026-09-${10 + number}T09:30:00.000Z`,
    totalUsdCents: 1080840 - (latestNumber - number) * 5000,
    expired: false,
  }));
}

export function makeVersionView(
  overrides: Partial<VersionView> = {},
): VersionView {
  const pricing = makePricingData();
  const lines = overrides.lines ?? makeLines();
  return {
    publicId: calculationIds.publicId,
    number: latestNumber,
    createdAt: '2026-09-13T09:30:00.000Z',
    expiresAt: '2026-12-12T09:30:00.000Z',
    expired: false,
    incomplete: false,
    pricingVersion: pricing.version,
    style: { id: 'style-modern', name: 'Modern' },
    configuration: {
      finishLevel: 'PRE_FINISH',
      totalAreaSqm: 62,
      balconyAreaSqm: 4,
      balconyTiles: true,
      gas: false,
      kitchenType: 'SEPARATE',
      rooms: [
        {
          clientId: calculationIds.livingRoom,
          roomTypeCode: 'LIVING_ROOM',
          lengthM: 5,
          widthM: 4,
          heightM: 2.7,
          heatedFloor: false,
          selections: [
            { categoryId: categoryIds.floor, productId: productIds.laminate },
            { categoryId: categoryIds.walls, productId: productIds.paint },
            { categoryId: categoryIds.ceiling, productId: null },
          ],
        },
        {
          clientId: calculationIds.bathroom,
          roomTypeCode: 'BATHROOM',
          lengthM: 2,
          widthM: 2,
          heightM: 2.5,
          heatedFloor: true,
          selections: [
            { categoryId: categoryIds.floor, productId: productIds.tile },
            {
              categoryId: categoryIds.ceiling,
              productId: productIds.ceilingPaint,
            },
          ],
        },
      ],
      options: [
        { optionId: 'opt-ac', quantity: 3 },
        { optionId: 'opt-design' },
      ],
      currency: 'USD',
    },
    rooms: [
      {
        clientId: calculationIds.livingRoom,
        roomTypeCode: 'LIVING_ROOM',
        lengthM: 5,
        widthM: 4,
        heightM: 2.7,
        heatedFloor: false,
        name: 'Living room',
      },
      {
        clientId: calculationIds.bathroom,
        roomTypeCode: 'BATHROOM',
        lengthM: 2,
        widthM: 2,
        heightM: 2.5,
        heatedFloor: true,
        name: 'Bathroom',
      },
    ],
    lines,
    totals: makeTotals(lines),
    warnings: [],
    exchangeRate: pricing.exchangeRate,
    priceStatus: {
      changed: false,
      snapshotTotalUsdCents: makeTotals(lines).usdCents,
      currentTotalUsdCents: makeTotals(lines).usdCents,
      diffCents: 0,
      unavailableItems: [],
      currentPricingVersion: pricing.version,
    },
    versions: makeVersions(),
    ...overrides,
  };
}

export function makeLatestVersionView(
  overrides: Partial<VersionView> = {},
): VersionView {
  return makeVersionView(overrides);
}

export function makeOldVersionView(
  overrides: Partial<VersionView> = {},
): VersionView {
  return makeVersionView({
    number: 1,
    createdAt: '2026-09-11T09:30:00.000Z',
    ...overrides,
  });
}

export function makeExpiredVersionView(
  overrides: Partial<VersionView> = {},
): VersionView {
  return makeVersionView({
    expired: true,
    expiresAt: '2026-09-20T09:30:00.000Z',
    versions: makeVersions().map((version) => ({ ...version, expired: true })),
    ...overrides,
  });
}

export function makeChangedPriceVersionView(
  overrides: Partial<VersionView> = {},
): VersionView {
  const base = makeVersionView();
  const snapshotTotalUsdCents = base.totals.usdCents;
  return {
    ...base,
    pricingVersion: 'fedcba9876543210',
    priceStatus: {
      changed: true,
      snapshotTotalUsdCents,
      currentTotalUsdCents: snapshotTotalUsdCents + 12500,
      diffCents: 12500,
      unavailableItems: [],
      currentPricingVersion: base.priceStatus?.currentPricingVersion ?? '',
    },
    ...overrides,
  };
}

export function makeUnavailableItemsVersionView(
  overrides: Partial<VersionView> = {},
): VersionView {
  const changed = makeChangedPriceVersionView();
  return {
    ...changed,
    priceStatus: changed.priceStatus && {
      ...changed.priceStatus,
      unavailableItems: [
        {
          lineId: 'MATERIALS:living:cat-floor',
          productId: productIds.laminate,
          optionId: null,
        },
        {
          lineId: 'ENGINEERING:option:opt-ac',
          productId: null,
          optionId: 'opt-ac',
        },
      ],
    },
    ...overrides,
  };
}

export function makeSaveCalculationResponse(
  overrides: Partial<SaveCalculationResponse> = {},
): SaveCalculationResponse {
  return { version: makeVersionView(), priceDifference: null, ...overrides };
}
