import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { Locale } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '@/features/admin/session';
import { api } from '@/lib/api/client';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import { makeAdminMaterialTypes } from '@/test/fixtures/admin/catalog';
import { adminErrors, makeAdminFailure } from '@/test/fixtures/admin/errors';
import { makeAdminMe } from '@/test/fixtures/admin/me';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { AdminMaterialTypes } from './index';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;
const patch = vi.mocked(api.PATCH) as unknown as ReturnType<typeof vi.fn>;

const catalogs = { en, uk };

const failure = (error: { status: number; body: unknown }) => ({
  error: error.body,
  response: { status: error.status },
});

const list = makeAdminMaterialTypes();
const [laminate] = list.items;

async function setup(locale: Locale) {
  get.mockImplementation(async (path: string) =>
    path.includes('material-types')
      ? { data: list, response: { status: 200 } }
      : { data: makeAdminMe(), response: { status: 200 } },
  );
  const view = renderWithProviders(
    <AdminSessionProvider>
      <AdminMaterialTypes />
    </AdminSessionProvider>,
    { locale, url: '/admin/catalog/material-types' },
  );
  const l = locale as 'en' | 'uk';
  const t = catalogs[l].AdminCatalog.materialTypes;
  await screen.findByText(laminate.code);
  return { ...view, t, labels: catalogs[l].Admin };
}

const editLabel = (t: { edit: string }, code: string) =>
  t.edit.replace('{code}', code);

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

describe.each(forEachLocale)('AdminMaterialTypes (%s)', (locale) => {
  it('renders the list and has no a11y violations', async () => {
    const { container, t, labels } = await setup(locale);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      t.title,
    );
    expect(screen.getByText('TILE')).toBeInTheDocument();
    expect(screen.getAllByText(labels.status.PUBLISHED).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText(labels.status.DRAFT)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('creates a material type with the entered code and names', async () => {
    post.mockResolvedValue({
      data: { ...laminate, code: 'PARQUET' },
      response: { status: 201 },
    });
    const { t, labels } = await setup(locale);
    fireEvent.click(screen.getByRole('button', { name: t.add }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(new RegExp(t.code)), {
      target: { value: 'PARQUET' },
    });
    fireEvent.change(
      within(dialog).getByLabelText(
        `${t.name} (${labels.fields.languages.en})`,
      ),
      { target: { value: 'Parquet' } },
    );
    fireEvent.change(
      within(dialog).getByLabelText(
        `${t.name} (${labels.fields.languages.uk})`,
      ),
      { target: { value: 'Паркет' } },
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: labels.form.save }),
    );

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/api/v1/admin/material-types', {
        body: { code: 'PARQUET', name: { en: 'Parquet', uk: 'Паркет' } },
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('asks before closing the panel with unsaved edits', async () => {
    const { t } = await setup(locale);
    fireEvent.click(screen.getByRole('button', { name: t.add }));
    const dialog = await screen.findByRole('dialog');
    const code = within(dialog).getByLabelText(new RegExp(t.code));
    fireEvent.change(code, { target: { value: 'TILE' } });
    fireEvent.keyDown(document, { key: 'Escape' });

    const leave = catalogs[locale as 'en' | 'uk'].Admin.form.leave;
    const confirm = await screen.findByRole('dialog', { name: leave.title });
    fireEvent.click(
      within(confirm).getByRole('button', { name: leave.cancel }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: leave.title }),
      ).not.toBeInTheDocument(),
    );
    expect(code).toHaveValue('TILE');

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(
      within(
        await screen.findByRole('dialog', { name: leave.title }),
      ).getByRole('button', { name: leave.confirm }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('closes a clean panel without asking', async () => {
    const { t } = await setup(locale);
    fireEvent.click(screen.getByRole('button', { name: t.add }));
    await screen.findByRole('dialog');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('shows CODE_TAKEN at the code field', async () => {
    post.mockResolvedValue(failure(makeAdminFailure(409, 'CODE_TAKEN')));
    const { t, labels } = await setup(locale);
    fireEvent.click(screen.getByRole('button', { name: t.add }));
    const dialog = await screen.findByRole('dialog');
    const code = within(dialog).getByLabelText(new RegExp(t.code));
    fireEvent.change(code, { target: { value: 'TILE' } });
    fireEvent.click(
      within(dialog).getByRole('button', { name: labels.form.save }),
    );

    const message = catalogs[locale as 'en' | 'uk'].Errors.CODE_TAKEN;
    expect(await within(dialog).findByText(message)).toBeInTheDocument();
    expect(code).toHaveAccessibleDescription(new RegExp(message));
  });

  it('sends the revision when editing', async () => {
    patch.mockResolvedValue({
      data: { ...laminate, status: 'ARCHIVED' },
      response: { status: 200 },
    });
    const { t, labels } = await setup(locale);
    fireEvent.click(
      screen.getByRole('button', { name: editLabel(t, laminate.code) }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(t.status), {
      target: { value: 'ARCHIVED' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: labels.form.save }),
    );

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/api/v1/admin/material-types/{id}', {
        params: { path: { id: laminate.id } },
        body: {
          name: laminate.name,
          status: 'ARCHIVED',
          revision: laminate.revision,
        },
      }),
    );
  });

  it('shows the conflict banner on STALE_REVISION', async () => {
    patch.mockResolvedValue(failure(adminErrors.staleRevision()));
    const { t, labels } = await setup(locale);
    fireEvent.click(
      screen.getByRole('button', { name: editLabel(t, laminate.code) }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(t.status), {
      target: { value: 'DRAFT' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: labels.form.save }),
    );

    expect(
      await within(dialog).findByRole('button', {
        name: labels.form.conflict.accept,
      }),
    ).toBeInTheDocument();
  });

  it('shows server field errors under the name field', async () => {
    patch.mockResolvedValue(failure(adminErrors.translationMissing()));
    const { t, labels } = await setup(locale);
    fireEvent.click(
      screen.getByRole('button', { name: editLabel(t, laminate.code) }),
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(t.status), {
      target: { value: 'DRAFT' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: labels.form.save }),
    );

    const message =
      catalogs[locale as 'en' | 'uk'].AdminErrors.field.TRANSLATION_MISSING;
    expect(await within(dialog).findByText(message)).toBeInTheDocument();
  });
});
