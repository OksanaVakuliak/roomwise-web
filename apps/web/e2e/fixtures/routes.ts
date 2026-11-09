import {
  makeCategoryProducts,
  makeDefaultMaterials,
  makeEngineering,
  makeLeadCreated,
  makeLeadFormSettings,
  makePricingData,
  makeProductDetails,
  makeRoomTypes,
  makeSaveCalculationResponse,
  makeStyles,
  makeVersionView,
  type VersionView,
} from '@/test/fixtures';

export type Json = unknown;

export type MockReply = {
  status?: number;
  body?: Json;
  etag?: boolean;
};

export type MockStore = {
  calculations: Map<string, VersionView>;
  idempotent: Map<string, MockReply>;
  leadCount: number;
};

export function createMockStore(): MockStore {
  return { calculations: new Map(), idempotent: new Map(), leadCount: 1041 };
}

type Route = {
  method: 'GET' | 'POST';
  pattern: RegExp;
  reply: (match: RegExpMatchArray, request: { store: MockStore }) => MockReply;
};

const LIVED_IN_FLOOR_PREP =
  "surfaceArea * (finishLevel == 'ROUGH' ? coef.prep_screed + coef.mat_screed : finishLevel == 'LIVED_IN' ? coef.prep_floor_demolition + coef.mat_demolition_disposal : 0)";

export const DEMOLITION_RATES = {
  prep_floor_demolition: 3.5,
  mat_demolition_disposal: 2.8,
};

function makeE2ePricingData() {
  const pricing = makePricingData();
  return {
    ...pricing,
    coefficients: { ...pricing.coefficients, ...DEMOLITION_RATES },
    rules: pricing.rules.map((rule) =>
      rule.id === 'rule-floor-prep'
        ? { ...rule, costFormula: LIVED_IN_FLOOR_PREP }
        : rule,
    ),
  };
}

const ok = (body: Json): MockReply => ({ status: 200, body, etag: true });

const notFound = (): MockReply => ({
  status: 404,
  body: { error: { code: 'NOT_FOUND' } },
});

const lookup = (store: MockStore, publicId: string) =>
  store.calculations.get(publicId);

export const routes: Route[] = [
  { method: 'GET', pattern: /^\/health$/, reply: () => ok({ status: 'ok' }) },
  {
    method: 'GET',
    pattern: /^\/public\/pricing-data$/,
    reply: () => ok(makeE2ePricingData()),
  },
  {
    method: 'GET',
    pattern: /^\/public\/styles$/,
    reply: () => ok(makeStyles()),
  },
  {
    method: 'GET',
    pattern: /^\/public\/room-types$/,
    reply: () => ok(makeRoomTypes()),
  },
  {
    method: 'GET',
    pattern: /^\/public\/engineering$/,
    reply: () => ok(makeEngineering()),
  },
  {
    method: 'GET',
    pattern: /^\/public\/categories\/([^/]+)\/products$/,
    reply: ([, categoryId]) => ok(makeCategoryProducts(categoryId)),
  },
  {
    method: 'GET',
    pattern: /^\/public\/products\/([^/]+)$/,
    reply: ([, productId]) => ok(makeProductDetails(productId)),
  },
  {
    method: 'GET',
    pattern: /^\/public\/styles\/([^/]+)\/default-materials$/,
    reply: ([, styleId]) => ok(makeDefaultMaterials(styleId)),
  },
  {
    method: 'GET',
    pattern: /^\/public\/leads\/form-settings$/,
    reply: () => ok(makeLeadFormSettings()),
  },
  {
    method: 'GET',
    pattern: /^\/public\/calculations\/([^/]+)$/,
    reply: ([, publicId], { store }) => {
      const version = lookup(store, publicId);
      return version ? ok(version) : notFound();
    },
  },
  {
    method: 'GET',
    pattern: /^\/public\/calculations\/([^/]+)\/versions\/(\d+)$/,
    reply: ([, publicId, number], { store }) => {
      const version = lookup(store, publicId);
      return version && String(version.number) === number
        ? ok(version)
        : notFound();
    },
  },
  {
    method: 'POST',
    pattern: /^\/public\/calculations$/,
    reply: (_match, { store }) => {
      const publicId = makeVersionView().publicId;
      const saved = makeSaveCalculationResponse();
      store.calculations.set(publicId, saved.version);
      return { status: 201, body: saved };
    },
  },
  {
    method: 'POST',
    pattern: /^\/public\/leads$/,
    reply: (_match, { store }) => {
      store.leadCount += 1;
      return {
        status: 201,
        body: makeLeadCreated({ leadNumber: store.leadCount }),
      };
    },
  },
];
