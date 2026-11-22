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
  makeAdminStylePair,
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

export type AdminState = {
  seed: number;
  roomTypes: AdminRoomType[];
  categories: AdminCategory[];
  materialTypes: AdminMaterialType[];
  products: AdminProduct[];
  styles: AdminStyle[];
  packageItems: AdminPackageItem[];
  options: AdminOption[];
  rules: AdminRule[];
  categoriesWithoutRule: { id: string; name: AdminCategory['name'] }[];
  coefficients: AdminCoefficient[];
  exchangeRate: AdminExchangeRate;
  settings: AdminSettings;
  leads: AdminLead[];
};

const stylePairs: Record<string, AdminStyle['pairs']> = {
  [adminIds.styles.classic]: [makeAdminStylePair()],
  [adminIds.styles.draft]: [],
};

export function createAdminState(): AdminState {
  const styles = makeAdminStyles().items.map((row) =>
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
      unfilledCount: row.unfilledPairs,
      unavailableCount: row.unavailablePairs,
      ...(stylePairs[row.id] ? { pairs: stylePairs[row.id] } : {}),
    }),
  );
  const rules = makeAdminRules();
  return {
    seed: 20000,
    roomTypes: makeAdminRoomTypes().items,
    categories: makeAdminCategories().items,
    materialTypes: makeAdminMaterialTypes().items,
    products: [
      makeAdminProduct(),
      makeDraftProductWithoutUk(),
      makeTexturedProduct(),
      makeArchivedProduct(),
      makeProductInStyle(),
    ],
    styles,
    packageItems: makeAdminPackageItems().items,
    options: makeAdminOptions().items,
    rules: rules.items,
    categoriesWithoutRule: rules.categoriesWithoutRule,
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
  const lead = makeAdminLead({
    id,
    number,
    createdAt: new Date().toISOString(),
    status: 'NEW',
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

const blankName = (body: Body) => {
  const name = body.name as { en?: string } | undefined;
  return name !== undefined && !name.en?.trim();
};

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
  normalize?: (item: T, state: AdminState) => T;
  row?: (item: T, state: AdminState) => unknown;
  view?: (item: T, state: AdminState) => unknown;
  listExtra?: (state: AdminState) => object;
  inUse?: (item: T, state: AdminState) => AdminFailure | null;
  onCreate?: (item: T, state: AdminState) => void;
  onRemove?: (item: T, state: AdminState) => void;
  onUpdate?: (previous: T, next: T, state: AdminState) => void;
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
        if (blankName(input)) {
          return failure(adminErrors.validation());
        }
        const { admin } = store;
        const items = resource.collection(admin);
        const id = adminUuid(++admin.seed);
        const built = resource.build(input, id, admin);
        const order = sortOrderOf(built) === null ? null : items.length;
        const ordered = order === null ? built : { ...built, sortOrder: order };
        const created = stamped(
          resource.normalize?.(ordered, admin) ?? ordered,
          admin,
          session,
        );
        items.push(created);
        resource.onCreate?.(created, admin);
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
        const updated = stamped(
          resource.normalize?.(merged, store.admin) ?? merged,
          store.admin,
          session,
        );
        replace(store.admin, updated);
        resource.onUpdate?.(current, updated, store.admin);
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
        resource.onRemove?.(current, store.admin);
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
        realSizeMm: Number(body.tileWidthMm ?? 600),
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
    .filter((style) => style.pairs.some(uses))
    .map(({ id, name }) => ({ id, name }));

const coefficientKeysOf = (item: AdminRule, state: AdminState) => {
  const formulas = [item.quantityFormula, item.costFormula, item.laborFormula];
  const known = new Set(
    state.coefficients.map((coefficient) => coefficient.key),
  );
  const found = formulas.flatMap(
    (formula) => formula?.match(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g) ?? [],
  );
  return [...new Set(found)].filter((key) => known.has(key));
};

const withUsage = (item: AdminCoefficient, state: AdminState) => ({
  ...item,
  usedBy: state.rules
    .filter((rule) => rule.coefficientKeys.includes(item.key))
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
    withStatus: true,
    inUse: (item, state) =>
      item.productCount > 0 || item.roomTypeCodes.length > 0
        ? {
            status: 409,
            body: {
              error: {
                code: 'CATEGORY_IN_USE',
                params: {
                  productCount: item.productCount,
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
    onCreate: (item, state) => adjustProductCount(state, item.categoryId, 1),
    onRemove: (item, state) => adjustProductCount(state, item.categoryId, -1),
    onUpdate: (previous, next, state) => {
      if (previous.categoryId !== next.categoryId) {
        adjustProductCount(state, previous.categoryId, -1);
        adjustProductCount(state, next.categoryId, 1);
      }
    },
  }),
];

const adjustProductCount = (
  state: AdminState,
  categoryId: string,
  delta: number,
) => {
  const index = state.categories.findIndex((item) => item.id === categoryId);
  if (index !== -1) {
    const current = state.categories[index];
    state.categories[index] = {
      ...current,
      productCount: Math.max(0, current.productCount + delta),
    };
  }
};

const productsList: Route = {
  method: 'GET',
  pattern: /^\/admin\/products$/,
  reply: secured((_match, { store, url }) => {
    const term = url.searchParams.get('q')?.trim() ?? '';
    const categoryId = url.searchParams.get('categoryId');
    const status = url.searchParams.get('status');
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
      body: { items: store.admin.roomTypes },
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
        { ...current, name: input.name as AdminRoomType['name'] },
        admin,
        session,
      );
      admin.roomTypes[admin.roomTypes.indexOf(current)] = updated;
      return { body: updated };
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
      return { body: updated };
    }),
  },
];

const styleRoutes = (): Route[] => [
  ...crud<AdminStyle>({
    path: 'styles',
    collection: (state) => state.styles,
    build: (body, id, state) =>
      makeAdminStyle({
        ...(withoutKeys(body, ['imageId']) as Partial<AdminStyle>),
        id,
        status: 'DRAFT',
        sortOrder: state.styles.length,
        image: imageOf(body.imageId),
        pairs: [],
        unfilledCount: 0,
        unavailableCount: 0,
      }),
    merge: (body) =>
      ({
        ...withoutKeys(body, ['id', 'revision', 'imageId']),
        ...('imageId' in body ? { image: imageOf(body.imageId) } : {}),
      }) as Partial<AdminStyle>,
    row: (item) => makeAdminStyleRow(item),
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
      const pairs = current.pairs.map((pair) => {
        const match = items.find(
          (item) =>
            item.roomTypeId === pair.roomTypeId &&
            item.categoryId === pair.categoryId,
        );
        if (!match) {
          return pair;
        }
        const product = admin.products.find(
          (item) => item.id === match.productId,
        );
        const available =
          product?.status === 'PUBLISHED' &&
          product.categoryId === pair.categoryId;
        return {
          ...pair,
          productId: product?.id ?? null,
          productName: product?.name ?? null,
          state: product
            ? available
              ? ('FILLED' as const)
              : ('PRODUCT_UNAVAILABLE' as const)
            : ('EMPTY' as const),
        };
      });
      const updated = stamped(
        {
          ...current,
          pairs,
          unfilledCount: pairs.filter((pair) => pair.state === 'EMPTY').length,
          unavailableCount: pairs.filter(
            (pair) => pair.state === 'PRODUCT_UNAVAILABLE',
          ).length,
        },
        admin,
        session,
      );
      admin.styles[admin.styles.indexOf(current)] = updated;
      return { body: updated };
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
    normalize: (item, state) => ({
      ...item,
      coefficientKeys: coefficientKeysOf(item, state),
    }),
    listExtra: (state) => ({
      categoriesWithoutRule: state.categoriesWithoutRule.filter(
        (category) =>
          !state.rules.some((rule) => rule.categoryId === category.id),
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

const maskLead = (lead: AdminLead): AdminLead => ({
  ...lead,
  name: maskName(lead.name),
  phone: `+${lead.phone.match(/^\+(\d{1,3})/)?.[1] ?? ''}•••${lead.phone.replace(/\D/g, '').slice(-2)}`,
  email: lead.email
    ? `${maskName(lead.email.split('@')[0])}@•••.${lead.email.split('.').pop()}`
    : null,
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
      const term = url.searchParams.get('q')?.trim() ?? '';
      const status = url.searchParams.get('status');
      const digits = term.replace(/\D/g, '');
      const matching = store.admin.leads
        .filter(
          (lead) =>
            (!status || lead.status === status) &&
            (!term ||
              lowerIncludes(lead.name, term) ||
              (digits !== '' &&
                lead.phone.replace(/\D/g, '').includes(digits)) ||
              (/^\d+$/.test(term) && lead.number === Number(term))),
        )
        .sort(
          (a, b) =>
            b.createdAt.localeCompare(a.createdAt) || b.number - a.number,
        );
      const { items, ...rest } = pageOf(matching, url);
      return {
        body: {
          items: items.map((lead) => makeAdminLeadRow(leadView(lead, session))),
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
    reply: secured((_match, { store }) => {
      const id = adminUuid(++store.admin.seed);
      return {
        status: 201,
        body: {
          ...makeAdminImageRef(id),
          texture: `https://res.cloudinary.example.com/roomwise/${id}/texture.webp`,
          width: 1200,
          height: 800,
        },
      };
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
