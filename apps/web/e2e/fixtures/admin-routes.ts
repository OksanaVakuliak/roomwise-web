import {
  type Actor,
  type AdminCategory,
  type AdminCoefficient,
  type AdminExchangeRate,
  type AdminFailure,
  type AdminLead,
  type AdminLeadNote,
  type AdminMaterialType,
  type AdminOption,
  type AdminPackageItem,
  type AdminProduct,
  type AdminRoomType,
  type AdminRule,
  type AdminSettings,
  type AdminStyle,
  type AdminStylePair,
  adminActor,
  adminErrors,
  adminIds,
  adminUuid,
  makeAdminCategories,
  makeAdminCategory,
  makeAdminCoefficient,
  makeAdminCoefficients,
  makeAdminImageRef,
  makeAdminLead,
  makeAdminLeadDetails,
  makeAdminLeadRow,
  makeAdminMaterialType,
  makeAdminMaterialTypes,
  makeAdminMe,
  makeAdminOption,
  makeAdminOptions,
  makeAdminPackageItem,
  makeAdminPackageItems,
  makeAdminProduct,
  makeAdminProductRow,
  makeAdminRoomTypes,
  makeAdminRule,
  makeAdminRules,
  makeAdminSettings,
  makeAdminStyle,
  makeAdminStyleRow,
  makeAdminStyles,
  makeArchivedProduct,
  makeDemoMe,
  makeDraftProductWithoutUk,
  makeManualExchangeRate,
  makeNbuExchangeRate,
  makeProductInStyle,
  makeTexturedProduct,
  type Stamp,
} from '@/test/fixtures';
import type { MockReply, MockStore, Route, RouteContext } from './routes';

export type Session = 'admin' | 'demo';

export const SESSION_COOKIE = 'rw_session';

export const mockCredentials = {
  admin: { login: 'admin', password: 'admin-password' },
  demo: { login: 'demo', password: 'demo-password' },
} as const;

const sessionValues: Record<Session, string> = {
  admin: 'mock-admin-session',
  demo: 'mock-demo-session',
};

export const sessionValue = (role: Session) => sessionValues[role];

export function sessionFromCookie(header: string | undefined): Session | null {
  const found = header
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === SESSION_COOKIE);
  return (
    (Object.keys(sessionValues) as Session[]).find(
      (role) => sessionValues[role] === found?.[1],
    ) ?? null
  );
}

type Versioned = Stamp & { id: string };
type Body = Record<string, unknown>;

export type StyleRecord = Omit<
  AdminStyle,
  'pairs' | 'unfilledCount' | 'unavailableCount'
> & { defaults: Record<string, string> };

export type AdminState = {
  seed: number;
  imageSizes: Record<string, number | null>;
  roomTypes: AdminRoomType[];
  categories: AdminCategory[];
  materialTypes: AdminMaterialType[];
  products: AdminProduct[];
  styles: StyleRecord[];
  packageItems: AdminPackageItem[];
  options: AdminOption[];
  rules: AdminRule[];
  coefficients: AdminCoefficient[];
  exchangeRate: AdminExchangeRate;
  settings: AdminSettings;
  leads: AdminLead[];
};

const pairKey = (roomTypeId: string, categoryId: string) =>
  `${roomTypeId}:${categoryId}`;

const seedDefaults: Record<string, Record<string, string>> = {
  [adminIds.styles.modern]: {
    [pairKey(adminIds.roomTypes.LIVING_ROOM, adminIds.categories.flooring)]:
      adminIds.products.laminate,
    [pairKey(adminIds.roomTypes.LIVING_ROOM, adminIds.categories.wallFinish)]:
      adminIds.products.inStyle,
    [pairKey(adminIds.roomTypes.BEDROOM, adminIds.categories.flooring)]:
      adminIds.products.archived,
  },
  [adminIds.styles.classic]: {
    [pairKey(adminIds.roomTypes.LIVING_ROOM, adminIds.categories.flooring)]:
      adminIds.products.laminate,
  },
};

const styleRecord = (
  style: AdminStyle,
  defaults: Record<string, string> = {},
): StyleRecord => {
  const {
    pairs: _pairs,
    unfilledCount: _unfilled,
    unavailableCount: _unavailable,
    ...rest
  } = style;
  return { ...rest, defaults };
};

export function createAdminState(): AdminState {
  const styles = makeAdminStyles().items.map((row) =>
    styleRecord(
      makeAdminStyle({
        id: row.id,
        name: row.name,
        description: row.description,
        image: row.image,
        status: row.status,
        sortOrder: row.sortOrder,
        revision: row.revision,
        updatedAt: row.updatedAt,
        updatedBy: row.updatedBy,
      }),
      seedDefaults[row.id],
    ),
  );
  const products = [
    makeAdminProduct(),
    makeDraftProductWithoutUk(),
    makeTexturedProduct(),
    makeArchivedProduct(),
    makeProductInStyle(),
  ];
  return {
    seed: 20000,
    imageSizes: {
      ...Object.fromEntries(
        Object.values(adminIds.images).map((id) => [id, null]),
      ),
      ...Object.fromEntries(
        products.flatMap(({ texture }) =>
          texture ? [[texture.id, texture.realSizeMm]] : [],
        ),
      ),
    },
    roomTypes: makeAdminRoomTypes().items,
    categories: makeAdminCategories().items,
    materialTypes: makeAdminMaterialTypes().items,
    products,
    styles,
    packageItems: makeAdminPackageItems().items,
    options: makeAdminOptions().items,
    rules: makeAdminRules().items,
    coefficients: makeAdminCoefficients().items,
    exchangeRate: makeNbuExchangeRate(),
    settings: makeAdminSettings(),
    leads: makeAdminLeadDetails(),
  };
}

