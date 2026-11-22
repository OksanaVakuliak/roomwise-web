import type { components } from '@/generated/api';
import { makeStamp } from './ids';

export type AdminSettings =
  components['schemas']['ProjectsSettingsAdminDto_Output'];

export function makeAdminSettings(
  overrides: Partial<AdminSettings> = {},
): AdminSettings {
  return {
    calculationValidityDays: 30,
    leadRetentionDays: 90,
    leadFormNotice: {
      en: 'Your contact details are stored for 90 days and used only to answer this request.',
      uk: 'Ваші контактні дані зберігаються 90 днів і використовуються лише для відповіді на цей запит.',
    },
    lastRetentionRunAt: '2026-11-21T03:00:00.000Z',
    ...makeStamp(),
    ...overrides,
  };
}
