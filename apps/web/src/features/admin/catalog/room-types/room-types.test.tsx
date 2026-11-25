import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { Locale } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '@/features/admin/session';
import { api } from '@/lib/api/client';
import { toast, useToasts } from '@/lib/toast';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import {
  makeAdminCategories,
  makeAdminRoomType,
  makeAdminRoomTypes,
} from '@/test/fixtures/admin/catalog';
import { adminErrors, makeAdminFailure } from '@/test/fixtures/admin/errors';
import { adminIds } from '@/test/fixtures/admin/ids';
import { makeAdminMe } from '@/test/fixtures/admin/me';
import {
  createTestQueryClient,
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { RoomTypeForm, RoomTypeList } from './index';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), PATCH: vi.fn(), PUT: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const patch = vi.mocked(api.PATCH) as unknown as ReturnType<typeof vi.fn>;
const put = vi.mocked(api.PUT) as unknown as ReturnType<typeof vi.fn>;

const catalogs = { en, uk };
const roomTypesUrl = '/api/v1/admin/room-types';
const categoriesUrl = '/api/v1/admin/categories';
const itemUrl = '/api/v1/admin/room-types/{id}';
const setUrl = '/api/v1/admin/room-types/{id}/categories';

const ok = (data: unknown) => ({ data, response: { status: 200 } });
const failure = (error: { status: number; body: unknown }) => ({
  error: error.body,
  response: { status: error.status },
});

const livingRoom = makeAdminRoomType('LIVING_ROOM');
const baseIds = [
  adminIds.categories.flooring,
  adminIds.categories.wallFinish,
  adminIds.categories.ceilingFinish,
];

function mockData() {
  get.mockImplementation((path: string) =>
    path === roomTypesUrl
      ? Promise.resolve(ok(makeAdminRoomTypes()))
      : path === categoriesUrl
        ? Promise.resolve(ok(makeAdminCategories()))
        : Promise.resolve(ok(makeAdminMe())),
  );
}

const texts = (locale: Locale) => {
  const catalog = catalogs[locale as 'en' | 'uk'];
  return {
    t: catalog.AdminCatalog.roomTypes,
    form: catalog.Admin.form,
    fields: catalog.Admin.fields,
  };
};

const lang = (locale: Locale) => locale as 'en' | 'uk';

const toastMessages = () =>
  useToasts.getState().items.map((item) => item.message);

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
  for (const { id } of useToasts.getState().items) toast.dismiss(id);
});