export function addMockLead(
  store: MockStore,
  overrides: Partial<AdminLead> = {},
): AdminLead {
  const { leads } = store.admin;
  const number = Math.max(0, ...leads.map((lead) => lead.number)) + 1;
  const id = adminUuid(++store.admin.seed);
  const now = new Date().toISOString();
  const lead = makeAdminLead({
    id,
    number,
    createdAt: now,
    consentAt: now,
    status: 'NEW',
    statusHistory: [
      { fromStatus: null, toStatus: 'NEW', changedAt: now, changedBy: null },
    ],
    ...overrides,
  });
  leads.push(lead);
  return lead;
}

type Guarded = RouteContext & { session: Session };
type Handler = (match: RegExpMatchArray, context: Guarded) => MockReply;

const failure = ({ status, body }: AdminFailure): MockReply => ({
  status,
  body,
});

const notFound = (): MockReply => ({
  status: 404,
  body: { error: { code: 'NOT_FOUND' } },
});

const LEAD_STATUSES = ['NEW', 'IN_PROGRESS', 'DONE', 'REJECTED', 'SPAM'];
const PUBLICATION_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const SEARCH_MAX = 100;
const REAL_SIZE_MAX = 10_000;
const INVALID = Symbol('invalid');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const searchTerm = (url: URL): string | typeof INVALID => {
  const raw = url.searchParams.get('q');
  if (raw === null) {
    return '';
  }
  const term = raw.trim();
  return term.length === 0 || term.length > SEARCH_MAX ? INVALID : term;
};

const realSizeOf = (value: unknown): number | null | typeof INVALID =>
  value === null ||
  (Number.isInteger(value) &&
    Number(value) > 0 &&
    Number(value) <= REAL_SIZE_MAX)
    ? (value as number | null)
    : INVALID;

const multipartField = (raw: string | null, name: string) =>
  raw?.match(new RegExp(`name="${name}"\\r?\\n\\r?\\n([^\\r\\n]*)`))?.[1];

const mockImage = (id: string, realSizeMm: number | null) => ({
  ...makeAdminImageRef(id),
  texture: `https://res.cloudinary.example.com/roomwise/${id}/texture.webp`,
  width: 1200,
  height: 800,
  realSizeMm,
});

export const asBody = (value: unknown): Body =>
  typeof value === 'object' && value !== null ? (value as Body) : {};

const secured =
  (handler: Handler): Route['reply'] =>
  (match, context) =>
    context.session
      ? handler(match, { ...context, session: context.session })
      : failure(adminErrors.unauthenticated());

const denyDemo =
  (action: string, handler: Handler): Handler =>
  (match, context) =>
    context.session === 'demo'
      ? failure(adminErrors.demoForbidden(action))
      : handler(match, context);

const actorOf = (session: Session): Actor =>
  session === 'admin' ? adminActor : { id: adminIds.demo, login: 'demo' };

const stamped = <T extends Versioned>(
  item: T,
  state: AdminState,
  session: Session,
): T => ({
  ...item,
  revision: adminUuid(++state.seed),
  updatedAt: new Date().toISOString(),
  updatedBy: actorOf(session),
});

const isStale = (item: { revision: string }, body: Body) =>
  body.revision !== item.revision;

const englishName = (body: Body) =>
  (body.name as { en?: string } | undefined)?.en?.trim();

const blankName = (body: Body) => body.name !== undefined && !englishName(body);

const hasMissingTranslation = (item: object) =>
  Object.values(item).some(
    (value) =>
      typeof value === 'object' &&
      value !== null &&
      'en' in value &&
      'uk' in value &&
      (!String(value.en).trim() || !String(value.uk).trim()),
  );

const pageOf = <T>(items: T[], url: URL) => {
  const page = Number(url.searchParams.get('page') ?? 1);
  const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
  };
};

const lowerIncludes = (value: string, term: string) =>
  value.toLowerCase().includes(term.toLowerCase());

const withoutKeys = (body: Body, keys: string[]) =>
  Object.fromEntries(
    Object.entries(body).filter(([key]) => !keys.includes(key)),
  );

type Resource<T extends Versioned> = {
  path: string;
  collection: (state: AdminState) => T[];
  build: (body: Body, id: string, state: AdminState) => T;
  merge?: (body: Body, current: T) => Partial<T>;
  row?: (item: T, state: AdminState) => unknown;
  view?: (item: T, state: AdminState) => unknown;
  listExtra?: (state: AdminState) => object;
  inUse?: (item: T, state: AdminState) => AdminFailure | null;
  readOne?: boolean;
  customList?: boolean;
  noDelete?: boolean;
  withStatus?: boolean;
  orderKey?: 'ids' | 'styleIds';
};

