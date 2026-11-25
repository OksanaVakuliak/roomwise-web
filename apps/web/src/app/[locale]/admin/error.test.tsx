import { fireEvent, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import AdminError from './error';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={`/x${href}`} {...rest} />
  ),
}));

describe('AdminError', () => {
  it.each([
    ['en', 'Something went wrong', 'Try again', 'Back to home'],
    ['uk', 'Щось пішло не так', 'Спробувати ще раз', 'На головну'],
  ] as const)(
    'renders in %s inside main with retry and a link to the admin home',
    (locale, title, retryLabel, home) => {
      const retry = vi.fn();
      renderWithProviders(
        <AdminError error={new Error('boom')} retry={retry} />,
        { locale },
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 1, name: title }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: home })).toHaveAttribute(
        'href',
        '/x/admin',
      );
      fireEvent.click(screen.getByRole('button', { name: retryLabel }));
      expect(retry).toHaveBeenCalledOnce();
    },
  );

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = renderWithProviders(
      <AdminError error={new Error('boom')} retry={vi.fn()} />,
      { locale },
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
