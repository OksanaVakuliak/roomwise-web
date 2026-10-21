import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetExchangeRate } from '@/stores/exchange-rate';
import { setLoadedRate } from '@/test/fixtures/exchange-rate';
import { renderWithProviders } from '@/test/render-with-providers';
import { ExchangeRateNote } from './ExchangeRateNote';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

function text(container: HTMLElement): string {
  return (container.textContent ?? '').replaceAll(' ', ' ');
}

describe('ExchangeRateNote', () => {
  beforeEach(() => {
    resetExchangeRate();
  });

  it('shows the rate and date in English', () => {
    setLoadedRate();
    const { container } = renderWithProviders(<ExchangeRateNote />, {
      currency: 'UAH',
    });
    expect(text(container)).toBe('NBU rate: ₴41.50 per $1 on 1 Oct 2026');
  });

  it('shows the rate and date in Ukrainian', () => {
    setLoadedRate();
    const { container } = renderWithProviders(<ExchangeRateNote />, {
      currency: 'UAH',
      locale: 'uk',
    });
    expect(text(container)).toBe('Курс НБУ: 41,50 ₴ за $1 на 01.10.2026');
  });

  it('drops the NBU name for a manual rate', () => {
    setLoadedRate({ source: 'MANUAL' });
    const { container } = renderWithProviders(<ExchangeRateNote />, {
      currency: 'UAH',
    });
    expect(text(container)).toBe('Rate: ₴41.50 per $1 on 1 Oct 2026');
  });

  it('renders nothing while the rate is not ready', () => {
    const { container } = renderWithProviders(<ExchangeRateNote />, {
      currency: 'UAH',
    });
    expect(container).toBeEmptyDOMElement();
  });
});