describe.each(forEachLocale)('RoomTypeList (%s)', (locale) => {
  const { t } = texts(locale);

  it('lists the seven room types with links by code, axe clean', async () => {
    mockData();
    const { container } = renderWithProviders(<RoomTypeList />, {
      locale,
      url: '/admin/catalog/room-types',
    });
    const first = livingRoom.name[lang(locale)];
    expect(await screen.findByRole('link', { name: first })).toHaveAttribute(
      'href',
      `/${locale}/admin/catalog/room-types/LIVING_ROOM`,
    );
    expect(
      screen.getAllByRole('link', {
        name: (name) =>
          makeAdminRoomTypes().items.some(
            (item) => item.name[lang(locale)] === name,
          ),
      }),
    ).toHaveLength(7);
    expect(
      screen.getByRole('columnheader', { name: t.columns.categories }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe.each(forEachLocale)('RoomTypeForm (%s)', (locale) => {
  const { t, form } = texts(locale);
  const saveName = new RegExp(`^${form.save}$`);
  const nameOf = (id: string) =>
    makeAdminCategories().items.find((category) => category.id === id)?.name[
      lang(locale)
    ] as string;
  const lighting = adminIds.categories.unpublishedLighting;

  function renderEdit(
    code = 'LIVING_ROOM',
    queryClient = createTestQueryClient(),
  ) {
    mockData();
    return renderWithProviders(
      <AdminSessionProvider>
        <RoomTypeForm code={code} />
      </AdminSessionProvider>,
      {
        locale,
        url: `/admin/catalog/room-types/${code}`,
        queryClient,
      },
    );
  }

  async function addLighting() {
    await screen.findByRole('list', { name: t.form.categoriesTitle });
    await waitFor(() =>
      expect(
        screen.getByRole('option', {
          name: t.form.draftMark.replace('{name}', nameOf(lighting)),
        }),
      ).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText(t.form.addLabel), {
      target: { value: lighting },
    });
    fireEvent.click(screen.getByRole('button', { name: t.form.add }));
  }

  it('shows the name, categories in order and last change, axe clean', async () => {
    const { container } = renderEdit();
    expect(
      await screen.findByLabelText(
        `${t.form.name} (${texts(locale).fields.languages.en})`,
      ),
    ).toHaveValue('Living room');
    const list = screen.getByRole('list', { name: t.form.categoriesTitle });
    expect(
      Array.from(list.querySelectorAll('li')).map((row) => row.textContent),
    ).toEqual(baseIds.map((id) => expect.stringContaining(nameOf(id))));
    expect(screen.getByText(/admin/)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('adds a category to the end and sends the whole set with the revision', async () => {
    put.mockResolvedValue(ok(livingRoom));
    renderEdit();
    await addLighting();
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith(setUrl, {
        params: { path: { id: livingRoom.id } },
        body: {
          categoryIds: [...baseIds, lighting],
          revision: livingRoom.revision,
        },
      }),
    );
    expect(patch).not.toHaveBeenCalled();
    await waitFor(() => expect(toastMessages()).toContain(form.savedCost));
  });

  it('moves a category to position 2 with the Up button', async () => {
    put.mockResolvedValue(ok(livingRoom));
    renderEdit();
    await addLighting();
    const up = t.form.moveUp.replace('{name}', nameOf(lighting));
    fireEvent.click(await screen.findByRole('button', { name: up }));
    fireEvent.click(screen.getByRole('button', { name: up }));
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith(setUrl, {
        params: { path: { id: livingRoom.id } },
        body: {
          categoryIds: [baseIds[0], lighting, baseIds[1], baseIds[2]],
          revision: livingRoom.revision,
        },
      }),
    );
  });

  it('removes a category', async () => {
    put.mockResolvedValue(ok(livingRoom));
    renderEdit();
    fireEvent.click(
      await screen.findByRole('button', {
        name: t.form.remove.replace('{name}', nameOf(baseIds[1])),
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith(setUrl, {
        params: { path: { id: livingRoom.id } },
        body: {
          categoryIds: [baseIds[0], baseIds[2]],
          revision: livingRoom.revision,
        },
      }),
    );
  });

  it('renames first and uses the returned revision for the set', async () => {
    const renamed = { ...livingRoom, revision: adminIds.admin };
    patch.mockResolvedValue(
      ok({ ...renamed, name: { en: 'Lounge', uk: livingRoom.name.uk } }),
    );
    put.mockResolvedValue(ok(renamed));
    renderEdit();
    const english = await screen.findByLabelText(
      `${t.form.name} (${texts(locale).fields.languages.en})`,
    );
    fireEvent.change(english, { target: { value: 'Lounge' } });
    fireEvent.click(
      screen.getByRole('button', {
        name: t.form.remove.replace('{name}', nameOf(baseIds[2])),
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(itemUrl, {
        params: { path: { id: livingRoom.id } },
        body: {
          name: { en: 'Lounge', uk: livingRoom.name.uk },
          revision: livingRoom.revision,
        },
      }),
    );
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith(setUrl, {
        params: { path: { id: livingRoom.id } },
        body: {
          categoryIds: [baseIds[0], baseIds[1]],
          revision: renamed.revision,
        },
      }),
    );
  });

  it('keeps unsaved edits when a background refetch fails', async () => {
    const queryClient = createTestQueryClient();
    renderEdit('LIVING_ROOM', queryClient);
    const english = await screen.findByLabelText(
      `${t.form.name} (${texts(locale).fields.languages.en})`,
    );
    fireEvent.change(english, { target: { value: 'Lounge' } });
    get.mockImplementation((path: string) =>
      path === roomTypesUrl
        ? Promise.resolve(failure(makeAdminFailure(403, 'FORBIDDEN')))
        : path === categoriesUrl
          ? Promise.resolve(ok(makeAdminCategories()))
          : Promise.resolve(ok(makeAdminMe())),
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
    expect(
      screen.getByLabelText(
        `${t.form.name} (${texts(locale).fields.languages.en})`,
      ),
    ).toHaveValue('Lounge');
  });

  it('shows the conflict banner on a stale revision', async () => {
    put.mockResolvedValue(failure(adminErrors.staleRevision()));
    renderEdit();
    await addLighting();
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    expect(
      await screen.findByRole('button', { name: form.conflict.accept }),
    ).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown code', async () => {
    renderEdit('GARAGE');
    expect(await screen.findByText(t.form.notFoundText)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.form.back })).toBeInTheDocument();
  });
});
