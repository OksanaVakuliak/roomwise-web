import type { PricingData } from '@roomwise/calc-engine';
import { create } from 'zustand';
import {
  fetchPricingData,
  PricingDataNetworkError,
  PricingDataRequestError,
} from '@/lib/api/pricing-data';
import { isServerUnavailable } from '@/lib/api/server-unavailable';
import { captureException } from '@/lib/monitoring/client';
import { rewarm } from '@/lib/warmup';
import { createSafeStorage } from './safe-storage';

export const PRICING_VERSION_KEY = 'roomwise-pricing-version';

const versionStorage = createSafeStorage();

function readStoredVersion(): string | null {
  const raw = versionStorage.getItem(PRICING_VERSION_KEY);
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}

export type PriceUpdate = { from: string; to: string };

type PricingDataState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: PricingData | null;
  etag: string | null;
  version: string | null;
  checkedAt: number | null;
  priceUpdate: PriceUpdate | null;
  acknowledgePriceUpdate: () => void;
};

const INITIAL = {
  status: 'idle',
  data: null,
  etag: null,
  version: null,
  checkedAt: null,
  priceUpdate: null,
} as const;

export const usePricingData = create<PricingDataState>()((set) => ({
  ...INITIAL,
  acknowledgePriceUpdate: () => set({ priceUpdate: null }),
}));

let pending: Promise<void> | undefined;
let generation = 0;

export function resetPricingData(): void {
  generation += 1;
  pending = undefined;
  versionStorage.removeItem(PRICING_VERSION_KEY);
  usePricingData.setState(INITIAL);
}

export function seedPricingData(data: PricingData, etag: string | null): void {
  usePricingData.setState({
    status: 'ready',
    data,
    etag,
    version: data.version,
    checkedAt: Date.now(),
  });
}

async function run(started: number): Promise<void> {
  const before = usePricingData.getState();
  if (!before.data) {
    usePricingData.setState({ status: 'loading' });
  }
  try {
    const response = await fetchPricingData(before.etag);
    if (started !== generation) {
      return;
    }
    const current = usePricingData.getState();
    if (response.kind === 'not-modified') {
      if (!current.data) {
        throw new Error('Pricing data was not modified but none is stored');
      }
      usePricingData.setState({ status: 'ready', checkedAt: Date.now() });
      return;
    }
    const { data, etag } = response;
    const known = current.version ?? readStoredVersion();
    versionStorage.setItem(PRICING_VERSION_KEY, JSON.stringify(data.version));
    usePricingData.setState({
      status: 'ready',
      data,
      etag,
      version: data.version,
      checkedAt: Date.now(),
      priceUpdate:
        known !== null && known !== data.version
          ? {
              from: current.priceUpdate?.from ?? known,
              to: data.version,
            }
          : current.priceUpdate,
    });
  } catch (error) {
    if (started === generation) {
      if (
        error instanceof PricingDataRequestError &&
        isServerUnavailable(error.status, error.apiError)
      ) {
        void rewarm();
      } else if (!(error instanceof PricingDataNetworkError)) {
        captureException(error);
      }
      usePricingData.setState({ status: 'error' });
    }
  }
}

export function checkPricingData(): Promise<void> {
  if (!pending) {
    const started = generation;
    const request = run(started).finally(() => {
      if (pending === request) {
        pending = undefined;
      }
    });
    pending = request;
  }
  return pending;
}
