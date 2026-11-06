export const LEAD_FIELDS = [
  'name',
  'phone',
  'email',
  'comment',
  'consent',
] as const;

export type LeadField = (typeof LEAD_FIELDS)[number];

export type LeadInput = {
  name: string;
  phone: string;
  email: string;
  comment: string;
  consentText: string;
  website: string;
};

export type LeadFieldErrors = Partial<Record<LeadField, true>>;

export const LEAD_LIMITS = {
  name: 100,
  phone: 32,
  email: 254,
  comment: 1000,
} as const;

export const DEFAULT_PHONE = '+380';

const PHONE_PATTERN = /^\+\d[\d\s()-]{6,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLead(
  input: Pick<LeadInput, 'name' | 'phone' | 'email' | 'comment'>,
  consent: boolean,
): LeadFieldErrors {
  const name = input.name.trim();
  const email = input.email.trim();
  const errors: LeadFieldErrors = {};
  if (name === '' || name.length > LEAD_LIMITS.name) {
    errors.name = true;
  }
  if (!PHONE_PATTERN.test(input.phone.trim())) {
    errors.phone = true;
  }
  if (
    email !== '' &&
    (email.length > LEAD_LIMITS.email || !EMAIL_PATTERN.test(email))
  ) {
    errors.email = true;
  }
  if (input.comment.trim().length > LEAD_LIMITS.comment) {
    errors.comment = true;
  }
  if (!consent) {
    errors.consent = true;
  }
  return errors;
}

export function serverFieldErrors(
  fields: readonly { path: string }[],
): LeadFieldErrors {
  const errors: LeadFieldErrors = {};
  for (const { path } of fields) {
    const field = path === 'consent.accepted' ? 'consent' : path;
    if ((LEAD_FIELDS as readonly string[]).includes(field)) {
      errors[field as LeadField] = true;
    }
  }
  return errors;
}
