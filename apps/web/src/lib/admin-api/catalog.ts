import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { components } from '@/generated/api';
import { unwrap, useCatalogReady } from '@/lib/api/catalog';
import { api } from '@/lib/api/client';
import { createWriteGate, type WriteGate } from '@/lib/api/write';
import { acknowledged } from './acknowledged';
import { adminKeys } from './keys';

type Schemas = components['schemas'];

export type AdminRoomType = Schemas['RoomTypeAdminDto_Output'];
export type AdminCategory = Schemas['CategoryAdminDto_Output'];
export type AdminMaterialType = Schemas['MaterialTypeAdminDto_Output'];
export type RenameRoomTypeBody = Schemas['PatchRoomTypeDto'];
export type ReplaceRoomTypeCategoriesBody =
  Schemas['ReplaceRoomTypeCategoriesDto'];
export type CreateCategoryBody = Schemas['CreateCategoryDto'];
export type UpdateCategoryBody = Schemas['PatchCategoryDto'];
export type CategoryStatusBody = Schemas['UpdateCategoryStatusDto'];
export type CreateMaterialTypeBody = Schemas['CreateMaterialTypeDto'];
export type UpdateMaterialTypeBody = Schemas['UpdateMaterialTypeDto'];

const catalogArea = () => adminKeys.area('catalog');

export async function fetchRoomTypes(): Promise<AdminRoomType[]> {
  const { items } = await unwrap(api.GET('/api/v1/admin/room-types'));
  return items;
}

export async function fetchCategories(): Promise<AdminCategory[]> {
  const { items } = await unwrap(api.GET('/api/v1/admin/categories'));
  return items;
}

export async function fetchMaterialTypes(): Promise<AdminMaterialType[]> {
  const { items } = await unwrap(api.GET('/api/v1/admin/material-types'));
  return items;
}

export function renameRoomType(
  gate: WriteGate,
  id: string,
  body: RenameRoomTypeBody,
): Promise<AdminRoomType> {
  return gate.write(
    () =>
      api.PATCH('/api/v1/admin/room-types/{id}', {
        params: { path: { id } },
        body,
      }),
    crypto.randomUUID(),
    { retry: false },
  );
}

export function replaceRoomTypeCategories(
  gate: WriteGate,
  id: string,
  body: ReplaceRoomTypeCategoriesBody,
): Promise<AdminRoomType> {
  return gate.write(
    () =>
      api.PUT('/api/v1/admin/room-types/{id}/categories', {
        params: { path: { id } },
        body,
      }),
    crypto.randomUUID(),
    { retry: false },
  );
}

export function createCategory(
  gate: WriteGate,
  body: CreateCategoryBody,
): Promise<AdminCategory> {
  return gate.write(
    () => api.POST('/api/v1/admin/categories', { body }),
    crypto.randomUUID(),
    { retry: false },
  );
}

export function updateCategory(
  gate: WriteGate,
  id: string,
  body: UpdateCategoryBody,
): Promise<AdminCategory> {
  return gate.write(
    () =>
      api.PATCH('/api/v1/admin/categories/{id}', {
        params: { path: { id } },
        body,
      }),
    crypto.randomUUID(),
    { retry: false },
  );
}

export async function deleteCategory(
  gate: WriteGate,
  id: string,
): Promise<void> {
  await gate.write(
    async () =>
      acknowledged(
        await api.DELETE('/api/v1/admin/categories/{id}', {
          params: { path: { id } },
        }),
      ),
    crypto.randomUUID(),
    { retry: false },
  );
}

export function changeCategoryStatus(
  gate: WriteGate,
  id: string,
  body: CategoryStatusBody,
): Promise<AdminCategory> {
  return gate.write(
    () =>
      api.POST('/api/v1/admin/categories/{id}/status', {
        params: { path: { id } },
        body,
      }),
    crypto.randomUUID(),
    { retry: false },
  );
}

export function createMaterialType(
  gate: WriteGate,
  body: CreateMaterialTypeBody,
): Promise<AdminMaterialType> {
  return gate.write(
    () => api.POST('/api/v1/admin/material-types', { body }),
    crypto.randomUUID(),
    { retry: false },
  );
}

export function updateMaterialType(
  gate: WriteGate,
  id: string,
  body: UpdateMaterialTypeBody,
): Promise<AdminMaterialType> {
  return gate.write(
    () =>
      api.PATCH('/api/v1/admin/material-types/{id}', {
        params: { path: { id } },
        body,
      }),
    crypto.randomUUID(),
    { retry: false },
  );
}

export function useRoomTypes() {
  const ready = useCatalogReady();
  return useQuery({
    queryKey: adminKeys.area('catalog', 'room-types'),
    queryFn: fetchRoomTypes,
    enabled: ready,
  });
}

export function useRoomType(id: string | undefined) {
  const ready = useCatalogReady();
  return useQuery({
    queryKey: adminKeys.area('catalog', 'room-types'),
    queryFn: fetchRoomTypes,
    enabled: ready && id !== undefined,
    select: (items) => items.find((item) => item.id === id) ?? null,
  });
}

export function useCategories() {
  const ready = useCatalogReady();
  return useQuery({
    queryKey: adminKeys.area('catalog', 'categories'),
    queryFn: fetchCategories,
    enabled: ready,
  });
}

export function useCategory(id: string | undefined) {
  const ready = useCatalogReady();
  return useQuery({
    queryKey: adminKeys.area('catalog', 'categories'),
    queryFn: fetchCategories,
    enabled: ready && id !== undefined,
    select: (items) => items.find((item) => item.id === id) ?? null,
  });
}

export function useMaterialTypes() {
  const ready = useCatalogReady();
  return useQuery({
    queryKey: adminKeys.area('catalog', 'material-types'),
    queryFn: fetchMaterialTypes,
    enabled: ready,
  });
}

function useCatalogMutation<Variables, Result>(
  write: (gate: WriteGate, variables: Variables) => Promise<Result>,
) {
  const queryClient = useQueryClient();
  const [gate] = useState(createWriteGate);
  return useMutation({
    mutationFn: (variables: Variables) => write(gate, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogArea() }),
  });
}

export function useRenameRoomType() {
  return useCatalogMutation(
    (gate, { id, body }: { id: string; body: RenameRoomTypeBody }) =>
      renameRoomType(gate, id, body),
  );
}

export function useReplaceRoomTypeCategories() {
  return useCatalogMutation(
    (gate, { id, body }: { id: string; body: ReplaceRoomTypeCategoriesBody }) =>
      replaceRoomTypeCategories(gate, id, body),
  );
}

export function useCreateCategory() {
  return useCatalogMutation((gate, body: CreateCategoryBody) =>
    createCategory(gate, body),
  );
}

export function useUpdateCategory() {
  return useCatalogMutation(
    (gate, { id, body }: { id: string; body: UpdateCategoryBody }) =>
      updateCategory(gate, id, body),
  );
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const [gate] = useState(createWriteGate);
  return useMutation({
    mutationFn: (id: string) => deleteCategory(gate, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogArea() });
    },
  });
}

export function useChangeCategoryStatus() {
  return useCatalogMutation(
    (gate, { id, body }: { id: string; body: CategoryStatusBody }) =>
      changeCategoryStatus(gate, id, body),
  );
}

export function useCreateMaterialType() {
  return useCatalogMutation((gate, body: CreateMaterialTypeBody) =>
    createMaterialType(gate, body),
  );
}

export function useUpdateMaterialType() {
  return useCatalogMutation(
    (gate, { id, body }: { id: string; body: UpdateMaterialTypeBody }) =>
      updateMaterialType(gate, id, body),
  );
}
