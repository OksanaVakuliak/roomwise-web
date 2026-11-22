import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { DemoBanner } from './DemoBanner';

const RESET_AT = '2026-11-23T14:30:00.000Z';

describe('DemoBanner', () => {
  it('is a status with the label and the reset time', async () => {
    renderWithProviders(
      <DemoBanner resetAt={RESET_AT} label="Demo data resets at" />,
    );
    const banner = await screen.findByRole('status');
    expect(banner).toHaveTextContent('Demo data resets at');
    const time = screen.getByText(/2026|26/, { selector: 'time' });
    expect(time).toHaveAttribute('datetime', RESET_AT);
  });

  it('formats the time for the current locale', async () => {
    const en = renderWithProviders(
      <DemoBanner resetAt={RESET_AT} label="Resets" />,
      { locale: 'en' },
    );
    const enText = (await screen.findByText(/\d/, { selector: 'time' }))
      .textContent;
    en.unmount();
    renderWithProviders(<DemoBanner resetAt={RESET_AT} label="Resets" />, {
      locale: 'uk',
    });
    const ukText = (await screen.findByText(/\d/, { selector: 'time' }))
      .textContent;
    expect(enText).not.toBe(ukText);
  });

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = renderWithProviders(
      <DemoBanner resetAt={RESET_AT} label="Resets" />,
      { locale },
    );
    await screen.findByRole('status');
    expect(await axe(container)).toHaveNoViolations();
  });
});