const sortOrderOf = (item: object) =>
  'sortOrder' in item ? Number(item.sortOrder) : null;

function crud<T extends Versioned>(resource: Resource<T>): Route[] {
  const base = `/admin/${resource.path}`;
  const one = new RegExp(`^${base}/([^/]+)$`);
  const view = (item: T, state: AdminState) =>
    resource.view ? resource.view(item, state) : item;
  const row = (item: T, state: AdminState) =>
    resource.row ? resource.row(item, state) : view(item, state);
  const find = (state: AdminState, id: string) =>
    resource.collection(state).find((item) => item.id === id);
  const replace = (state: AdminState, next: T) => {
    const items = resource.collection(state);
    items[items.findIndex((item) => item.id === next.id)] = next;
  };

  const routes: Route[] = [
    {
      method: 'POST',
      pattern: new RegExp(`^${base}$`),
      reply: secured((_match, { store, body, session }) => {
        const input = asBody(body);
        if (!englishName(input)) {
          return failure(adminErrors.validation());
        }
        const { admin } = store;
        const items = resource.collection(admin);
        const id = adminUuid(++admin.seed);
        const built = resource.build(input, id, admin);
        const order =
          Math.max(-1, ...items.map((item) => sortOrderOf(item) ?? -1)) + 1;
        const ordered =
          sortOrderOf(built) === null ? built : { ...built, sortOrder: order };
        const created = stamped(ordered, admin, session);
        items.push(created);
        return { status: 201, body: view(created, admin) };
      }),
    },
    {
      method: 'PATCH',
      pattern: one,
      reply: secured(([, id], { store, body, session }) => {
        const input = asBody(body);
        const current = find(store.admin, id);
        if (!current) {
          return notFound();
        }
        if (isStale(current, input)) {
          return failure(adminErrors.staleRevision());
        }
        if (blankName(input)) {
          return failure(adminErrors.validation());
        }
        const fields =
          resource.merge?.(input, current) ??
          (withoutKeys(input, [
            'id',
            'revision',
            'confirmZeroPrice',
          ]) as Partial<T>);
        const merged = { ...current, ...fields };
        const updated = stamped(merged, store.admin, session);
        replace(store.admin, updated);
        return { body: view(updated, store.admin) };
      }),
    },
  ];

  if (!resource.customList) {
    routes.push({
      method: 'GET',
      pattern: new RegExp(`^${base}$`),
      reply: secured((_match, { store }) => {
        const items = [...resource.collection(store.admin)].sort(
          (a, b) => (sortOrderOf(a) ?? 0) - (sortOrderOf(b) ?? 0),
        );
        return {
          body: {
            items: items.map((item) => row(item, store.admin)),
            ...resource.listExtra?.(store.admin),
          },
        };
      }),
    });
  }

  if (!resource.noDelete) {
    routes.push({
      method: 'DELETE',
      pattern: one,
      reply: secured(([, id], { store }) => {
        const current = find(store.admin, id);
        if (!current) {
          return notFound();
        }
        const blocked = resource.inUse?.(current, store.admin);
        if (blocked) {
          return failure(blocked);
        }
        const items = resource.collection(store.admin);
        items.splice(items.indexOf(current), 1);
        return { status: 204 };
      }),
    });
  }

  if (resource.readOne) {
    routes.push({
      method: 'GET',
      pattern: one,
      reply: secured(([, id], { store }) => {
        const current = find(store.admin, id);
        return current ? { body: view(current, store.admin) } : notFound();
      }),
    });
  }

  if (resource.withStatus) {
    routes.push({
      method: 'POST',
      pattern: new RegExp(`^${base}/([^/]+)/status$`),
      reply: secured(([, id], { store, body, session }) => {
        const input = asBody(body);
        const current = find(store.admin, id);
        if (!current) {
          return notFound();
        }
        if (isStale(current, input)) {
          return failure(adminErrors.staleRevision());
        }
        if (input.status === 'PUBLISHED' && hasMissingTranslation(current)) {
          return failure(adminErrors.translationMissing());
        }
        const updated = stamped(
          { ...current, status: input.status },
          store.admin,
          session,
        );
        replace(store.admin, updated);
        return { body: view(updated, store.admin) };
      }),
    });
  }

  if (resource.orderKey) {
    const key = resource.orderKey;
    routes.push({
      method: 'PUT',
      pattern: new RegExp(`^${base}/order$`),
      reply: secured((_match, { store, body }) => {
        const input = asBody(body);
        const ids = (input[key] as string[] | undefined) ?? [];
        const items = resource.collection(store.admin);
        const kind = input.kind;
        const scope = items.filter(
          (item) =>
            kind === undefined || (item as { kind?: unknown }).kind === kind,
        );
        const slots = scope
          .map((item) => sortOrderOf(item) ?? 0)
          .sort((a, b) => a - b);
        ids.forEach((id, index) => {
          const position = items.findIndex((item) => item.id === id);
          if (position !== -1) {
            items[position] = {
              ...items[position],
              sortOrder: slots[index] ?? index,
            };
          }
        });
        return { status: 204 };
      }),
    });
  }

  return routes;
}

const isoDay = () => new Date().toISOString().slice(0, 10);

