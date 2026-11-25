import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { Locale } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadImage } from '@/lib/admin-api/upload';
import { api } from '@/lib/api/client';
import { toast, useToasts } from '@/lib/toast';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import {
  makeAdminCategories,
  makeAdminMaterialTypes,
} from '@/test/fixtures/admin/catalog';
import { adminErrors } from '@/test/fixtures/admin/errors';
import { adminIds, adminUuid } from '@/test/fixtures/admin/ids';
import {
  type AdminProduct,
  makeAdminProduct,
  makeDraftProductWithoutUk,
  makeTexturedProduct,
} from '@/test/fixtures/admin/products';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../../messages/en.json';
import uk from '../../../../../../messages/uk.json';
import { ProductForm } from '../index';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn(), DELETE: vi.fn() },
}));

vi.mock('@/lib/admin-api/upload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/admin-api/upload')>()),
  uploadImage: vi.fn(),
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;
const patch = vi.mocked(api.PATCH) as unknown as ReturnType<typeof vi.fn>;
const del = vi.mocked(api.DELETE) as unknown as ReturnType<typeof vi.fn>;
const upload = vi.mocked(uploadImage) as unknown as ReturnType<typeof vi.fn>;

const catalogs = { en, uk };
const listUrl = '/api/v1/admin/products';
const itemUrl = '/api/v1/admin/products/{id}';
const statusUrl = '/api/v1/admin/products/{id}/status';
const categoriesUrl = '/api/v1/admin/categories';
const materialTypesUrl = '/api/v1/admin/material-types';

const ok = (data: unknown) => ({ data, response: { status: 200 } });
const failure = (error: { status: number; body: unknown }) => ({
  error: error.body,
  response: { status: error.status },
});

const texts = (locale: Locale) => {
  const catalog = catalogs[locale as 'en' | 'uk'];
  return {
    t: catalog.AdminCatalog.products.form,
    form: catalog.Admin.form,
    fields: catalog.Admin.fields,
    errors: catalog.AdminErrors,
  };
};

const toastMessages = () =>
  useToasts.getState().items.map((item) => item.message);

const uploadedImage = (id: string) => ({
  id,
  thumb: `https://res.example.com/${id}/thumb.webp`,
  card: `https://res.example.com/${id}/card.webp`,
  zoom: `https://res.example.com/${id}/zoom.webp`,
  texture: `https://res.example.com/${id}/texture.webp`,
  width: 800,
  height: 600,
  realSizeMm: null,
});

const imageFile = (name = 'photo.png') =>
  new File(['x'], name, { type: 'image/png' });

function mockApi(product?: AdminProduct) {
  get.mockImplementation((path: string) => {
    if (path === itemUrl && product) return Promise.resolve(ok(product));
    if (path === categoriesUrl) {
      return Promise.resolve(ok(makeAdminCategories()));
    }
    if (path === materialTypesUrl) {
      return Promise.resolve(ok(makeAdminMaterialTypes()));
    }
    return Promise.reject(new Error(`unexpected GET ${path}`));
  });
}

const plumbed = (overrides: Partial<AdminProduct> = {}) =>
  makeAdminProduct({
    categoryId: adminIds.categories.plumbing,
    status: 'DRAFT',
    ...overrides,
  });

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
  for (const { id } of useToasts.getState().items) toast.dismiss(id);
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:preview'),
    revokeObjectURL: vi.fn(),
  });
});

