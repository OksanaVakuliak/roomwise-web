import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { Locale } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '@/features/admin/session';
import { api } from '@/lib/api/client';
import { toast, useToasts } from '@/lib/toast';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import {
  type AdminCategory,
  makeAdminCategories,
  makeAdminCategory,
  makeAdminRoomTypes,
} from '@/test/fixtures/admin/catalog';
import { adminErrors, makeAdminFailure } from '@/test/fixtures/admin/errors';
import { adminIds, adminUuid } from '@/test/fixtures/admin/ids';
import { makeAdminMe } from '@/test/fixtures/admin/me';
import {
  createTestQueryClient,
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { CategoryForm, CategoryList } from './index';

vi.setConfig({ testTimeout: 15_000 });

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn(), DELETE: vi.fn() },
}));

const authMeUrl = '/api/v1/admin/auth/me';

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;
const patch = vi.mocked(api.PATCH) as unknown as ReturnType<typeof vi.fn>;
const del = vi.mocked(api.DELETE) as unknown as ReturnType<typeof vi.fn>;

const catalogs = { en, uk };
const listUrl = '/api/v1/admin/categories';
const statusUrl = '/api/v1/admin/categories/{id}/status';
const itemUrl = '/api/v1/admin/categories/{id}';
const roomTypesUrl = '/api/v1/admin/room-types';

const failure = (error: { status: number; body: unknown }) => ({
  error: error.body,
  response: { status: error.status },
});

const ok = (data: unknown) => ({ data, response: { status: 200 } });

function mockList(items: AdminCategory[] = makeAdminCategories().items) {
  get.mockImplementation((path: string) =>
    path === listUrl
      ? Promise.resolve(ok({ items }))
      : path === authMeUrl
        ? Promise.resolve(ok(makeAdminMe()))
        : path === roomTypesUrl
          ? Promise.resolve(ok(makeAdminRoomTypes()))
          : Promise.reject(new Error(`unexpected GET ${path}`)),
  );
}

const texts = (locale: Locale) => {
  const catalog = catalogs[locale as 'en' | 'uk'];
  return {
    t: catalog.AdminCatalog.categories,
    form: catalog.Admin.form,
    fields: catalog.Admin.fields,
    errors: catalog.AdminErrors,
    status: catalog.Admin.status,
    reauth: catalog.Admin.session.reauth,
  };
};

const nameLabel = (locale: Locale, language: 'en' | 'uk') => {
  const { t, fields } = texts(locale);
  return `${t.form.name} (${fields.languages[language]})`;
};

const roomTypeNames = (locale: Locale, codes: string[]) =>
  codes
    .map(
      (code) =>
        makeAdminRoomTypes().items.find((roomType) => roomType.code === code)
          ?.name[locale as 'en' | 'uk'],
    )
    .join(', ');

const flooring = makeAdminCategory();

function renderEdit(
  locale: Locale,
  category: AdminCategory = flooring,
  queryClient = createTestQueryClient(),
) {
  mockList([category]);
  return renderWithProviders(
    <AdminSessionProvider>
      <CategoryForm categoryId={category.id} />
    </AdminSessionProvider>,
    {
      locale,
      url: `/admin/catalog/categories/${category.id}`,
      queryClient,
    },
  );
}

const toastMessages = () =>
  useToasts.getState().items.map((item) => item.message);

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
  for (const { id } of useToasts.getState().items) toast.dismiss(id);
});

