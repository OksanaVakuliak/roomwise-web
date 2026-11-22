import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render-with-providers';
import {
  type ListSchema,
  parseListParams,
  useListParams,
} from './use-list-params';

const schema = {
  search: true,
  filters: { status: ['ACTIVE', 'ARCHIVED'], categoryId: 'any' },
  sortKeys: ['name', 'price'],
  defaultSort: { key: 'name', dir: 'asc' },
} as const satisfies ListSchema;

const parse = (query: string) =>
  parseListParams(new URLSearchParams(query), schema);

function mount(url: string) {
  let api!: ReturnType<typeof useListParams<typeof schema>>;
  function Probe() {
    api = useListParams(schema);
    return null;
  }
  const view = renderWithProviders(<Probe />, { url });
  return { view, api: () => api, rerender: () => view.rerender(<Probe />) };
}

describe('parseListParams', () => {
  it('reads known values', () => {
    expect(
      parse('q=tile&status=ACTIVE&categoryId=c1&page=3&sort=-price'),
    ).toEqual({
      q: 'tile',
      page: 3,
      sort: { key: 'price', dir: 'desc' },
      filters: { status: 'ACTIVE', categoryId: 'c1' },
    });
  });

  it('drops unknown values and params outside the schema', () => {
    expect(parse('status=NOPE&kind=x&group=y&sort=color&page=0')).toEqual({
      q: '',
      page: 1,
      sort: { key: 'name', dir: 'asc' },
      filters: {},
    });
  });

  it.each(['-2', '1.5', 'abc', '', '99999999999'])(
    'falls back to page 1 for %j',
    (page) => {
      expect(parse(`page=${page}`).page).toBe(1);
    },
  );

  it('ignores q when search is disabled', () => {
    expect(parseListParams(new URLSearchParams('q=a'), {}).q).toBe('');
  });
});

describe('useListParams', () => {
  it('replaces the URL when the query changes and resets the page', () => {
    const { view, api } = mount('/admin/products?page=4&status=ACTIVE');
    act(() => api().setQuery('oak'));
    expect(view.router.replace).toHaveBeenCalledTimes(1);
    expect(view.location().search).toBe('?q=oak&status=ACTIVE&sort=name');
    expect(api().params.page).toBe(1);
  });

  it('pushes a filter change and resets the page', () => {
    const { view, api } = mount('/admin/products?page=4');
    act(() => api().setFilter('status', 'ARCHIVED'));
    expect(view.router.push).toHaveBeenCalledTimes(1);
    expect(view.location().search).toBe('?status=ARCHIVED&sort=name');
  });

  it('removes a filter set to an unknown value', () => {
    const { view, api } = mount('/admin/products?status=ACTIVE');
    act(() => api().setFilter('status', 'bogus'));
    expect(view.location().search).toBe('?sort=name');
  });

  it('combines consecutive writes made before navigation settles', () => {
    const { view, api } = mount('/admin/products');
    act(() => {
      api().setFilter('status', 'ACTIVE');
      api().setFilter('categoryId', 'c9');
    });
    expect(view.location().search).toBe(
      '?status=ACTIVE&categoryId=c9&sort=name',
    );
  });

  it('writes the page and ignores invalid pages', () => {
    const { view, api } = mount('/admin/products');
    act(() => api().setPage(3));
    expect(view.location().search).toContain('page=3');
    act(() => api().setPage(0));
    expect(view.location().search).not.toContain('page=');
  });

  it('writes sort and rejects keys outside the schema', () => {
    const { view, api } = mount('/admin/products?page=2');
    act(() => api().setSort({ key: 'price', dir: 'desc' }));
    expect(view.location().search).toBe('?sort=-price');
    act(() => api().setSort({ key: 'color', dir: 'asc' }));
    expect(view.location().search).toBe('?sort=-price');
  });

  it('resets q, filters and page but keeps sort', () => {
    const { view, api } = mount(
      '/admin/products?q=a&status=ACTIVE&page=2&sort=-price',
    );
    expect(api().isFiltered).toBe(true);
    act(() => api().reset());
    expect(view.location().search).toBe('?sort=-price');
  });

  it('keeps a typed query when a render happens before the URL updates', () => {
    const { view, api, rerender } = mount('/admin/products');
    view.router.replace.mockImplementationOnce(() => {});
    act(() => api().setQuery('oak'));
    rerender();
    act(() => api().setFilter('status', 'ACTIVE'));
    expect(view.location().search).toBe('?q=oak&status=ACTIVE&sort=name');
  });

  it('clamps the page with replace', () => {
    const { view, api } = mount('/admin/products?page=9');
    act(() => api().clampPage(3));
    expect(view.router.replace).toHaveBeenCalledTimes(1);
    expect(view.router.push).not.toHaveBeenCalled();
    expect(view.location().search).toContain('page=3');
  });

  it('changes searchKey only when q changes from outside', () => {
    const { view, api } = mount('/admin/products?q=a');
    const initial = api().searchKey;
    act(() => api().setQuery('ab'));
    expect(api().searchKey).toBe(initial);
    act(() => view.router.replace('/en/admin/products?q=zz'));
    expect(api().searchKey).toBe(initial + 1);
  });

  function lag(view: ReturnType<typeof mount>['view']) {
    const apply = view.router.replace.getMockImplementation();
    const pending: string[] = [];
    view.router.replace.mockImplementation((href: string) => {
      pending.push(href);
    });
    view.router.push.mockImplementation((href: string) => {
      pending.push(href);
    });
    return (target: number | string) =>
      apply?.(typeof target === 'number' ? pending[target] : target);
  }

  it('keeps searchKey while own URL updates land late', () => {
    const { view, api } = mount('/admin/products');
    const land = lag(view);
    const initial = api().searchKey;
    act(() => api().setQuery('ab'));
    act(() => api().setQuery('abc'));
    act(() => land(0));
    expect(api().searchKey).toBe(initial);
    act(() => land(1));
    expect(api().searchKey).toBe(initial);
    expect(api().params.q).toBe('abc');
  });

  it('keeps a filter set before an earlier commit settles', () => {
    const { view, api } = mount('/admin/products');
    const land = lag(view);
    act(() => api().setFilter('status', 'ACTIVE'));
    act(() => api().setFilter('categoryId', 'c9'));
    act(() => land(0));
    act(() => api().setPage(2));
    act(() => land(1));
    act(() => land(2));
    expect(view.location().search).toBe(
      '?status=ACTIVE&categoryId=c9&sort=name&page=2',
    );
  });

  it('treats an unknown URL as external and drops pending commits', () => {
    const { view, api } = mount('/admin/products');
    const land = lag(view);
    const initial = api().searchKey;
    act(() => api().setQuery('abc'));
    act(() => land('/en/admin/products?q=zz'));
    expect(api().searchKey).toBe(initial + 1);
    expect(api().params.q).toBe('zz');
    act(() => api().setPage(2));
    act(() => land('/en/admin/products?q=zz&sort=name&page=2'));
    expect(view.location().search).toBe('?q=zz&sort=name&page=2');
  });

  it('does not re-derive params for an inline schema', () => {
    let api!: ReturnType<typeof useListParams>;
    function Inline() {
      api = useListParams({ search: true });
      return null;
    }
    const view = renderWithProviders(<Inline />, { url: '/admin/products' });
    const first = api.params;
    view.rerender(<Inline />);
    expect(api.params).toBe(first);
  });
});
