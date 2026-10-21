import { fireEvent, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import LocaleError from './error';
import LocaleNotFound from './not-found';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={`/x${href === '/' ? '' : href}`} {...rest} />
  ),
}));

describe('LocaleNotFound', () => {
  it.each([
    ['en', 'Page not found', 'Back to home'],
    ['uk', 'Сторінку не знайдено', 'На головну'],
  ] as const)('renders in %s with a way home', (locale, title, action) => {
    renderWithProviders(<LocaleNotFound />, { locale });
    expect(
      screen.getByRole('heading', { level: 1, name: title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: action })).toHaveAttribute(
      'href',
      '/x',
    );
  });

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = renderWithProviders(<LocaleNotFound />, { locale });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('LocaleError', () => {
  it.each([
    ['en', 'Something went wrong', 'Try again', 'Back to home'],
    ['uk', 'Щось пішло не так', 'Спробувати ще раз', 'На головну'],
  ] as const)(
    'renders in %s with retry and a way home',
    (locale, title, retryLabel, home) => {
      const retry = vi.fn();
      renderWithProviders(
        <LocaleError error={new Error('boom')} retry={retry} />,
        { locale },
      );
      expect(
        screen.getByRole('heading', { level: 1, name: title }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: home })).toHaveAttribute(
        'href',
        '/x',
      );
      fireEvent.click(screen.getByRole('button', { name: retryLabel }));
      expect(retry).toHaveBeenCalledOnce();
    },
  );

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = renderWithProviders(
      <LocaleError error={new Error('boom')} retry={vi.fn()} />,
      { locale },
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
