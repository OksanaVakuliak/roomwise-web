import type { components } from '@/generated/api';

export type LeadFormSettings =
  components['schemas']['LeadFormSettingsDto_Output'];
export type LeadCreated = components['schemas']['CreateLeadResponseDto_Output'];

export function makeLeadFormSettings(
  overrides: Partial<LeadFormSettings> = {},
): LeadFormSettings {
  return {
    retentionDays: 90,
    notice:
      'Your contact details are stored for 90 days and used only to answer this request.',
    ...overrides,
  };
}

export function makeLeadCreated(
  overrides: Partial<LeadCreated> = {},
): LeadCreated {
  return {
    leadNumber: 1042,
    calculation: { publicId: 'k3m9x2q7', versionNumber: 3 },
    expiredAtSubmission: false,
    ...overrides,
  };
}
