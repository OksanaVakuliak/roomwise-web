import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { MAIN_ID } from './main-id';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('points at the main landmark', () => {
    renderWithProviders(<SkipLink />);
    expect(
      screen.getByRole('link', { name: 'Skip to content' }),
    ).toHaveAttribute('href', `#${MAIN_ID}`);
  });

  it('is translated', () => {
    renderWithProviders(<SkipLink />, { locale: 'uk' });
    expect(
      screen.getByRole('link', { name: 'Перейти до вмісту' }),
    ).toBeInTheDocument();
  });

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = renderWithProviders(<SkipLink />, { locale });
    expect(await axe(container)).toHaveNoViolations();
  });
});
