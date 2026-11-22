export type AdminArea =
  | 'me'
  | 'catalog'
  | 'styles'
  | 'engineering'
  | 'options'
  | 'pricing'
  | 'leads'
  | 'settings';

export const adminKeys = {
  all: () => ['admin'] as const,
  area: (area: AdminArea, ...parts: readonly unknown[]) =>
    ['admin', area, ...parts] as const,
  me: () => ['admin', 'me'] as const,
};
