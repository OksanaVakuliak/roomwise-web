import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { Locale } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe, blockingViolations } from '@/test/axe';
import { makeAdminCategories } from '@/test/fixtures/admin/catalog';
import { adminIds } from '@/test/fixtures/admin/ids';
import { makeAdminProducts } from '@/test/fixtures/admin/products';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../../messages/en.json';
import uk from '../../../../../../messages/uk.json';
import { ProductList } from './ProductList';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;

const catalogs = { en, uk };

type Mode = 'ok' | 'empty' | 'error';

function mockApi(mode: Mode = 'ok') {
  get.mockImplementation((path: string) => {
    if (path === '/api/v1/admin/categories') {
      return Promise.resolve({
        data: makeAdminCategories(),
        response: { status: 200 },
      });
    }
    if (mode === 'error') {
      return Promise.resolve({
        error: { error: { code: 'INTERNAL' } },
        response: { status: 500 },
      });
    }
    const data =
      mode === 'empty'
        ? { items: [], page: 1, pageSize: 20, total: 0 }
        : { ...makeAdminProducts(), total: 45 };
    return Promise.resolve({ data, response: { status: 200 } });
  });
}

const productQueries = () =>
  get.mock.calls
    .filter(([path]) => path === '/api/v1/admin/products')
    .map(([, options]) => options.params.query);

function setup(locale: Locale, url = '/admin/catalog/products') {
  const view = renderWithProviders(<ProductList />, { locale, url });
  const t = catalogs[locale as 'en' | 'uk'].AdminCatalog.products.list;
  return { ...view, t };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

describe.each(forEachLocale)('ProductList (%s)', (locale) => {
  it('renders rows with thumbnail, category, price and status', async () => {
    mockApi();
    const { container, t } = setup(locale);

    const name =
      locale === 'uk' ? 'Ламінат Дуб натуральний' : 'Oak Natural Laminate';
    const link = (await screen.findAllByRole('link', { name })).at(0);
    expect(link).toHaveAttribute(
      'href',
      `/${locale}/admin/catalog/products/${adminIds.products.laminate}`,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      t.title,
    );
    expect(screen.getAllByRole('img', { name }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/24[.,]50/).length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(
        screen.getAllByText(locale === 'uk' ? 'Підлога' : 'Flooring').length,
      ).toBeGreaterThan(0),
    );
    expect(
      screen.getAllByText(catalogs[locale as 'en' | 'uk'].Admin.status.DRAFT)
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: t.new })).toHaveAttribute(
      'href',
      `/${locale}/admin/catalog/products/new`,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('opens the product on row click', async () => {
    mockApi();
    const { router } = setup(locale);
    const name =
      locale === 'uk' ? 'Ламінат Дуб натуральний' : 'Oak Natural Laminate';
    const link = (await screen.findAllByRole('link', { name })).at(0);
    const row = link?.closest('tr') ?? link?.parentElement;
    fireEvent.click(row as HTMLElement);
    expect(router.push).toHaveBeenCalledWith(
      `/${locale}/admin/catalog/products/${adminIds.products.laminate}`,
    );
  });

  it('sends the search after the debounce and resets the page', async () => {
    mockApi();
    const { location } = setup(locale, '/admin/catalog/products?page=2');
    await screen.findByRole('searchbox');
    vi.useFakeTimers();
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'oak' },
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    vi.useRealTimers();
    expect(location().search).toBe('?q=oak');
    await waitFor(() =>
      expect(productQueries()).toContainEqual({
        q: 'oak',
        page: 1,
        pageSize: 20,
      }),
    );
  });

  it('sends the category and status filters', async () => {
    mockApi();
    const { location, t } = setup(locale);
    await screen.findAllByRole('link', { name: /Laminate|Ламінат/ });
    await waitFor(() =>
      expect(
        screen.getByRole('option', {
          name: locale === 'uk' ? 'Підлога' : 'Flooring',
        }),
      ).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText(t.filters.category), {
      target: { value: adminIds.categories.flooring },
    });
    fireEvent.change(screen.getByLabelText(t.filters.status), {
      target: { value: 'DRAFT' },
    });

    expect(location().search).toContain(
      `categoryId=${adminIds.categories.flooring}`,
    );
    expect(location().search).toContain('status=DRAFT');
    await waitFor(() =>
      expect(productQueries()).toContainEqual({
        categoryId: adminIds.categories.flooring,
        status: 'DRAFT',
        page: 1,
        pageSize: 20,
      }),
    );
  });

  it('paginates through the URL', async () => {
    mockApi();
    const { location } = setup(locale);
    await screen.findAllByRole('link', { name: /Laminate|Ламінат/ });
    fireEvent.click(screen.getByRole('button', { name: /3$/ }));
    expect(location().search).toContain('page=3');
    await waitFor(() =>
      expect(productQueries()).toContainEqual({ page: 3, pageSize: 20 }),
    );
  });

  it('shows the empty state with a link to create', async () => {
    mockApi('empty');
    const { container, t } = setup(locale);
    expect(await screen.findByText(t.empty.title)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: t.new })).toHaveLength(2);
    expect(await blockingViolations(container)).toEqual([]);
  });

  it('shows the error and retries', async () => {
    mockApi('error');
    setup(locale);
    const retry = await screen.findByRole('button', {
      name: locale === 'uk' ? 'Повторити' : 'Retry',
    });
    const before = productQueries().length;
    mockApi();
    fireEvent.click(retry);
    await waitFor(() =>
      expect(productQueries().length).toBeGreaterThan(before),
    );
    expect(
      (await screen.findAllByRole('link', { name: /Laminate|Ламінат/ })).length,
    ).toBeGreaterThan(0);
  });
});