const imageRefs = (images: unknown) =>
  (images as { imageId: string; isPrimary: boolean }[] | undefined)?.map(
    ({ imageId, isPrimary }) => ({ ...makeAdminImageRef(imageId), isPrimary }),
  );

const textureOf = (body: Body, fallback: AdminProduct['texture']) => {
  if (!('textureImageId' in body)) {
    return fallback;
  }
  const id = body.textureImageId as string | null;
  return id
    ? {
        id,
        url: `https://res.cloudinary.example.com/roomwise/${id}/texture.webp`,
        previewUrl: `https://res.cloudinary.example.com/roomwise/${id}/preview.webp`,
        realSizeMm: null,
      }
    : null;
};

const productFields = (body: Body, current: AdminProduct | null) => ({
  ...withoutKeys(body, [
    'id',
    'revision',
    'confirmZeroPrice',
    'images',
    'textureImageId',
  ]),
  ...(body.images ? { images: imageRefs(body.images) } : {}),
  texture: textureOf(body, current?.texture ?? null),
});

const stylesWhere = (
  state: AdminState,
  uses: (pair: AdminStyle['pairs'][number]) => boolean,
) =>
  state.styles
    .filter((style) => stylePairsOf(style, state).some(uses))
    .map(({ id, name }) => ({ id, name }));

const stylePairsOf = (
  style: StyleRecord,
  state: AdminState,
): AdminStylePair[] =>
  state.roomTypes.flatMap((roomType) =>
    roomType.categories.flatMap(({ id: categoryId }): AdminStylePair[] => {
      const category = state.categories.find((item) => item.id === categoryId);
      if (!category) {
        return [];
      }
      const product = state.products.find(
        (item) => item.id === style.defaults[pairKey(roomType.id, categoryId)],
      );
      const base = {
        roomTypeCode: roomType.code,
        roomTypeId: roomType.id,
        categoryId,
        categoryName: category.name,
      };
      if (!product) {
        return [
          {
            ...base,
            productId: null,
            productName: null,
            state: 'EMPTY' as const,
          },
        ];
      }
      const available =
        product.status === 'PUBLISHED' && product.categoryId === categoryId;
      return [
        {
          ...base,
          productId: product.id,
          productName: product.name,
          state: available
            ? ('FILLED' as const)
            : ('PRODUCT_UNAVAILABLE' as const),
        },
      ];
    }),
  );

const styleView = (style: StyleRecord, state: AdminState): AdminStyle => {
  const { defaults: _defaults, ...rest } = style;
  const pairs = stylePairsOf(style, state);
  return {
    ...rest,
    pairs,
    unfilledCount: pairs.filter((pair) => pair.state === 'EMPTY').length,
    unavailableCount: pairs.filter(
      (pair) => pair.state === 'PRODUCT_UNAVAILABLE',
    ).length,
  };
};

const categoryView = (
  item: AdminCategory,
  state: AdminState,
): AdminCategory => ({
  ...item,
  productCount: state.products.filter(
    (product) => product.categoryId === item.id,
  ).length,
});

const roomTypeView = (
  item: AdminRoomType,
  state: AdminState,
): AdminRoomType => ({
  ...item,
  categories: item.categories.flatMap(({ id }) => {
    const category = state.categories.find((entry) => entry.id === id);
    return category
      ? [
          {
            id,
            name: category.name,
            status: category.status,
            surface: category.surface,
          },
        ]
      : [];
  }),
});

const formulaKeys = (item: AdminRule) =>
  [item.quantityFormula, item.costFormula, item.laborFormula].flatMap(
    (formula) => formula?.match(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g) ?? [],
  );

const coefficientKeysOf = (item: AdminRule, state: AdminState) => {
  const known = new Set(
    state.coefficients.map((coefficient) => coefficient.key),
  );
  return [...new Set(formulaKeys(item))].filter((key) => known.has(key));
};

const withUsage = (item: AdminCoefficient, state: AdminState) => ({
  ...item,
  usedBy: state.rules
    .filter((rule) => formulaKeys(rule).includes(item.key))
    .map((rule) => ({ ruleId: rule.id, ruleName: rule.name })),
  usedByOptions: state.options
    .filter((option) => option.priceCoefficientKeys.includes(item.key))
    .map((option) => ({ optionId: option.id, optionName: option.name })),
});

const imageOf = (imageId: unknown) =>
  typeof imageId === 'string' ? makeAdminImageRef(imageId) : null;

