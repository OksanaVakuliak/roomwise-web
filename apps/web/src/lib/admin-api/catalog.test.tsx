import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { createWriteGate } from '@/lib/api/write';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import {
  makeAdminCategories,
  makeAdminCategory,
  makeAdminMaterialType,
  makeAdminMaterialTypes,
  makeAdminRoomType,
  makeAdminRoomTypes,
} from '@/test/fixtures/admin/catalog';
import { adminErrors } from '@/test/fixtures/admin/errors';
import { adminIds, adminUuid } from '@/test/fixtures/admin/ids';
import { createTestQueryClient } from '@/test/render-with-providers';
import {
  changeCategoryStatus,
  createCategory,
  createMaterialType,
  deleteCategory,
  renameRoomType,
  replaceRoomTypeCategories,
  updateCategory,
  updateMaterialType,
  useCategories,
  useCategory,
  useChangeCategoryStatus,
  useMaterialTypes,
  useReplaceRoomTypeCategories,
  useRoomType,
  useRoomTypes,
} from './catalog';
import { adminKeys } from './keys';

vi.mock('@/lib/api/client', () => ({
  api: {
    GET: vi.fn(),
    POST: vi.fn(),
    PATCH: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  },
}));

const mocked = (fn: unknown) => fn as ReturnType<typeof vi.fn>;
const get = mocked(api.GET);
const post = mocked(api.POST);
const patch = mocked(api.PATCH);
const put = mocked(api.PUT);
const del = mocked(api.DELETE);

