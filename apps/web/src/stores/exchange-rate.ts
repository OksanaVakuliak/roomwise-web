import { create } from 'zustand';
import { checkPricingData, usePricingData } from './pricing-data';

export type RateSource = 'NBU' | 'MANUAL';

export type LoadedRate = {
  uahPerUsd: number;
  date: string;
  source: RateSource;
};

type ExchangeRateState = {
  status: 'idle' | 'loading' | 'ready' | 'unavailable';
  rate: LoadedRate | null;
  notice: boolean;
  dismissNotice: () => void;
};

const INITIAL = { status: 'idle', rate: null, notice: false } as const;

export const useExchangeRate = create<ExchangeRateState>()((set) => ({
  ...INITIAL,
  dismissNotice: () => set({ notice: false }),
}));

let pending: Promise<void> | undefined;
let generation = 0;
let tracking = false;

export function resetExchangeRate(): void {
  generation += 1;
  pending = undefined;
  tracking = false;
  useExchangeRate.setState(INITIAL);
}

function parseRate(
  source: { rate: string; date: string; source: RateSource } | null | undefined,
): LoadedRate | null {
  if (!source) {
    return null;
  }
  const uahPerUsd = Number(source.rate);
  if (!Number.isFinite(uahPerUsd) || uahPerUsd <= 0) {
    return null;
  }
  if (
    typeof source.date !== 'string' ||
    Number.isNaN(Date.parse(source.date))
  ) {
    return null;
  }
  return { uahPerUsd, date: source.date, source: source.source };
}

function syncFromPricing(): void {
  const { status, data } = usePricingData.getState();
  if (status === 'idle' || (status === 'loading' && !data)) {
    useExchangeRate.setState({ status: 'loading' });
    return;
  }
  const rate = parseRate(data?.exchangeRate);
  useExchangeRate.setState(
    rate
      ? { status: 'ready', rate, notice: false }
      : { status: 'unavailable', rate: null },
  );
}

usePricingData.subscribe(() => {
  if (tracking) {
    syncFromPricing();
  }
});

export function loadExchangeRate(): Promise<void> {
  if (useExchangeRate.getState().status === 'ready') {
    return Promise.resolve();
  }
  pending ??= (async () => {
    const started = generation;
    tracking = true;
    syncFromPricing();
    if (!parseRate(usePricingData.getState().data?.exchangeRate)) {
      await checkPricingData();
    }
    if (started !== generation) {
      return;
    }
    pending = undefined;
    syncFromPricing();
  })();
  return pending;
}