const catalogRoutes = (): Route[] => [
  ...crud<AdminCategory>({
    path: 'categories',
    collection: (state) => state.categories,
    build: (body, id) =>
      makeAdminCategory({
        ...(body as Partial<AdminCategory>),
        id,
        status: 'DRAFT',
        productCount: 0,
        roomTypeCodes: [],
      }),
    view: categoryView,
    withStatus: true,
    inUse: (item, state) =>
      categoryView(item, state).productCount > 0 ||
      item.roomTypeCodes.length > 0
        ? {
            status: 409,
            body: {
              error: {
                code: 'CATEGORY_IN_USE',
                params: {
                  productCount: categoryView(item, state).productCount,
                  roomTypeCodes: item.roomTypeCodes,
                  styles: stylesWhere(
                    state,
                    (pair) => pair.categoryId === item.id,
                  ),
                },
              },
            },
          }
        : null,
  }),
  ...crud<AdminMaterialType>({
    path: 'material-types',
    collection: (state) => state.materialTypes,
    build: (body, id) =>
      makeAdminMaterialType({
        ...(body as Partial<AdminMaterialType>),
        id,
        status: 'DRAFT',
      }),
    noDelete: true,
  }),
  ...crud<AdminProduct>({
    path: 'products',
    collection: (state) => state.products,
    build: (body, id) =>
      makeAdminProduct({
        ...(productFields(body, null) as Partial<AdminProduct>),
        id,
        status: 'DRAFT',
      }),
    merge: (body, current) =>
      productFields(body, current) as Partial<AdminProduct>,
    row: (item) => makeAdminProductRow(item),
    view: (item, state) =>
      item.texture
        ? {
            ...item,
            texture: {
              ...item.texture,
              realSizeMm: state.imageSizes[item.texture.id] ?? null,
            },
          }
        : item,
    readOne: true,
    customList: true,
    withStatus: true,
    inUse: (item, state) => {
      const styles = stylesWhere(state, (pair) => pair.productId === item.id);
      return styles.length
        ? {
            status: 409,
            body: { error: { code: 'PRODUCT_IN_USE', params: { styles } } },
          }
        : null;
    },
  }),
];

const productsList: Route = {
  method: 'GET',
  pattern: /^\/admin\/products$/,
  reply: secured((_match, { store, url }) => {
    const term = searchTerm(url);
    const categoryId = url.searchParams.get('categoryId');
    const status = url.searchParams.get('status');
    if (
      term === INVALID ||
      (categoryId !== null && !UUID.test(categoryId)) ||
      (status !== null && !PUBLICATION_STATUSES.includes(status))
    ) {
      return failure(adminErrors.validation());
    }
    const matching = store.admin.products
      .filter(
        (product) =>
          (!categoryId || product.categoryId === categoryId) &&
          (!status || product.status === status) &&
          (!term ||
            [product.name.en, product.name.uk, product.brand].some((value) =>
              lowerIncludes(value, term),
            )),
      )
      .sort(
        (a, b) =>
          b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id),
      );
    const { items, ...rest } = pageOf(matching, url);
    return { body: { items: items.map(makeAdminProductRow), ...rest } };
  }),
};

const roomTypeRoutes = (): Route[] => [
  {
    method: 'GET',
    pattern: /^\/admin\/room-types$/,
    reply: secured((_match, { store }) => ({
      body: {
        items: store.admin.roomTypes.map((item) =>
          roomTypeView(item, store.admin),
        ),
      },
    })),
  },
  {
    method: 'PATCH',
    pattern: /^\/admin\/room-types\/([^/]+)$/,
    reply: secured(([, id], { store, body, session }) => {
      const input = asBody(body);
      const { admin } = store;
      const current = admin.roomTypes.find((item) => item.id === id);
      if (!current) {
        return notFound();
      }
      if (isStale(current, input)) {
        return failure(adminErrors.staleRevision());
      }
      if (blankName(input)) {
        return failure(adminErrors.validation());
      }
      const updated = stamped(
        {
          ...current,
          name:
            'name' in input
              ? (input.name as AdminRoomType['name'])
              : current.name,
        },
        admin,
        session,
      );
      admin.roomTypes[admin.roomTypes.indexOf(current)] = updated;
      return { body: roomTypeView(updated, admin) };
    }),
  },
  {
    method: 'PUT',
    pattern: /^\/admin\/room-types\/([^/]+)\/categories$/,
    reply: secured(([, id], { store, body, session }) => {
      const input = asBody(body);
      const { admin } = store;
      const current = admin.roomTypes.find((item) => item.id === id);
      if (!current) {
        return notFound();
      }
      if (isStale(current, input)) {
        return failure(adminErrors.staleRevision());
      }
      const ids = (input.categoryIds as string[] | undefined) ?? [];
      const categories = ids.flatMap((categoryId) => {
        const category = admin.categories.find(
          (item) => item.id === categoryId,
        );
        return category
          ? [
              {
                id: category.id,
                name: category.name,
                status: category.status,
                surface: category.surface,
              },
            ]
          : [];
      });
      admin.categories = admin.categories.map((category) => {
        const without = category.roomTypeCodes.filter(
          (code) => code !== current.code,
        );
        return {
          ...category,
          roomTypeCodes: ids.includes(category.id)
            ? [...without, current.code]
            : without,
        };
      });
      const updated = stamped({ ...current, categories }, admin, session);
      admin.roomTypes[admin.roomTypes.indexOf(current)] = updated;
      return { body: roomTypeView(updated, admin) };
    }),
  },
];

