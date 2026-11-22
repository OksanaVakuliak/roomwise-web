'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';

export type ListFilterName = 'status' | 'categoryId' | 'kind' | 'group';

export type ListSort = { key: string; dir: 'asc' | 'desc' };

export type ListSchema = {
  search?: boolean;
  filters?: Partial<Record<ListFilterName, readonly string[] | 'any'>>;
  sortKeys?: readonly string[];
  defaultSort?: ListSort;
};

export type ListParams<S extends ListSchema> = {
  q: string;
  page: number;
  sort: ListSort | undefined;
  filters: { [K in keyof NonNullable<S['filters']>]?: string };
};

export type ListParamsApi<S extends ListSchema> = {
  params: ListParams<S>;
  hasSearch: boolean;
  isFiltered: boolean;
  searchKey: number;
  setQuery: (value: string) => void;
  setFilter: (name: keyof NonNullable<S['filters']>, value: string) => void;
  setPage: (page: number) => void;
  clampPage: (page: number) => void;
  setSort: (sort: ListSort) => void;
  reset: () => void;
};

const MAX_QUERY_LENGTH = 200;
const FILTER_NAMES: readonly ListFilterName[] = [
  'status',
  'categoryId',
  'kind',
  'group',
];

function parsePage(raw: string | null): number {
  if (raw === null || !/^\d{1,9}$/.test(raw)) return 1;
  return Math.max(1, Number(raw));
}

function parseSort(raw: string | null, schema: ListSchema) {
  if (!raw) return schema.defaultSort;
  const dir: ListSort['dir'] = raw.startsWith('-') ? 'desc' : 'asc';
  const key = raw.replace(/^-/, '');
  return schema.sortKeys?.includes(key) ? { key, dir } : schema.defaultSort;
}

function parseFilter(raw: string | null, allowed: readonly string[] | 'any') {
  if (!raw) return undefined;
  if (allowed === 'any')
    return raw.length <= MAX_QUERY_LENGTH ? raw : undefined;
  return allowed.includes(raw) ? raw : undefined;
}

export function parseListParams<S extends ListSchema>(
  search: URLSearchParams,
  schema: S,
): ListParams<S> {
  const filters: Record<string, string> = {};
  for (const name of FILTER_NAMES) {
    const allowed = schema.filters?.[name];
    if (!allowed) continue;
    const value = parseFilter(search.get(name), allowed);
    if (value !== undefined) filters[name] = value;
  }
  return {
    q: schema.search
      ? (search.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH)
      : '',
    page: parsePage(search.get('page')),
    sort: parseSort(search.get('sort'), schema),
    filters: filters as ListParams<S>['filters'],
  };
}

function serialize<S extends ListSchema>(params: ListParams<S>): string {
  const out = new URLSearchParams();
  if (params.q) out.set('q', params.q);
  for (const [name, value] of Object.entries(params.filters)) {
    if (value) out.set(name, value as string);
  }
  if (params.sort) {
    out.set(
      'sort',
      `${params.sort.dir === 'desc' ? '-' : ''}${params.sort.key}`,
    );
  }
  if (params.page > 1) out.set('page', String(params.page));
  return out.toString();
}

export function useListParams<S extends ListSchema>(
  input: S,
): ListParamsApi<S> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams.toString();

  const schemaKey = JSON.stringify(input);
  const schema = useMemo(() => JSON.parse(schemaKey) as S, [schemaKey]);

  const params = useMemo(
    () => parseListParams(new URLSearchParams(raw), schema),
    [raw, schema],
  );

  const latest = useRef(params);
  const inFlight = useRef<string[]>([]);
  const settled = useRef(raw);
  const [searchKey, setSearchKey] = useState(0);

  useEffect(() => {
    if (settled.current === raw) {
      if (inFlight.current.length === 0) latest.current = params;
      return;
    }
    settled.current = raw;
    const index = inFlight.current.indexOf(raw);
    if (index !== -1) {
      inFlight.current = inFlight.current.slice(index + 1);
      if (inFlight.current.length === 0) latest.current = params;
      return;
    }
    inFlight.current = [];
    if (params.q !== latest.current.q) setSearchKey((key) => key + 1);
    latest.current = params;
  }, [raw, params]);

  const commit = useCallback(
    (next: ListParams<S>, mode: 'push' | 'replace') => {
      latest.current = next;
      const qs = serialize(next);
      const tail = inFlight.current.at(-1) ?? settled.current;
      if (qs !== tail) inFlight.current = [...inFlight.current, qs];
      const href = qs ? `${pathname}?${qs}` : pathname;
      router[mode](href, { scroll: false });
    },
    [router, pathname],
  );

  const setQuery = useCallback(
    (value: string) => {
      const q = value.trim().slice(0, MAX_QUERY_LENGTH);
      if (q === latest.current.q) return;
      commit({ ...latest.current, q, page: 1 }, 'replace');
    },
    [commit],
  );

  const setFilter = useCallback(
    (name: keyof NonNullable<S['filters']>, value: string) => {
      const allowed = schema.filters?.[name as ListFilterName];
      const next = { ...latest.current.filters } as Record<string, string>;
      const parsed = allowed ? parseFilter(value, allowed) : undefined;
      if (parsed === undefined) delete next[name as string];
      else next[name as string] = parsed;
      commit(
        {
          ...latest.current,
          filters: next as ListParams<S>['filters'],
          page: 1,
        },
        'push',
      );
    },
    [commit, schema],
  );

  const setPage = useCallback(
    (page: number) => {
      const next = Number.isInteger(page) && page >= 1 ? page : 1;
      commit({ ...latest.current, page: next }, 'push');
    },
    [commit],
  );

  const clampPage = useCallback(
    (page: number) => {
      const next = Number.isInteger(page) && page >= 1 ? page : 1;
      commit({ ...latest.current, page: next }, 'replace');
    },
    [commit],
  );

  const setSort = useCallback(
    (sort: ListSort) => {
      if (!schema.sortKeys?.includes(sort.key)) return;
      commit({ ...latest.current, sort, page: 1 }, 'push');
    },
    [commit, schema],
  );

  const reset = useCallback(() => {
    commit({ q: '', page: 1, sort: latest.current.sort, filters: {} }, 'push');
  }, [commit]);

  const isFiltered = params.q !== '' || Object.keys(params.filters).length > 0;

  return {
    params,
    hasSearch: Boolean(schema.search),
    isFiltered,
    searchKey,
    setQuery,
    setFilter,
    setPage,
    clampPage,
    setSort,
    reset,
  };
}
