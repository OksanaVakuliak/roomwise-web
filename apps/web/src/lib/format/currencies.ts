export const currencies = ['USD', 'UAH'] as const;

export type Currency = (typeof currencies)[number];
