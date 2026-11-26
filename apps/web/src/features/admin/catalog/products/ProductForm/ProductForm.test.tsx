import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { Locale } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '@/features/admin/session';
import { adminKeys } from '@/lib/admin-api/keys';
import { uploadImage } from '@/lib/admin-api/upload';
import { api } from '@/lib/api/client';
import { ApiRequestError } from '@/lib/api/request-error';
import { toast, useToasts } from '@/lib/toast';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import {
  makeAdminCategories,
  makeAdminMaterialTypes,
} from '@/test/fixtures/admin/catalog';
import { adminErrors, makeAdminFailure } from '@/test/fixtures/admin/errors';
import { adminIds, adminUuid } from '@/test/fixtures/admin/ids';
import { makeAdminMe } from '@/test/fixtures/admin/me';
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

vi.setConfig({ testTimeout: 15_000 });

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
const imageUrl = '/api/v1/admin/images/{id}';

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

type MockOptions = { categoriesFail?: boolean; itemFail?: boolean };

function mockApi(product?: AdminProduct, options: MockOptions = {}) {
  get.mockImplementation((path: string) => {
    if (path === itemUrl && product) {
      return options.itemFail
        ? Promise.reject(new Error('item'))
        : Promise.resolve(ok(product));
    }
    if (path === categoriesUrl) {
      return options.categoriesFail
        ? Promise.reject(new Error('categories'))
        : Promise.resolve(ok(makeAdminCategories()));
    }
    if (path === materialTypesUrl) {
      return Promise.resolve(ok(makeAdminMaterialTypes()));
    }
    return Promise.resolve(ok(makeAdminMe()));
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
  let blobs = 0;
  Object.assign(URL, {
    createObjectURL: vi.fn(() => `blob:preview-${++blobs}`),
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

  function renderEdit(product: AdminProduct, options: MockOptions = {}) {
    mockApi(product, options);
    return renderWithProviders(
      <AdminSessionProvider>
        <ProductForm productId={product.id} />
      </AdminSessionProvider>,
      { locale, url: `/admin/catalog/products/${product.id}` },
    );
  }

  const fileInputs = (container: HTMLElement) =>
    container.querySelectorAll<HTMLInputElement>('input[type="file"]');

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
    const { router } = renderWithProviders(
      <AdminSessionProvider>
        <ProductForm />
      </AdminSessionProvider>,
      { locale, url: '/admin/catalog/products/new' },
    );
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

  it('does not save the product twice when the status change fails and is retried', async () => {
    const product = plumbed({ status: 'PUBLISHED' });
    const saved = { ...product, brand: 'Other', revision: 'rev-2' };
    patch.mockResolvedValue(ok(saved));
    post
      .mockResolvedValueOnce(failure(makeAdminFailure(403, 'DEMO_FORBIDDEN')))
      .mockResolvedValueOnce(ok({ ...saved, status: 'DRAFT' }));
    renderEdit(product);
    fireEvent.change(await screen.findByLabelText(label(t.brand)), {
      target: { value: 'Other' },
    });

    fireEvent.click(screen.getByRole('button', { name: form.unpublish }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: form.unpublish }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(patch).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenLastCalledWith(statusUrl, {
      params: { path: { id: product.id } },
      body: { status: 'DRAFT', revision: 'rev-2' },
    });
  });

  it('does not wipe the texture when the categories failed to load', async () => {
    const product = makeTexturedProduct();
    patch.mockResolvedValue(ok(product));
    renderEdit(product, { categoriesFail: true });
    fireEvent.change(await screen.findByLabelText(label(t.brand)), {
      target: { value: 'Other' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() => expect(patch).toHaveBeenCalled());
    const body = patch.mock.calls[0]?.[1].body;
    expect(body).toMatchObject({ brand: 'Other' });
    for (const key of [
      'textureImageId',
      'tileWidthMm',
      'tileLengthMm',
      'fallbackColor',
    ]) {
      expect(body).not.toHaveProperty(key);
    }
  });

  it('lets the admin dismiss a failed texture upload', async () => {
    upload.mockRejectedValue(new Error('upload'));
    const product = makeTexturedProduct();
    const { container } = renderEdit(product);
    await screen.findByLabelText(label(t.texture.tileWidth));

    fireEvent.change(fileInputs(container)[1], {
      target: { files: [imageFile('texture.png')] },
    });
    fireEvent.click(
      await screen.findByRole('button', { name: t.texture.dismissError }),
    );

    expect(
      screen.queryByRole('button', { name: t.texture.dismissError }),
    ).not.toBeInTheDocument();
  });

  it('saves after a failed texture upload when the category loses its surface', async () => {
    upload.mockRejectedValue(new Error('upload'));
    const product = makeTexturedProduct();
    patch.mockResolvedValue(ok(product));
    const { container } = renderEdit(product);
    await screen.findByLabelText(label(t.texture.tileWidth));

    fireEvent.change(fileInputs(container)[1], {
      target: { files: [imageFile('texture.png')] },
    });
    await screen.findByRole('button', { name: t.texture.dismissError });
    fireEvent.change(screen.getByLabelText(label(t.category)), {
      target: { value: adminIds.categories.plumbing },
    });
    expect(
      screen.queryByLabelText(label(t.texture.tileWidth)),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(screen.queryByText(t.images.unfinished)).not.toBeInTheDocument();
  });

  it('keeps the editor and unsaved edits when a background refetch fails', async () => {
    const product = plumbed();
    const { queryClient } = renderEdit(product);
    fireEvent.change(await screen.findByLabelText(label(t.brand)), {
      target: { value: 'Other' },
    });
    const key = adminKeys.area('catalog', 'products', 'item', product.id);

    mockApi(product, { itemFail: true });
    await queryClient.refetchQueries({ queryKey: key });
    await waitFor(() =>
      expect(queryClient.getQueryState(key)?.status).toBe('error'),
    );

    expect(screen.getByLabelText(label(t.brand))).toHaveValue('Other');
    expect(screen.queryByText(t.loadFailed)).not.toBeInTheDocument();
  });

  it('keeps the editor and warns when a refetch finds the product deleted', async () => {
    const product = plumbed();
    const { queryClient } = renderEdit(product);
    fireEvent.change(await screen.findByLabelText(label(t.brand)), {
      target: { value: 'Other' },
    });
    get.mockImplementation((path: string) =>
      Promise.resolve(
        path === itemUrl
          ? failure({
              status: 404,
              body: { error: { code: 'PRODUCT_NOT_FOUND' } },
            })
          : ok(makeAdminMe()),
      ),
    );
    await queryClient.refetchQueries({
      queryKey: adminKeys.area('catalog', 'products', 'item', product.id),
    });

    expect(
      await screen.findByText(t.deletedElsewhereTitle),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(label(t.brand))).toHaveValue('Other');
    expect(screen.queryByText(t.notFoundTitle)).not.toBeInTheDocument();
  });

  it('asks to sign in again when the session expired during a save', async () => {
    const product = plumbed();
    patch.mockResolvedValueOnce(failure(adminErrors.unauthenticated()));
    renderEdit(product);
    fireEvent.change(await screen.findByLabelText(label(t.brand)), {
      target: { value: 'Other' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(patch).toHaveBeenCalledTimes(1);
  });

  it('asks to sign in again when the session expired during an upload', async () => {
    upload.mockRejectedValueOnce(
      new ApiRequestError(401, adminErrors.unauthenticated().body),
    );
    upload.mockResolvedValue(uploadedImage(adminUuid(4001)));
    const { container } = renderEdit(plumbed());
    await screen.findByLabelText(label(t.brand));

    fireEvent.change(fileInputs(container)[0], {
      target: { files: [imageFile()] },
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it('updates the texture real size when the tile width changed', async () => {
    const product = makeTexturedProduct();
    patch.mockImplementation((path: string) =>
      Promise.resolve(
        ok(
          path === imageUrl ? uploadedImage(adminIds.images.texture) : product,
        ),
      ),
    );
    renderEdit(product);
    fireEvent.change(await screen.findByLabelText(label(t.texture.tileWidth)), {
      target: { value: '800' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(imageUrl, {
        params: { path: { id: adminIds.images.texture } },
        body: { realSizeMm: 800 },
      }),
    );
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(itemUrl, expect.anything()),
    );
  });

  it('saves the product before the texture size and retries only the texture', async () => {
    const product = makeTexturedProduct();
    let imageCalls = 0;
    patch.mockImplementation((path: string) => {
      if (path !== imageUrl) return Promise.resolve(ok(product));
      imageCalls += 1;
      return Promise.resolve(
        imageCalls === 1
          ? failure(makeAdminFailure(422, 'VALIDATION_FAILED'))
          : ok(uploadedImage(adminIds.images.texture)),
      );
    });
    renderEdit(product);
    fireEvent.change(await screen.findByLabelText(label(t.texture.tileWidth)), {
      target: { value: '800' },
    });
    fireEvent.click(screen.getByRole('button', { name: saveName }));
    await waitFor(() => expect(imageCalls).toBe(1));
    expect(patch.mock.calls.map(([path]) => path)).toEqual([itemUrl, imageUrl]);

    fireEvent.click(screen.getByRole('button', { name: saveName }));
    await waitFor(() => expect(imageCalls).toBe(2));
    expect(patch.mock.calls.map(([path]) => path)).toEqual([
      itemUrl,
      imageUrl,
      imageUrl,
    ]);
  });

  it('sets the real size of a texture uploaded before the tile width', async () => {
    const textureId = adminUuid(3001);
    upload.mockResolvedValue(uploadedImage(textureId));
    const product = makeTexturedProduct();
    patch.mockImplementation((path: string) =>
      Promise.resolve(
        ok(path === imageUrl ? uploadedImage(textureId) : product),
      ),
    );
    const { container } = renderEdit(product);
    const width = await screen.findByLabelText(label(t.texture.tileWidth));
    fireEvent.change(width, { target: { value: '' } });
    fireEvent.change(fileInputs(container)[1], {
      target: { files: [imageFile('texture.png')] },
    });
    await waitFor(() => expect(upload).toHaveBeenCalled());
    await waitFor(() =>
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1'),
    );
    fireEvent.change(width, { target: { value: '600' } });
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(imageUrl, {
        params: { path: { id: textureId } },
        body: { realSizeMm: 600 },
      }),
    );
  });

  it('does not refetch the product after deleting it', async () => {
    const product = plumbed();
    del.mockResolvedValue(ok(undefined));
    const { router } = renderEdit(product);
    await screen.findByLabelText(label(t.name, 'en'));

    fireEvent.click(screen.getByRole('button', { name: form.delete }));
    const confirm = await screen.findByRole('dialog');
    fireEvent.click(
      within(confirm).getByRole('button', { name: t.delete.confirm }),
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalled());
    expect(router.replace).toHaveBeenCalledWith(
      `/${locale}/admin/catalog/products`,
    );
    expect(router.push).not.toHaveBeenCalled();
    expect(get.mock.calls.filter(([path]) => path === itemUrl)).toHaveLength(1);
  });

  it('never renders the not-found state after deleting the product', async () => {
    const product = plumbed();
    del.mockResolvedValue(ok(undefined));
    const { router } = renderEdit(product);
    await screen.findByLabelText(label(t.name, 'en'));
    const original = get.getMockImplementation() as (
      path: string,
    ) => Promise<unknown>;
    get.mockImplementation((path: string) =>
      path === itemUrl
        ? Promise.resolve(failure(makeAdminFailure(404, 'NOT_FOUND')))
        : original(path),
    );

    fireEvent.click(screen.getByRole('button', { name: form.delete }));
    const confirm = await screen.findByRole('dialog');
    fireEvent.click(
      within(confirm).getByRole('button', { name: t.delete.confirm }),
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalled());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(screen.queryByText(t.notFoundTitle)).not.toBeInTheDocument();
    expect(get.mock.calls.filter(([path]) => path === itemUrl)).toHaveLength(1);
  });

  it('keeps the leave guard on while a delete is pending', async () => {
    let finish: (value: unknown) => void = () => {};
    del.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { router } = renderEdit(plumbed());
    fireEvent.change(await screen.findByLabelText(label(t.brand)), {
      target: { value: 'Other' },
    });

    fireEvent.click(screen.getByRole('button', { name: form.delete }));
    const confirm = await screen.findByRole('dialog');
    fireEvent.click(
      within(confirm).getByRole('button', { name: t.delete.confirm }),
    );
    await waitFor(() => expect(del).toHaveBeenCalled());
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(
      await screen.findByRole('dialog', {
        name: catalogs[lang].Admin.form.leave.title,
      }),
    ).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
    finish(ok(undefined));
  });

  it('restarts the upload progress from zero after signing in again', async () => {
    upload.mockImplementationOnce(
      async (_file: File, options: { onProgress: (value: number) => void }) => {
        options.onProgress(70);
        throw new ApiRequestError(401, adminErrors.unauthenticated().body);
      },
    );
    upload.mockImplementation(() => new Promise(() => undefined));
    post.mockResolvedValue(ok(makeAdminMe()));
    const { container } = renderEdit(plumbed());
    await screen.findByLabelText(label(t.brand));

    fireEvent.change(fileInputs(container)[0], {
      target: { files: [imageFile()] },
    });
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(dialog.querySelectorAll('input')[1] as HTMLInputElement, {
      target: { value: 'secret' },
    });
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuenow',
        '0',
      ),
    );
  });

  it('dismisses a single warning', async () => {
    const product = plumbed({ status: 'PUBLISHED' });
    const warning = (name: string) => ({
      code: 'USED_AS_DEFAULT_MATERIAL',
      params: {
        styles: [{ id: adminIds.styles.modern, name: { en: name, uk: name } }],
      },
    });
    post.mockResolvedValue(
      ok({
        ...product,
        status: 'DRAFT',
        warnings: [warning('Alpha'), warning('Beta')],
      }),
    );
    renderEdit(product);
    await screen.findByLabelText(label(t.name, 'en'));

    fireEvent.click(screen.getByRole('button', { name: form.unpublish }));
    const dismiss = await screen.findAllByRole('button', {
      name: t.warnings.dismiss,
    });
    expect(dismiss).toHaveLength(2);
    fireEvent.click(dismiss[0] as HTMLElement);

    expect(
      screen.getAllByRole('button', { name: t.warnings.dismiss }),
    ).toHaveLength(1);
    expect(screen.queryByText(/Alpha/)).not.toBeInTheDocument();
    expect(screen.getByText(/Beta/)).toBeInTheDocument();
  });

  it('revokes the texture preview once the remote texture replaces it', async () => {
    upload.mockResolvedValue(uploadedImage(adminUuid(3000)));
    const product = makeTexturedProduct();
    const { container } = renderEdit(product);
    await screen.findByLabelText(label(t.texture.tileWidth));

    fireEvent.change(fileInputs(container)[1], {
      target: { files: [imageFile('texture.png')] },
    });

    await waitFor(() =>
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1'),
    );
  });

  it('revokes image previews once the saved product replaces them', async () => {
    const product = plumbed();
    upload.mockResolvedValue(uploadedImage(adminUuid(2001)));
    patch.mockResolvedValue(ok(product));
    const { container } = renderEdit(product);
    await screen.findByLabelText(label(t.name, 'en'));

    fireEvent.change(fileInputs(container)[0], {
      target: { files: [imageFile()] },
    });
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: t.images.primary }),
      ).toHaveLength(2),
    );
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:preview-1');
    fireEvent.click(screen.getByRole('button', { name: saveName }));

    await waitFor(() =>
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1'),
    );
  });
});
