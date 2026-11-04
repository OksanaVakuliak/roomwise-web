import { useQuery } from '@tanstack/react-query';
import type { components } from '@/generated/api';
import { unwrap, useCatalogReady, useLang } from './catalog';
import { api } from './client';
import type { WriteGate } from './write';

type Schemas = components['schemas'];

export type LeadBody = Schemas['CreateLeadRequestDto'];
export type LeadCreated = Schemas['CreateLeadResponseDto_Output'];
export type LeadFormSettings = Schemas['LeadFormSettingsDto_Output'];

export const leadKeys = {
  settings: (lang: string) => ['lead-settings', lang] as const,
};

export function submitLead(
  gate: WriteGate,
  { body, idempotencyKey }: { body: LeadBody; idempotencyKey: string },
): Promise<LeadCreated> {
  return gate.write(
    (key) =>
      api.POST('/api/v1/public/leads', {
        params: { header: { 'Idempotency-Key': key } },
        body,
      }),
    idempotencyKey,
  );
}

export function useLeadFormSettings() {
  const lang = useLang();
  const ready = useCatalogReady();
  return useQuery({
    queryKey: leadKeys.settings(lang),
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/public/leads/form-settings', {
          params: { query: { lang } },
        }),
      ),
    enabled: ready,
  });
}