const styleRoutes = (): Route[] => [
  ...crud<StyleRecord>({
    path: 'styles',
    collection: (state) => state.styles,
    build: (body, id) =>
      styleRecord(
        makeAdminStyle({
          ...(withoutKeys(body, ['imageId']) as Partial<AdminStyle>),
          id,
          status: 'DRAFT',
          image: imageOf(body.imageId),
        }),
      ),
    merge: (body) =>
      ({
        ...withoutKeys(body, ['id', 'revision', 'imageId']),
        ...('imageId' in body ? { image: imageOf(body.imageId) } : {}),
      }) as Partial<StyleRecord>,
    view: styleView,
    row: (item, state) => makeAdminStyleRow(styleView(item, state)),
    readOne: true,
    withStatus: true,
    orderKey: 'styleIds',
  }),
  {
    method: 'PUT',
    pattern: /^\/admin\/styles\/([^/]+)\/default-materials$/,
    reply: secured(([, id], { store, body, session }) => {
      const input = asBody(body);
      const { admin } = store;
      const current = admin.styles.find((item) => item.id === id);
      if (!current) {
        return notFound();
      }
      if (isStale(current, input)) {
        return failure(adminErrors.staleRevision());
      }
      const items =
        (input.items as
          | {
              roomTypeId: string;
              categoryId: string;
              productId: string | null;
            }[]
          | undefined) ?? [];
      const defaults = new Map(Object.entries(current.defaults));
      for (const item of items) {
        const key = pairKey(item.roomTypeId, item.categoryId);
        if (item.productId) {
          defaults.set(key, item.productId);
        } else {
          defaults.delete(key);
        }
      }
      const updated = stamped(
        { ...current, defaults: Object.fromEntries(defaults) },
        admin,
        session,
      );
      admin.styles[admin.styles.indexOf(current)] = updated;
      return { body: styleView(updated, admin) };
    }),
  },
];

const engineeringRoutes = (): Route[] => [
  ...crud<AdminPackageItem>({
    path: 'engineering/package-items',
    collection: (state) => state.packageItems,
    build: (body, id) =>
      makeAdminPackageItem({
        ...(body as Partial<AdminPackageItem>),
        id,
        status: 'DRAFT',
      }),
    withStatus: true,
    orderKey: 'ids',
  }),
  ...crud<AdminOption>({
    path: 'options',
    collection: (state) => state.options,
    build: (body, id) =>
      makeAdminOption({
        ...(withoutKeys(body, [
          'imageId',
          'confirmZeroPrice',
        ]) as Partial<AdminOption>),
        id,
        code: null,
        status: 'DRAFT',
        image: imageOf(body.imageId),
      }),
    merge: (body) =>
      ({
        ...withoutKeys(body, ['id', 'revision', 'imageId', 'confirmZeroPrice']),
        ...('imageId' in body ? { image: imageOf(body.imageId) } : {}),
      }) as Partial<AdminOption>,
    readOne: true,
    withStatus: true,
    orderKey: 'ids',
  }),
];

const pricingRoutes = (): Route[] => [
  ...crud<AdminRule>({
    path: 'pricing/rules',
    collection: (state) => state.rules,
    build: (body, id) =>
      makeAdminRule({ ...(body as Partial<AdminRule>), id, orphaned: false }),
    view: (item, state) => ({
      ...item,
      coefficientKeys: coefficientKeysOf(item, state),
    }),
    listExtra: (state) => ({
      categoriesWithoutRule: state.categories
        .filter(
          (category) =>
            !state.rules.some(
              (rule) =>
                rule.level === 'CATEGORY' &&
                !rule.orphaned &&
                rule.categoryId === category.id,
            ),
        )
        .map(({ id, name }) => ({ id, name }))
        .sort(
          (a, b) =>
            a.name.en.localeCompare(b.name.en) || a.id.localeCompare(b.id),
        ),
    }),
    orderKey: 'ids',
  }),
  ...crud<AdminCoefficient>({
    path: 'pricing/coefficients',
    collection: (state) => state.coefficients,
    build: (body, id) =>
      makeAdminCoefficient({
        ...(body as Partial<AdminCoefficient>),
        id,
        usedBy: [],
        usedByOptions: [],
      }),
    view: (item, state) => withUsage(item, state),
    inUse: (item, state) => {
      const { usedBy, usedByOptions } = withUsage(item, state);
      return usedBy.length || usedByOptions.length
        ? {
            status: 409,
            body: {
              error: {
                code: 'COEFFICIENT_IN_USE',
                params: { rules: usedBy, options: usedByOptions },
              },
            },
          }
        : null;
    },
  }),
  {
    method: 'POST',
    pattern: /^\/admin\/pricing\/formulas\/validate$/,
    reply: secured((_match, { body }) => {
      const input = asBody(body);
      const known = new Set<string>();
      const errors = (['quantity', 'cost', 'labor'] as const).flatMap(
        (kind) => {
          const formula = input[`${kind}Formula`];
          if (typeof formula !== 'string') {
            return [];
          }
          const found: {
            formula: typeof kind;
            code: string;
            position: number;
            length: number;
            params?: Record<string, string | number>;
          }[] = [];
          let depth = 0;
          formula.split('').forEach((char, index) => {
            depth += char === '(' ? 1 : char === ')' ? -1 : 0;
            if (depth < 0 && found.length === 0) {
              found.push({
                formula: kind,
                code: 'UNEXPECTED_TOKEN',
                position: index,
                length: 1,
              });
            }
          });
          if (depth > 0 && found.length === 0) {
            found.push({
              formula: kind,
              code: 'UNEXPECTED_END',
              position: formula.length,
              length: 0,
            });
          }
          for (const match of formula.matchAll(
            /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g,
          )) {
            known.add(match[0]);
          }
          return found;
        },
      );
      return {
        body: {
          valid: errors.length === 0,
          coefficientKeys: [...known],
          errors,
        },
      };
    }),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/pricing\/rules\/preview$/,
    reply: secured((_match, { body }) => {
      const sample = asBody(asBody(body).sample) as {
        room?: { lengthM: number; widthM: number; heightM: number };
        product?: { priceCents: number };
      };
      const area = sample.room
        ? sample.room.lengthM * sample.room.widthM
        : null;
      return {
        body: {
          quantity: area,
          amountCents:
            area === null
              ? null
              : Math.round(area * (sample.product?.priceCents ?? 100)),
          laborCents:
            asBody(body).laborFormula && area !== null
              ? Math.round(area * 50)
              : null,
          variables: area === null ? {} : { surfaceArea: area },
          coefficients: {},
          error: null,
        },
      };
    }),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/pricing\/exchange-rate$/,
    reply: secured((_match, { store }) => ({ body: store.admin.exchangeRate })),
  },
  {
    method: 'PUT',
    pattern: /^\/admin\/pricing\/exchange-rate\/manual$/,
    reply: secured((_match, { store, body }) => {
      const rate = asBody(body).rate;
      if (typeof rate !== 'string' || !(Number(rate) > 0)) {
        return failure(adminErrors.validation());
      }
      const entry = { rate, date: isoDay() };
      store.admin.exchangeRate = makeManualExchangeRate({
        ...store.admin.exchangeRate,
        active: { ...entry, source: 'MANUAL' },
        manual: entry,
      });
      return { body: store.admin.exchangeRate };
    }),
  },
  {
    method: 'DELETE',
    pattern: /^\/admin\/pricing\/exchange-rate\/manual$/,
    reply: secured((_match, { store }) => {
      const { official } = store.admin.exchangeRate;
      store.admin.exchangeRate = {
        ...store.admin.exchangeRate,
        active: official ? { ...official, source: 'NBU' } : null,
        manual: null,
      };
      return { body: store.admin.exchangeRate };
    }),
  },
];

