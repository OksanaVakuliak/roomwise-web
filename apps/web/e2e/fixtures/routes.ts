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
  leadCount: number;
  admin: AdminState;
};

export function createMockStore(): MockStore {
  const admin = createAdminState();
  return {
    calculations: new Map(),
    idempotent: new Map(),
    leadCount: Math.max(0, ...admin.leads.map((lead) => lead.number)),
    admin,
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
      store.leadCount += 1;
      const input = asBody(body);
      addMockLead(store, {
        number: store.leadCount,
        name: String(input.name ?? ''),
        phone: String(input.phone ?? ''),
        comment: typeof input.comment === 'string' ? input.comment : null,
      });
      return {
        status: 201,
        body: makeLeadCreated({ leadNumber: store.leadCount }),
      };
    },
  },
];
