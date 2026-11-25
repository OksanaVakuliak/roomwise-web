import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { components } from '@/generated/api';
import { unwrap, useCatalogReady } from '@/lib/api/catalog';
import { api } from '@/lib/api/client';
import { ApiRequestError } from '@/lib/api/request-error';
import { createWriteGate, type WriteGate } from '@/lib/api/write';
import { acknowledged } from './acknowledged';
import { adminKeys } from './keys';

type Schemas = components['schemas'];

export type AdminMe = Schemas['AdminMeDto_Output'];
export type LoginBody = Schemas['LoginDto'];
export type ChangePasswordBody = Schemas['ChangePasswordDto'];

export function login(gate: WriteGate, body: LoginBody): Promise<AdminMe> {
  return gate.write(
    () => api.POST('/api/v1/admin/auth/login', { body }),
    crypto.randomUUID(),
    { retry: false },
  );
}

export async function logout(gate: WriteGate): Promise<void> {
  await gate.write(
    async () => acknowledged(await api.POST('/api/v1/admin/auth/logout')),
    crypto.randomUUID(),
  );
}

export async function changePassword(
  gate: WriteGate,
  body: ChangePasswordBody,
): Promise<void> {
  await gate.write(
    async () =>
      acknowledged(await api.POST('/api/v1/admin/auth/password', { body })),
    crypto.randomUUID(),
  );
}

export function me(): Promise<AdminMe> {
  return unwrap(api.GET('/api/v1/admin/auth/me'));
}

export function useAdminMe() {
  const ready = useCatalogReady();
  return useQuery<AdminMe | null>({
    queryKey: adminKeys.me(),
    queryFn: me,
    enabled: ready,
    retry: (count, failure) =>
      !(failure instanceof ApiRequestError && failure.status === 401) &&
      count < 2,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const [gate] = useState(createWriteGate);
  return useMutation({
    mutationFn: (body: LoginBody) => login(gate, body),
    onSuccess: (admin) => {
      queryClient.setQueryData(adminKeys.me(), admin);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const [gate] = useState(createWriteGate);
  return useMutation({
    mutationFn: () =>
      logout(gate).catch((failure: unknown) => {
        if (failure instanceof ApiRequestError && failure.status === 401) {
          return;
        }
        throw failure;
      }),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: adminKeys.all(),
        predicate: (query) => query.queryKey[1] !== 'me',
      });
      queryClient.setQueryData<AdminMe | null>(adminKeys.me(), null);
    },
  });
}

export function useChangePassword() {
  const [gate] = useState(createWriteGate);
  return useMutation({
    mutationFn: (body: ChangePasswordBody) => changePassword(gate, body),
  });
}