const maskName = (name: string) => `${Array.from(name.trim())[0] ?? ''}•••`;

const maskEmail = (email: string) => {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');
  const local = at === -1 ? trimmed : trimmed.slice(0, at);
  const domain = at === -1 ? '' : trimmed.slice(at + 1);
  return `${maskName(local)}@•••.${domain.split('.').pop() ?? ''}`;
};

const maskLead = (lead: AdminLead): AdminLead => ({
  ...lead,
  name: maskName(lead.name),
  phone: `+${lead.phone.match(/^\+(\d{1,3})/)?.[1] ?? ''}•••${lead.phone.replace(/\D/g, '').slice(-2)}`,
  email: lead.email ? maskEmail(lead.email) : null,
  comment: null,
  masked: true,
});

const leadView = (lead: AdminLead, session: Session) =>
  session === 'demo' ? maskLead(lead) : lead;

const leadRoutes = (): Route[] => [
  {
    method: 'GET',
    pattern: /^\/admin\/leads$/,
    reply: secured((_match, { store, url, session }) => {
      const term = searchTerm(url);
      const status = url.searchParams.get('status');
      if (
        term === INVALID ||
        (status !== null && !LEAD_STATUSES.includes(status))
      ) {
        return failure(adminErrors.validation());
      }
      const digits = term.replace(/\D/g, '');
      const fullSearch = session !== 'demo';
      const matching = store.admin.leads
        .filter(
          (lead) =>
            (status !== null
              ? lead.status === status
              : lead.status !== 'SPAM') &&
            (!term ||
              (fullSearch && lowerIncludes(lead.name, term)) ||
              (fullSearch &&
                digits !== '' &&
                lead.phone.replace(/\D/g, '').includes(digits)) ||
              (/^\d+$/.test(term) && lead.number === Number(term))),
        )
        .map((lead) => leadView(lead, session))
        .sort(
          (a, b) =>
            b.createdAt.localeCompare(a.createdAt) || b.number - a.number,
        );
      const { items, ...rest } = pageOf(matching, url);
      return {
        body: {
          items: items.map(makeAdminLeadRow),
          ...rest,
        },
      };
    }),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/leads\/([^/]+)$/,
    reply: secured(([, id], { store, session }) => {
      const lead = store.admin.leads.find((item) => item.id === id);
      return lead ? { body: leadView(lead, session) } : notFound();
    }),
  },
  {
    method: 'DELETE',
    pattern: /^\/admin\/leads\/([^/]+)$/,
    reply: secured(
      denyDemo('lead-delete', ([, id], { store }) => {
        const { leads } = store.admin;
        const index = leads.findIndex((item) => item.id === id);
        if (index === -1) {
          return notFound();
        }
        leads.splice(index, 1);
        return { status: 204 };
      }),
    ),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/leads\/([^/]+)\/status$/,
    reply: secured(
      denyDemo('lead-status', ([, id], { store, body, session }) => {
        const input = asBody(body);
        const { admin } = store;
        const lead = admin.leads.find((item) => item.id === id);
        if (!lead) {
          return notFound();
        }
        if (isStale(lead, input as Body)) {
          return failure(adminErrors.staleRevision());
        }
        const status = input.status as AdminLead['status'];
        const updated: AdminLead = {
          ...lead,
          status,
          revision: adminUuid(++admin.seed),
          statusHistory: [
            ...lead.statusHistory,
            {
              fromStatus: lead.status,
              toStatus: status,
              changedAt: new Date().toISOString(),
              changedBy: actorOf(session),
            },
          ],
        };
        admin.leads[admin.leads.indexOf(lead)] = updated;
        return { body: updated };
      }),
    ),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/leads\/([^/]+)\/notes$/,
    reply: secured(
      denyDemo('lead-note', ([, id], { store, body, session }) => {
        const { admin } = store;
        const lead = admin.leads.find((item) => item.id === id);
        if (!lead) {
          return notFound();
        }
        const note: AdminLeadNote = {
          id: adminUuid(++admin.seed),
          text: String(asBody(body).text ?? ''),
          createdAt: new Date().toISOString(),
          author: actorOf(session),
        };
        admin.leads[admin.leads.indexOf(lead)] = {
          ...lead,
          notes: [...lead.notes, note],
        };
        return { status: 201, body: note };
      }),
    ),
  },
];