function setup() {
  const queryClient = createTestQueryClient();
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { queryClient, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

describe('room types', () => {
  it('lists room types under the catalog key', async () => {
    get.mockResolvedValue({
      data: makeAdminRoomTypes(),
      response: { status: 200 },
    });
    const { queryClient, wrapper } = setup();

    const { result } = renderHook(() => useRoomTypes(), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(7));

    expect(get).toHaveBeenCalledWith('/api/v1/admin/room-types');
    expect(
      queryClient.getQueryData(adminKeys.area('catalog', 'room-types')),
    ).toBeDefined();
  });

  it('selects one room type from the list', async () => {
    get.mockResolvedValue({
      data: makeAdminRoomTypes(),
      response: { status: 200 },
    });
    const { wrapper } = setup();

    const { result } = renderHook(
      () => useRoomType(adminIds.roomTypes.BEDROOM),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data?.code).toBe('BEDROOM'));
  });

  it('sends the revision with a rename', async () => {
    const roomType = makeAdminRoomType();
    patch.mockResolvedValue({ data: roomType, response: { status: 200 } });
    const body = { name: roomType.name, revision: roomType.revision };

    await expect(
      renameRoomType(createWriteGate(), roomType.id, body),
    ).resolves.toEqual(roomType);
    expect(patch).toHaveBeenCalledWith('/api/v1/admin/room-types/{id}', {
      params: { path: { id: roomType.id } },
      body,
    });
  });

  it('replaces categories with the revision', async () => {
    const roomType = makeAdminRoomType();
    put.mockResolvedValue({ data: roomType, response: { status: 200 } });
    const body = {
      categoryIds: [adminIds.categories.flooring],
      revision: roomType.revision,
    };

    await replaceRoomTypeCategories(createWriteGate(), roomType.id, body);

    expect(put).toHaveBeenCalledWith(
      '/api/v1/admin/room-types/{id}/categories',
      { params: { path: { id: roomType.id } }, body },
    );
  });

  it('surfaces a stale revision', async () => {
    const { status, body } = adminErrors.staleRevision();
    put.mockResolvedValue({ error: body, response: { status } });

    await expect(
      replaceRoomTypeCategories(createWriteGate(), 'id', {
        categoryIds: [],
        revision: adminUuid(1),
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('invalidates the catalog area after replacing categories', async () => {
    const roomType = makeAdminRoomType();
    get.mockResolvedValue({
      data: makeAdminRoomTypes(),
      response: { status: 200 },
    });
    put.mockResolvedValue({ data: roomType, response: { status: 200 } });
    const { wrapper } = setup();

    const { result } = renderHook(
      () => ({ list: useRoomTypes(), write: useReplaceRoomTypeCategories() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data).toBeDefined());
    expect(get).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.write.mutateAsync({
        id: roomType.id,
        body: { categoryIds: [], revision: roomType.revision },
      });
    });

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });
});

describe('categories', () => {
  it('lists and selects a category', async () => {
    get.mockResolvedValue({
      data: makeAdminCategories(),
      response: { status: 200 },
    });
    const { wrapper } = setup();

    const { result } = renderHook(
      () => ({
        list: useCategories(),
        one: useCategory(adminIds.categories.plumbing),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.list.data).toHaveLength(6));
    expect(result.current.one.data?.id).toBe(adminIds.categories.plumbing);
    expect(get).toHaveBeenCalledWith('/api/v1/admin/categories');
  });

  it('creates a category', async () => {
    const category = makeAdminCategory();
    post.mockResolvedValue({ data: category, response: { status: 201 } });
    const body = {
      name: category.name,
      wastePercent: 10,
      surface: 'FLOOR' as const,
      requiresPutty: false,
    };

    await expect(createCategory(createWriteGate(), body)).resolves.toEqual(
      category,
    );
    expect(post).toHaveBeenCalledWith('/api/v1/admin/categories', { body });
  });

  it('sends a create once and rejects when the network fails', async () => {
    const body = {
      name: { en: 'Walls', uk: 'Стіни' },
      wastePercent: 10,
      surface: 'WALLS' as const,
      requiresPutty: true,
    };
    post.mockRejectedValue(new Error('offline'));
    await expect(createCategory(createWriteGate(), body)).rejects.toMatchObject(
      { status: 0 },
    );
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('updates with the revision', async () => {
    const category = makeAdminCategory();
    patch.mockResolvedValue({ data: category, response: { status: 200 } });
    const body = { wastePercent: 12, revision: category.revision };

    await updateCategory(createWriteGate(), category.id, body);

    expect(patch).toHaveBeenCalledWith('/api/v1/admin/categories/{id}', {
      params: { path: { id: category.id } },
      body,
    });
  });

  it('deletes on an empty 204 and surfaces in-use conflicts', async () => {
    del.mockResolvedValueOnce({ response: { status: 204 } });
    await expect(
      deleteCategory(createWriteGate(), 'c1'),
    ).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledWith('/api/v1/admin/categories/{id}', {
      params: { path: { id: 'c1' } },
    });

    const { status, body } = adminErrors.categoryInUse();
    del.mockResolvedValueOnce({ error: body, response: { status } });
    await expect(deleteCategory(createWriteGate(), 'c1')).rejects.toMatchObject(
      { status: 409, apiError: { code: 'CATEGORY_IN_USE' } },
    );
  });

  it('posts the status change with the revision', async () => {
    const category = makeAdminCategory({ status: 'ARCHIVED' });
    post.mockResolvedValue({ data: category, response: { status: 200 } });
    const body = { status: 'ARCHIVED' as const, revision: category.revision };

    await changeCategoryStatus(createWriteGate(), category.id, body);

    expect(post).toHaveBeenCalledWith('/api/v1/admin/categories/{id}/status', {
      params: { path: { id: category.id } },
      body,
    });
  });

  it('invalidates the catalog area after a status change', async () => {
    const category = makeAdminCategory();
    get.mockResolvedValue({
      data: makeAdminCategories(),
      response: { status: 200 },
    });
    post.mockResolvedValue({ data: category, response: { status: 200 } });
    const { wrapper } = setup();

    const { result } = renderHook(
      () => ({ list: useCategories(), write: useChangeCategoryStatus() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data).toBeDefined());

    await act(async () => {
      await result.current.write.mutateAsync({
        id: category.id,
        body: { status: 'DRAFT', revision: category.revision },
      });
    });

    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });
});

describe('material types', () => {
  it('lists material types', async () => {
    get.mockResolvedValue({
      data: makeAdminMaterialTypes(),
      response: { status: 200 },
    });
    const { wrapper } = setup();

    const { result } = renderHook(() => useMaterialTypes(), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(4));
    expect(get).toHaveBeenCalledWith('/api/v1/admin/material-types');
  });

  it('creates and updates a material type', async () => {
    const material = makeAdminMaterialType();
    post.mockResolvedValue({ data: material, response: { status: 201 } });
    patch.mockResolvedValue({ data: material, response: { status: 200 } });

    const created = { code: 'LAMINATE', name: material.name };
    await createMaterialType(createWriteGate(), created);
    expect(post).toHaveBeenCalledWith('/api/v1/admin/material-types', {
      body: created,
    });

    const changed = {
      status: 'ARCHIVED' as const,
      revision: material.revision,
    };
    await updateMaterialType(createWriteGate(), material.id, changed);
    expect(patch).toHaveBeenCalledWith('/api/v1/admin/material-types/{id}', {
      params: { path: { id: material.id } },
      body: changed,
    });
  });
});
