import { create } from 'zustand';
import { api } from '@/lib/api/client';

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

export function resetExchangeRate(): void {
  pending = undefined;
  useExchangeRate.setState(INITIAL);
}

let pending: Promise<void> | undefined;

async function fetchRate(): Promise<LoadedRate | null> {
  try {
    const { data } = await api.GET('/api/v1/public/pricing-data');
    const source = data?.exchangeRate;
    if (!source) {
      return null;
    }
    const uahPerUsd = Number(source.rate);
    if (!Number.isFinite(uahPerUsd) || uahPerUsd <= 0) {
      return null;
    }
    return { uahPerUsd, date: source.date, source: source.source };
  } catch {
    return null;
  }
}

export function loadExchangeRate(): Promise<void> {
  if (useExchangeRate.getState().status === 'ready') {
    return Promise.resolve();
  }
  pending ??= (async () => {
    useExchangeRate.setState({ status: 'loading' });
    const rate = await fetchRate();
    pending = undefined;
    useExchangeRate.setState(
      rate ? { status: 'ready', rate } : { status: 'unavailable', rate: null },
    );
  })();
  return pending;
}
