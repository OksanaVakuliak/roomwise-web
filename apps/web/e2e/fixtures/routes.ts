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
import { makeSurfaceProducts } from '@/test/fixtures/catalog';
import {
  type AdminState,
  addMockLead,
  adminRoutes,
  asBody,
  createAdminState,
  type Session,
} from './admin-routes';

export type Json = unknown;

export type MockReply = {
  status?: number;
  body?: Json;
  etag?: boolean;
  headers?: Record<string, string>;
};

export type MockStore = {
  calculations: Map<string, VersionView>;
  idempotent: Map<string, MockReply>;
  admin: AdminState;
};

export function createMockStore(): MockStore {
  return {
    calculations: new Map(),
    idempotent: new Map(),
    admin: createAdminState(),
  };
}

export type RouteContext = {
  store: MockStore;
  url: URL;
  body: unknown;
  session: Session | null;
};

export type Route = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  pattern: RegExp;
  reply: (match: RegExpMatchArray, context: RouteContext) => MockReply;
};

const ok = (body: Json): MockReply => ({ status: 200, body, etag: true });

const notFound = (): MockReply => ({
  status: 404,
  body: { error: { code: 'NOT_FOUND' } },
});

export const TEXTURE_ORIGIN = 'https://cdn.test';

const withSurface = (productId: string) =>
  Object.values(makeSurfaceProducts()).find(
    (product) => product.id === productId,
  ) ?? makeProductDetails(productId);

const lookup = (store: MockStore, publicId: string) =>
  store.calculations.get(publicId);

const nonEmptyString = (value: unknown) =>
  typeof value === 'string' && value !== '' ? value : null;

const calculationRefOf = (value: unknown) => {
  const { publicId, versionNumber } = asBody(value);
  return typeof publicId === 'string' && typeof versionNumber === 'number'
    ? { publicId, versionNumber }
    : null;
};

export const routes: Route[] = [
  ...adminRoutes,
  { method: 'GET', pattern: /^\/health$/, reply: () => ok({ status: 'ok' }) },
  {
    method: 'GET',
    pattern: /^\/public\/pricing-data$/,
    reply: () => ok(makePricingData()),
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
    reply: ([, productId]) => ok(withSurface(productId)),
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
    reply: (_match, { store, body }) => {
      const input = asBody(body);
      const reference = calculationRefOf(input.calculation);
      const version = reference ? lookup(store, reference.publicId) : undefined;
      const resolved = version?.number === reference?.versionNumber;
      const draft = asBody(input.draft);
      const lead = addMockLead(store, {
        name: String(input.name ?? ''),
        phone: String(input.phone ?? ''),
        email: nonEmptyString(input.email),
        comment: nonEmptyString(input.comment),
        locale: input.locale === 'uk' ? 'uk' : 'en',
        consentText: String(asBody(input.consent).text ?? ''),
        ...(typeof draft.clientTotalUsdCents === 'number'
          ? { totalUsdCents: draft.clientTotalUsdCents }
          : {}),
        ...(version && resolved
          ? {
              calculation: version,
              totalUsdCents: version.totals.usdCents,
              expiredAtSubmission: version.expired,
            }
          : {}),
      });
      return {
        status: 201,
        body: makeLeadCreated({
          leadNumber: lead.number,
          ...(reference ? { calculation: reference } : {}),
        }),
      };
    },
  },
];
