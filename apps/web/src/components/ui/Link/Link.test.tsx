import { screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { Link } from './Link';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={`/uk${href}`} {...rest} />
  ),
}));

describe('Link', () => {
  it('renders an anchor with a locale-aware href', () => {
    renderWithProviders(<Link href="/configurator">Open</Link>, {
      locale: 'uk',
    });
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute(
      'href',
      '/uk/configurator',
    );
  });

  it('merges a custom class', () => {
    renderWithProviders(
      <Link href="/" className="extra">
        Home
      </Link>,
    );
    expect(screen.getByRole('link')).toHaveClass('extra');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<Link href="/">Home</Link>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
