import { fireEvent, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { usePreferences } from '@/stores/preferences';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { AppHeader } from './AppHeader';

const replace = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={`/en${href === '/' ? '' : href}`} {...rest} />
  ),
  useRouter: () => ({ replace }),
  usePathname: () => '/',
}));

describe('AppHeader', () => {
  it('renders a banner landmark', () => {
    renderWithProviders(<AppHeader />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('links the brand to the home page', () => {
    renderWithProviders(<AppHeader />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/en');
    expect(screen.getByRole('link')).toHaveTextContent('Roomwise');
  });

  it('provides language, currency and theme switches', () => {
    renderWithProviders(<AppHeader />);
    const group = screen.getByRole('group', { name: 'Preferences' });
    expect(group.querySelectorAll('button')).toHaveLength(3);
  });

  it('switches the locale route and currency', () => {
    renderWithProviders(<AppHeader />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch language to Ukrainian' }),
    );
    expect(replace).toHaveBeenCalledWith('/', { locale: 'uk' });
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch currency to UAH' }),
    );
    expect(usePreferences.getState().currency).toBe('UAH');
  });

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = renderWithProviders(<AppHeader />, { locale });
    expect(await axe(container)).toHaveNoViolations();
  });
});
