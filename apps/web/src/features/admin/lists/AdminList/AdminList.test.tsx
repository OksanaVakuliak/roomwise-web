import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/api/request-error';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { type ListSchema, useListParams } from '../use-list-params';
import { AdminList, type AdminListProps } from './AdminList';

type Row = { id: string; name: string };

const schema = {
  search: true,
  filters: { status: ['ACTIVE', 'ARCHIVED'] },
  sortKeys: ['name'],
} as const satisfies ListSchema;

const columns = [
  { key: 'name', header: 'Name', cell: (row: Row) => row.name, sortable: true },
];

const rows: Row[] = [
  { id: '1', name: 'Oak' },
  { id: '2', name: 'Pine' },
];

const getRowKey = (row: Row) => row.id;

type Overrides = Partial<
  Pick<
    AdminListProps<Row, typeof schema>,
    'rows' | 'total' | 'isLoading' | 'error' | 'refetch'
  >
>;

function Harness(overrides: Overrides) {
  const list = useListParams(schema);
  return (
    <AdminList
      list={list}
      caption="Products"
      columns={columns}
      getRowKey={getRowKey}
      rows={rows}
      total={45}
      pageSize={20}
      refetch={vi.fn()}
      empty={{
        title: 'No products yet',
        action: <button type="button">Add</button>,
      }}
      filters={<span>filter slot</span>}
      {...overrides}
    />
  );
}

describe.each(forEachLocale)('AdminList (%s)', (locale) => {
  const render = (overrides: Overrides = {}, url = '/admin/products') =>
    renderWithProviders(<Harness {...overrides} />, { locale, url });

  const resetName = locale === 'uk' ? 'Скинути фільтри' : 'Reset filters';
  const retryName = locale === 'uk' ? 'Повторити' : 'Retry';

  it('renders rows, filters and pagination without a11y violations', async () => {
    const { container } = render();
    expect(screen.getByText('Oak')).toBeInTheDocument();
    expect(screen.getByText('filter slot')).toBeInTheDocument();
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('writes the page to the URL', () => {
    const { location } = render();
    fireEvent.click(screen.getByRole('button', { name: /3$/ }));
    expect(location().search).toContain('page=3');
  });

  it('writes sort to the URL', () => {
    const { location } = render();
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(location().search).toContain('sort=name');
  });

  it('searches after the debounce and resets the page', () => {
    vi.useFakeTimers();
    const { location } = render({}, '/admin/products?page=2');
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'oak' },
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(location().search).toBe('?q=oak');
    vi.useRealTimers();
  });

  it('shows the URL query in the search field after external changes', () => {
    const { router } = render({}, '/admin/products?q=oak');
    expect(screen.getByRole('searchbox')).toHaveValue('oak');
    act(() => router.replace('/en/admin/products?q=pine'));
    expect(screen.getByRole('searchbox')).toHaveValue('pine');
  });

  it('shows the empty state when there is no data at all', async () => {
    const { container } = render({ rows: [], total: 0 });
    expect(screen.getByText('No products yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('offers a reset when filters match nothing', async () => {
    const { location, container } = render(
      { rows: [], total: 0 },
      '/admin/products?status=ACTIVE&q=zzz',
    );
    expect(screen.queryByText('No products yet')).not.toBeInTheDocument();
    const resets = screen.getAllByRole('button', { name: resetName });
    fireEvent.click(resets[resets.length - 1]);
    expect(location().search).toBe('');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows skeletons while loading', async () => {
    const { container } = render({ isLoading: true, rows: [], total: 0 });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('No products yet')).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the mapped error and retries', async () => {
    const refetch = vi.fn();
    const { container } = render({
      error: new ApiRequestError(0, { error: { code: 'network' } }),
      refetch,
      rows: [],
      total: 0,
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: retryName }));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('moves to the last page when the current one is out of range', () => {
    const { location } = render({ total: 45 }, '/admin/products?page=9');
    expect(location().search).toContain('page=3');
  });
});