describe.each(forEachLocale)('CategoryList (%s)', (locale) => {
  const { t } = texts(locale);
  const renderList = (url = '/admin/catalog/categories') => {
    mockList();
    return renderWithProviders(<CategoryList />, { locale, url });
  };
  const nameOf = (category: AdminCategory) =>
    category.name[locale as 'en' | 'uk'];

  it('lists categories with status and product counts, axe clean', async () => {
    const { container } = renderList();
    expect(
      await screen.findByRole('link', { name: nameOf(flooring) }),
    ).toBeInTheDocument();
    expect(screen.getByText(t.surfaces.CEILING)).toBeInTheDocument();
    expect(
      screen.getAllByText(catalogs[locale as 'en' | 'uk'].Admin.status.DRAFT)
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: t.add })).toHaveAttribute(
      'href',
      `/${locale}/admin/catalog/categories/new`,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('searches over both language names', async () => {
    renderList();
    await screen.findByRole('link', { name: nameOf(flooring) });
    const query = locale === 'en' ? 'Сантех' : 'Plumbing';
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: query },
    });
    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: nameOf(flooring) }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText(
        nameOf(
          makeAdminCategory({
            name: { en: 'Plumbing fixtures', uk: 'Сантехніка' },
          }),
        ),
      ),
    ).toBeInTheDocument();
  });

  it('filters by status and keeps the filter in the URL', async () => {
    const { location } = renderList();
    await screen.findByRole('link', { name: nameOf(flooring) });
    fireEvent.change(screen.getByLabelText(t.statusFilter), {
      target: { value: 'ARCHIVED' },
    });
    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: nameOf(flooring) }),
      ).not.toBeInTheDocument(),
    );
    expect(location().search).toContain('status=ARCHIVED');
    expect(
      screen.getByText(/Legacy decor|Застарілий декор/),
    ).toBeInTheDocument();
  });

  it('opens the category on row click', async () => {
    const { router } = renderList();
    await screen.findByRole('link', { name: nameOf(flooring) });
    const row = screen
      .getByRole('link', { name: nameOf(flooring) })
      .closest('tr') as HTMLElement;
    fireEvent.click(row.querySelectorAll('td')[1]);
    expect(router.push).toHaveBeenCalledWith(
      expect.stringContaining(
        `/admin/catalog/categories/${adminIds.categories.flooring}`,
      ),
    );
  });
});

