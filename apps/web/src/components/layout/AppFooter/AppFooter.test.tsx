import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { AppFooter } from './AppFooter';

describe('AppFooter', () => {
  it('renders a contentinfo landmark', () => {
    renderWithProviders(<AppFooter />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Roomwise');
  });

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = renderWithProviders(<AppFooter />, { locale });
    expect(await axe(container)).toHaveNoViolations();
  });
});