const authRoutes = (): Route[] => [
  {
    method: 'POST',
    pattern: /^\/admin\/auth\/login$/,
    reply: (_match, { body }) => {
      const input = asBody(body);
      const role = (Object.keys(mockCredentials) as Session[]).find(
        (candidate) =>
          mockCredentials[candidate].login === input.login &&
          mockCredentials[candidate].password === input.password,
      );
      if (!role) {
        return failure(adminErrors.invalidCredentials());
      }
      return {
        body: role === 'admin' ? makeAdminMe() : makeDemoMe(),
        headers: {
          'set-cookie': `${SESSION_COOKIE}=${sessionValue(role)}; Path=/api; HttpOnly; SameSite=Strict`,
        },
      };
    },
  },
  {
    method: 'POST',
    pattern: /^\/admin\/auth\/logout$/,
    reply: () => ({
      status: 204,
      headers: {
        'set-cookie': `${SESSION_COOKIE}=; Path=/api; Max-Age=0; HttpOnly; SameSite=Strict`,
      },
    }),
  },
  {
    method: 'GET',
    pattern: /^\/admin\/auth\/me$/,
    reply: secured((_match, { session }) => ({
      body: session === 'admin' ? makeAdminMe() : makeDemoMe(),
    })),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/auth\/password$/,
    reply: secured(
      denyDemo('change-password', (_match, { body }) =>
        asBody(body).currentPassword === mockCredentials.admin.password
          ? { status: 204 }
          : failure(adminErrors.invalidCredentials()),
      ),
    ),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/images$/,
    reply: secured((_match, { store, raw }) => {
      const field = multipartField(raw, 'realSizeMm');
      const realSizeMm =
        field === undefined || field === ''
          ? null
          : /^\d+$/.test(field)
            ? realSizeOf(Number(field))
            : INVALID;
      if (realSizeMm === INVALID) {
        return failure(adminErrors.validation());
      }
      const id = adminUuid(++store.admin.seed);
      store.admin.imageSizes[id] = realSizeMm;
      return { status: 201, body: mockImage(id, realSizeMm) };
    }),
  },
  {
    method: 'PATCH',
    pattern: /^\/admin\/images\/([^/]+)$/,
    reply: secured(([, id], { store, body }) => {
      const input = asBody(body);
      const realSizeMm = realSizeOf(input.realSizeMm);
      if (
        !UUID.test(id) ||
        !('realSizeMm' in input) ||
        realSizeMm === INVALID
      ) {
        return failure(adminErrors.validation());
      }
      if (!(id in store.admin.imageSizes)) {
        return notFound();
      }
      store.admin.imageSizes[id] = realSizeMm;
      return { body: mockImage(id, realSizeMm) };
    }),
  },
];

const settingsRoutes = (): Route[] => [
  {
    method: 'GET',
    pattern: /^\/admin\/projects\/settings$/,
    reply: secured((_match, { store }) => ({ body: store.admin.settings })),
  },
  {
    method: 'PATCH',
    pattern: /^\/admin\/projects\/settings$/,
    reply: secured(
      denyDemo('projects-settings', (_match, { store, body, session }) => {
        const input = asBody(body);
        const { admin } = store;
        if (isStale(admin.settings, input)) {
          return failure(adminErrors.staleRevision());
        }
        const { id: _id, ...next } = stamped(
          { ...admin.settings, id: '' },
          admin,
          session,
        );
        admin.settings = {
          ...next,
          ...withoutKeys(input, ['revision']),
        } as AdminSettings;
        return { body: admin.settings };
      }),
    ),
  },
];

export const adminRoutes: Route[] = [
  ...authRoutes(),
  ...roomTypeRoutes(),
  ...catalogRoutes(),
  productsList,
  ...styleRoutes(),
  ...engineeringRoutes(),
  ...pricingRoutes(),
  ...settingsRoutes(),
  ...leadRoutes(),
];