describe.each(forEachLocale)('CategoryForm (%s)', (locale) => {
  const { t, form, errors } = texts(locale);
  const saveName = new RegExp(`^${form.save}$`);

  it('creates a category from both language names', async () => {
    mockList();
    post.mockResolvedValue(ok(makeAdminCategory({ id: adminUuid(777) })));
    const { router, container } = renderWithProviders(
      <AdminSessionProvider>
        <CategoryForm />
      </AdminSessionProvider>,
      {
        locale,
        url: '/admin/catalog/categories/new',
      },
    );
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.change(screen.getByLabelText(nameLabel(locale, 'en')), {
      target: { value: 'Tiles' },
    });
    fireEvent.change(screen.getByLabelText(nameLabel(locale, 'uk')), {
      target: { value: 'Плитка' },
    });
    fireEvent.change(screen.getByLabelText(new RegExp(t.form.waste)), {
      target: { value: '7' },
    });
    fireEvent.change(screen.getByLabelText(t.form.surface), {
      target: { value: 'FLOOR' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(listUrl, {
        body: {
          name: { en: 'Tiles', uk: 'Плитка' },
          wastePercent: 7,
          surface: 'FLOOR',
          requiresPutty: true,
        },
      }),
    );
    await waitFor(() => expect(toastMessages()).toContain(form.savedCost));
    expect(router.push).toHaveBeenCalled();
  });

  it('shows the category, its last change and no a11y violations', async () => {
    const { container } = renderEdit(locale);
    expect(await screen.findByLabelText(nameLabel(locale, 'en'))).toHaveValue(
      'Flooring',
    );
    expect(screen.getByLabelText(nameLabel(locale, 'uk'))).toHaveValue(
      'Підлога',
    );
    expect(screen.getByText(/admin/)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('sends the revision when saving an edit', async () => {
    patch.mockResolvedValue(ok({ ...flooring, wastePercent: 12 }));
    renderEdit(locale);
    const waste = await screen.findByLabelText(new RegExp(t.form.waste));
    fireEvent.change(waste, { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(itemUrl, {
        params: { path: { id: flooring.id } },
        body: {
          name: flooring.name,
          wastePercent: 12,
          surface: 'FLOOR',
          requiresPutty: false,
          revision: flooring.revision,
        },
      }),
    );
    await waitFor(() => expect(toastMessages()).toContain(form.savedCost));
  });

  it('blocks publishing without the Ukrainian name', async () => {
    const draft = makeAdminCategory({
      status: 'DRAFT',
      name: { en: 'Lighting', uk: '' },
    });
    renderEdit(locale, draft);
    await screen.findByLabelText(nameLabel(locale, 'en'));
    fireEvent.click(screen.getByRole('button', { name: form.publish }));

    expect(
      await screen.findByText(errors.field.TRANSLATION_MISSING),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(nameLabel(locale, 'uk'))).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(post).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
  });

  it('publishes through the status endpoint with the revision', async () => {
    const draft = makeAdminCategory({ status: 'DRAFT' });
    post.mockResolvedValue(ok({ ...draft, status: 'PUBLISHED' }));
    renderEdit(locale, draft);
    await screen.findByLabelText(nameLabel(locale, 'en'));
    fireEvent.click(screen.getByRole('button', { name: form.publish }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(statusUrl, {
        params: { path: { id: draft.id } },
        body: { status: 'PUBLISHED', revision: draft.revision },
      }),
    );
  });

  it('shows the cost toast when publishing with a changed waste percent', async () => {
    const draft = makeAdminCategory({ status: 'DRAFT' });
    patch.mockResolvedValue(ok({ ...draft, wastePercent: 15 }));
    post.mockResolvedValue(ok({ ...draft, status: 'PUBLISHED' }));
    renderEdit(locale, draft);
    const waste = await screen.findByLabelText(new RegExp(t.form.waste));
    fireEvent.change(waste, { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: form.publish }));

    await waitFor(() => expect(toastMessages()).toContain(form.savedCost));
  });

  it('lists dependencies when the category is in use and archives instead', async () => {
    del.mockResolvedValue(failure(adminErrors.categoryInUse()));
    post.mockResolvedValue(ok({ ...flooring, status: 'ARCHIVED' }));
    renderEdit(locale);
    await screen.findByLabelText(nameLabel(locale, 'en'));

    fireEvent.click(screen.getByRole('button', { name: form.delete }));
    const confirm = await screen.findByRole('dialog');
    fireEvent.click(
      within(confirm).getByRole('button', { name: t.delete.confirm }),
    );

    const inUse = await screen.findByRole('dialog', { name: t.inUse.title });
    expect(
      within(inUse).getByText(t.inUse.products.replace('{count}', '3')),
    ).toBeInTheDocument();
    expect(
      within(inUse).getByText(
        t.inUse.roomTypes.replace(
          '{list}',
          roomTypeNames(locale, ['LIVING_ROOM', 'BEDROOM']),
        ),
      ),
    ).toBeInTheDocument();
    expect(within(inUse).getByText(/Modern|Сучасний/)).toBeInTheDocument();
    expect(await axe(inUse)).toHaveNoViolations();

    fireEvent.click(
      within(inUse).getByRole('button', { name: t.inUse.archive }),
    );
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(statusUrl, {
        params: { path: { id: flooring.id } },
        body: { status: 'ARCHIVED', revision: flooring.revision },
      }),
    );
  });

  it('goes to the list without history.back after deleting a dirty category', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    del.mockResolvedValue({ response: { status: 204 } });
    const { router } = renderEdit(locale);
    const waste = await screen.findByLabelText(new RegExp(t.form.waste));
    fireEvent.change(waste, { target: { value: '15' } });
    mockList([]);

    fireEvent.click(screen.getByRole('button', { name: form.delete }));
    const confirm = await screen.findByRole('dialog');
    fireEvent.click(
      within(confirm).getByRole('button', { name: t.delete.confirm }),
    );

    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(router.push).toHaveBeenCalledWith(
      `/${locale}/admin/catalog/categories`,
    );
    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });

  it('shows the conflict banner on a stale revision', async () => {
    patch.mockResolvedValue(failure(adminErrors.staleRevision()));
    renderEdit(locale);
    const waste = await screen.findByLabelText(new RegExp(t.form.waste));
    fireEvent.change(waste, { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    expect(
      await screen.findByRole('button', { name: form.conflict.accept }),
    ).toBeInTheDocument();
  });

  it('retries the status change from the saved revision after the first attempt fails', async () => {
    const draft = makeAdminCategory({ status: 'DRAFT', revision: 'r1' });
    patch.mockResolvedValue(ok({ ...draft, wastePercent: 12, revision: 'r2' }));
    post
      .mockResolvedValueOnce(failure(makeAdminFailure(403, 'FORBIDDEN')))
      .mockResolvedValueOnce(
        ok({ ...draft, wastePercent: 12, status: 'PUBLISHED', revision: 'r3' }),
      );
    renderEdit(locale, draft);
    fireEvent.change(await screen.findByLabelText(new RegExp(t.form.waste)), {
      target: { value: '12' },
    });
    fireEvent.click(screen.getByRole('button', { name: form.publish }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: form.publish }),
      ).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: form.publish }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post).toHaveBeenLastCalledWith(statusUrl, {
      params: { path: { id: draft.id } },
      body: { status: 'PUBLISHED', revision: 'r2' },
    });
    expect(patch).toHaveBeenCalledTimes(1);
  });

  it('saves reverted values from the saved revision before retrying the status', async () => {
    const draft = makeAdminCategory({ status: 'DRAFT', revision: 'r1' });
    patch
      .mockResolvedValueOnce(ok({ ...draft, wastePercent: 12, revision: 'r2' }))
      .mockResolvedValueOnce(ok({ ...draft, revision: 'r3' }));
    post
      .mockResolvedValueOnce(failure(makeAdminFailure(403, 'FORBIDDEN')))
      .mockResolvedValueOnce(
        ok({ ...draft, status: 'PUBLISHED', revision: 'r4' }),
      );
    renderEdit(locale, draft);
    const waste = await screen.findByLabelText(new RegExp(t.form.waste));
    fireEvent.change(waste, { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: form.publish }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: form.publish }),
      ).not.toBeDisabled(),
    );
    fireEvent.change(waste, { target: { value: String(draft.wastePercent) } });
    fireEvent.click(screen.getByRole('button', { name: form.publish }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(patch).toHaveBeenCalledTimes(2);
    expect(patch.mock.calls[1][1].body.revision).toBe('r2');
    expect(post).toHaveBeenLastCalledWith(statusUrl, {
      params: { path: { id: draft.id } },
      body: { status: 'PUBLISHED', revision: 'r3' },
    });
  });

  it('keeps unsaved edits when a background refetch fails', async () => {
    const queryClient = createTestQueryClient();
    renderEdit(locale, flooring, queryClient);
    const waste = await screen.findByLabelText(new RegExp(t.form.waste));
    fireEvent.change(waste, { target: { value: '33' } });
    get.mockImplementation((path: string) =>
      path === authMeUrl
        ? Promise.resolve(ok(makeAdminMe()))
        : Promise.resolve(failure(makeAdminFailure(403, 'FORBIDDEN'))),
    );
    await queryClient.invalidateQueries();

    await waitFor(() =>
      expect(
        queryClient
          .getQueryCache()
          .getAll()
          .some((query) => query.state.fetchFailureCount > 0),
      ).toBe(true),
    );
    expect(screen.queryByText(t.form.loadFailed)).not.toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(t.form.waste))).toHaveValue(33);
  });

  it('opens the reauth dialog when the session expired during a save', async () => {
    patch.mockResolvedValueOnce(failure(adminErrors.unauthenticated()));
    renderEdit(locale);
    const waste = await screen.findByLabelText(new RegExp(t.form.waste));
    fireEvent.change(waste, { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    expect(
      await screen.findByRole('dialog', { name: texts(locale).reauth.title }),
    ).toBeInTheDocument();
  });

  it('keeps the editor and warns when a refetch no longer finds the category', async () => {
    const queryClient = createTestQueryClient();
    renderEdit(locale, flooring, queryClient);
    const waste = await screen.findByLabelText(new RegExp(t.form.waste));
    fireEvent.change(waste, { target: { value: '33' } });
    mockList([]);
    await queryClient.invalidateQueries();

    expect(
      await screen.findByText(t.form.deletedElsewhereTitle),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(t.form.waste))).toHaveValue(33);
    expect(screen.queryByText(t.form.notFoundText)).not.toBeInTheDocument();
  });

  it('shows a not-found state for an unknown category', async () => {
    mockList();
    renderWithProviders(
      <AdminSessionProvider>
        <CategoryForm categoryId={adminUuid(999)} />
      </AdminSessionProvider>,
      {
        locale,
        url: `/admin/catalog/categories/${adminUuid(999)}`,
      },
    );
    expect(await screen.findByText(t.form.notFoundText)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.form.back })).toBeInTheDocument();
  });
});