describe.each(forEachLocale)('ProductForm (%s)', (locale) => {
  const { t, form, fields, errors } = texts(locale);
  const lang = locale as 'en' | 'uk';
  const saveName = new RegExp(`^${form.save}$`);
  const label = (text: string, language?: 'en' | 'uk') =>
    language
      ? `${text} (${fields.languages[language]})`
      : new RegExp(`^${text}`);

  function renderEdit(product: AdminProduct) {
    mockApi(product);
    return renderWithProviders(<ProductForm productId={product.id} />, {
      locale,
      url: `/admin/catalog/products/${product.id}`,
    });
  }

  it('shows the product and has no a11y violations', async () => {
    const product = makeTexturedProduct();
    const { container } = renderEdit(product);
    expect(await screen.findByLabelText(label(t.name, 'uk'))).toHaveValue(
      product.name.uk,
    );
    expect(screen.getByLabelText(label(t.brand))).toHaveValue('Roomwise');
    expect(
      await screen.findByLabelText(label(t.texture.tileWidth)),
    ).toHaveValue(600);
    expect(screen.getByText(/admin/)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('creates a draft from the chosen category and material type', async () => {
    mockApi();
    post.mockResolvedValue(ok(makeAdminProduct({ id: adminUuid(777) })));
    const { router } = renderWithProviders(<ProductForm />, {
      locale,
      url: '/admin/catalog/products/new',
    });
    const category = makeAdminCategories().items.find(
      (item) => item.id === adminIds.categories.plumbing,
    );
    await screen.findByRole('option', { name: category?.name[lang] });
    await screen.findByRole('option', {
      name: makeAdminMaterialTypes().items[0].name[lang],
    });

    fireEvent.change(screen.getByLabelText(label(t.name, 'en')), {
      target: { value: 'Sink' },
    });
    fireEvent.change(screen.getByLabelText(label(t.category)), {
      target: { value: adminIds.categories.plumbing },
    });
    fireEvent.change(screen.getByLabelText(label(t.materialType)), {
      target: { value: adminIds.materialTypes.laminate },
    });
    fireEvent.change(screen.getByLabelText(t.price), {
      target: { value: '12.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(listUrl, {
        body: expect.objectContaining({
          categoryId: adminIds.categories.plumbing,
          materialTypeId: adminIds.materialTypes.laminate,
          name: { en: 'Sink', uk: '' },
          priceCents: 1250,
          confirmZeroPrice: false,
          images: [],
          textureImageId: null,
        }),
      }),
    );
    await waitFor(() => expect(router.push).toHaveBeenCalled());
  });

  it('blocks publishing without the Ukrainian name but saves the draft', async () => {
    const draft = makeDraftProductWithoutUk({
      priceCents: 1000,
      categoryId: adminIds.categories.plumbing,
    });
    patch.mockResolvedValue(ok(draft));
    renderEdit(draft);
    await screen.findByLabelText(label(t.name, 'en'));

    fireEvent.click(screen.getByRole('button', { name: form.publish }));
    expect(
      (await screen.findAllByText(errors.field.TRANSLATION_MISSING)).length,
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText(label(t.name, 'uk'))).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(post).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(label(t.brand)), {
      target: { value: 'Other' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(itemUrl, {
        params: { path: { id: draft.id } },
        body: expect.objectContaining({
          brand: 'Other',
          name: { en: 'Matte White Tile', uk: '' },
          revision: draft.revision,
        }),
      }),
    );
  });

  it('asks to confirm a zero price and sends the confirmation', async () => {
    const draft = plumbed({ priceCents: 0 });
    patch.mockResolvedValue(ok(draft));
    renderEdit(draft);
    await screen.findByLabelText(label(t.name, 'en'));

    fireEvent.change(screen.getByLabelText(label(t.brand)), {
      target: { value: 'Other' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));
    const dialog = await screen.findByRole('dialog', {
      name: t.zeroPrice.title,
    });
    expect(patch).not.toHaveBeenCalled();

    fireEvent.click(
      within(dialog).getByRole('button', { name: t.zeroPrice.confirm }),
    );
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(itemUrl, {
        params: { path: { id: draft.id } },
        body: expect.objectContaining({
          priceCents: 0,
          confirmZeroPrice: true,
        }),
      }),
    );
  });

  it('rejects a negative price', async () => {
    renderEdit(plumbed());
    const price = await screen.findByLabelText(t.price);
    fireEvent.change(price, { target: { value: '-5' } });
    expect(await screen.findByText(fields.negativePrice)).toBeInTheDocument();
  });

  it('blocks publishing a surface product without a texture', async () => {
    const draft = makeAdminProduct({ status: 'DRAFT' });
    renderEdit(draft);
    await screen.findByLabelText(label(t.texture.tileWidth));

    fireEvent.click(screen.getByRole('button', { name: form.publish }));
    expect(await screen.findByText(t.texture.required)).toBeInTheDocument();
    expect(screen.getByLabelText(label(t.texture.tileWidth))).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText(label(t.texture.fallback))).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(post).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
  });

  it('lists styles when the product is in use and archives instead', async () => {
    const product = makeTexturedProduct();
    del.mockResolvedValue(failure(adminErrors.productInUse()));
    post.mockResolvedValue(ok({ ...product, status: 'ARCHIVED' }));
    renderEdit(product);
    await screen.findByLabelText(label(t.name, 'en'));

    fireEvent.click(screen.getByRole('button', { name: form.delete }));
    const confirm = await screen.findByRole('dialog');
    fireEvent.click(
      within(confirm).getByRole('button', { name: t.delete.confirm }),
    );

    const inUse = await screen.findByRole('dialog', { name: t.inUse.title });
    expect(
      within(inUse).getByText(
        t.inUse.styles.replace('{list}', lang === 'en' ? 'Modern' : 'Сучасний'),
      ),
    ).toBeInTheDocument();
    expect(await axe(inUse)).toHaveNoViolations();

    fireEvent.click(
      within(inUse).getByRole('button', { name: t.inUse.archive }),
    );
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(statusUrl, {
        params: { path: { id: product.id } },
        body: { status: 'ARCHIVED', revision: product.revision },
      }),
    );
  });

  it('shows the conflict banner on a stale revision', async () => {
    patch.mockResolvedValue(failure(adminErrors.staleRevision()));
    renderEdit(plumbed());
    fireEvent.change(await screen.findByLabelText(label(t.brand)), {
      target: { value: 'Other' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    expect(
      await screen.findByRole('button', { name: form.conflict.accept }),
    ).toBeInTheDocument();
  });

  it('shows the cost toast after a price change', async () => {
    const product = plumbed();
    patch.mockResolvedValue(ok({ ...product, priceCents: 3000 }));
    renderEdit(product);
    fireEvent.change(await screen.findByLabelText(t.price), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() => expect(toastMessages()).toContain(form.savedCost));
    expect(patch).toHaveBeenCalledWith(itemUrl, {
      params: { path: { id: product.id } },
      body: expect.objectContaining({ priceCents: 3000 }),
    });
  });

  it('blocks saving while an image is still uploading', async () => {
    upload.mockReturnValue(new Promise(() => undefined));
    const { container } = renderEdit(plumbed());
    await screen.findByLabelText(label(t.name, 'en'));

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [imageFile()] } });
    fireEvent.change(screen.getByLabelText(label(t.brand)), {
      target: { value: 'Other' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    expect(await screen.findByText(t.images.unfinished)).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('sends the image order and the chosen primary image', async () => {
    const product = plumbed();
    const newId = adminUuid(2000);
    upload.mockResolvedValue(uploadedImage(newId));
    patch.mockResolvedValue(ok(product));
    const { container } = renderEdit(product);
    await screen.findByLabelText(label(t.name, 'en'));

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [imageFile()] } });
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: t.images.primary }),
      ).toHaveLength(2),
    );
    const idle = screen
      .getAllByRole('button', { name: t.images.primary })
      .find((button) => button.getAttribute('aria-pressed') === 'false');
    fireEvent.click(idle as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(itemUrl, {
        params: { path: { id: product.id } },
        body: expect.objectContaining({
          images: [
            { imageId: adminIds.images.laminate, isPrimary: false },
            { imageId: newId, isPrimary: true },
          ],
        }),
      }),
    );
  });

  it('shows the warnings returned by a status change', async () => {
    const product = plumbed({ status: 'PUBLISHED' });
    post.mockResolvedValue(
      ok({
        ...product,
        status: 'DRAFT',
        warnings: [
          {
            code: 'USED_AS_DEFAULT_MATERIAL',
            params: {
              styles: [
                {
                  id: adminIds.styles.modern,
                  name: { en: 'Modern', uk: 'Сучасний' },
                },
              ],
            },
          },
        ],
      }),
    );
    renderEdit(product);
    await screen.findByLabelText(label(t.name, 'en'));

    fireEvent.click(screen.getByRole('button', { name: form.unpublish }));
    expect(
      await screen.findByText(
        t.warnings.USED_AS_DEFAULT_MATERIAL.replace(
          '{list}',
          lang === 'en' ? 'Modern' : 'Сучасний',
        ),
      ),
    ).toBeInTheDocument();
  });

  it('limits attributes to thirty', async () => {
    const product = plumbed({
      attributes: Array.from({ length: 30 }, (_, index) => ({
        name: { en: `A${index}`, uk: `Б${index}` },
        value: { en: 'x', uk: 'х' },
      })),
    });
    renderEdit(product);
    await screen.findByLabelText(label(t.name, 'en'));
    expect(
      screen.getByRole('button', { name: t.attributes.add }),
    ).toBeDisabled();
  });
});
