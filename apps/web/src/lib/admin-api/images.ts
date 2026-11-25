import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { components } from '@/generated/api';
import { api } from '@/lib/api/client';
import { createWriteGate, type WriteGate } from '@/lib/api/write';
import { adminKeys } from './keys';

type Schemas = components['schemas'];

export type AdminImage = Schemas['AdminImageDto_Output'];
export type PatchImageBody = Schemas['PatchImageDto'];

export function updateImage(
  gate: WriteGate,
  id: string,
  body: PatchImageBody,
): Promise<AdminImage> {
  return gate.write(
    () =>
      api.PATCH('/api/v1/admin/images/{id}', {
        params: { path: { id } },
        body,
      }),
    crypto.randomUUID(),
    { retry: 'unreached' },
  );
}

export function useUpdateImage() {
  const queryClient = useQueryClient();
  const [gate] = useState(createWriteGate);
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchImageBody }) =>
      updateImage(gate, id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminKeys.area('catalog', 'products'),
      }),
  });
}
