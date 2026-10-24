import { type LoadedRate, useExchangeRate } from '@/stores/exchange-rate';
import { makeRate } from './rate';

export function setLoadedRate(overrides: Partial<LoadedRate> = {}): void {
  useExchangeRate.setState({
    status: 'ready',
    rate: { source: 'NBU', ...makeRate(), ...overrides },
  });
}
