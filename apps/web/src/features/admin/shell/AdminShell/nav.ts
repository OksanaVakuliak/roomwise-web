export type NavKey =
  | 'home'
  | 'catalog'
  | 'categories'
  | 'roomTypes'
  | 'materialTypes'
  | 'products'
  | 'styles'
  | 'engineering'
  | 'package'
  | 'engineeringOptions'
  | 'options'
  | 'pricing'
  | 'rules'
  | 'coefficients'
  | 'exchangeRate'
  | 'settings'
  | 'leads'
  | 'account';

export type NavItem = {
  key: NavKey;
  href: string;
};

export type NavGroup = {
  key: NavKey;
  items: readonly NavItem[];
};

export const NAV_HOME: NavItem = { key: 'home', href: '/admin' };

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    key: 'catalog',
    items: [
      { key: 'categories', href: '/admin/catalog/categories' },
      { key: 'roomTypes', href: '/admin/catalog/room-types' },
      { key: 'materialTypes', href: '/admin/catalog/material-types' },
      { key: 'products', href: '/admin/catalog/products' },
    ],
  },
  { key: 'styles', items: [{ key: 'styles', href: '/admin/styles' }] },
  {
    key: 'engineering',
    items: [
      { key: 'package', href: '/admin/engineering/package' },
      { key: 'engineeringOptions', href: '/admin/engineering/options' },
    ],
  },
  { key: 'options', items: [{ key: 'options', href: '/admin/options' }] },
  {
    key: 'pricing',
    items: [
      { key: 'rules', href: '/admin/pricing/rules' },
      { key: 'coefficients', href: '/admin/pricing/coefficients' },
      { key: 'exchangeRate', href: '/admin/pricing/exchange-rate' },
    ],
  },
  { key: 'leads', items: [{ key: 'leads', href: '/admin/leads' }] },
  { key: 'settings', items: [{ key: 'settings', href: '/admin/settings' }] },
  { key: 'account', items: [{ key: 'account', href: '/admin/account' }] },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === NAV_HOME.href) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
