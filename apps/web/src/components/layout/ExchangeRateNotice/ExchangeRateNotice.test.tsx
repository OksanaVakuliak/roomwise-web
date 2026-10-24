import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetExchangeRate, useExchangeRate } from '@/stores/exchange-rate';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { ExchangeRateNotice } from './ExchangeRateNotice';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));
vi.mock('@/i18n/navigation', () => ({ Link: () => null }));

describe('ExchangeRateNotice', () => {
  beforeEach(() => {
    resetExchangeRate();
  });

  it('renders nothing without a pending notice', () => {
    const { container } = renderWithProviders(<ExchangeRateNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('explains the fallback to dollars and can be dismissed', async () => {
    const { container } = renderWithProviders(<ExchangeRateNotice />);

    act(() => useExchangeRate.setState({ notice: true }));

    expect(
      await screen.findByText(
        'The hryvnia rate is unavailable right now, so amounts are shown in US dollars.',
      ),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(useExchangeRate.getState().notice).toBe(false);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('is translated', async () => {
    renderWithProviders(<ExchangeRateNotice />, { locale: 'uk' });
    act(() => useExchangeRate.setState({ notice: true }));
    expect(
      await screen.findByText(
        'Курс гривні зараз недоступний, тож суми показано в доларах США.',
      ),
    ).toBeInTheDocument();
  });
});
