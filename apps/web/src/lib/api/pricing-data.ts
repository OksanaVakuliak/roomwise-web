import { type PricingData, PricingDataSchema } from '@roomwise/calc-engine';

export const PRICING_DATA_PATH = '/api/v1/public/pricing-data';

export class PricingDataRequestError extends Error {
  constructor(readonly status: number) {
    super(`Pricing data request failed with ${status}`);
    this.name = 'PricingDataRequestError';
  }
}

export class PricingDataNetworkError extends Error {
  constructor(options: { cause: unknown }) {
    super('Pricing data request did not reach the server', options);
    this.name = 'PricingDataNetworkError';
  }
}

export type PricingDataResponse =
  | { kind: 'not-modified' }
  | { kind: 'modified'; data: PricingData; etag: string | null };

export async function fetchPricingData(
  etag: string | null,
): Promise<PricingDataResponse> {
  let response: Response;
  try {
    response = await fetch(PRICING_DATA_PATH, {
      cache: 'no-store',
      headers: etag ? { 'If-None-Match': etag } : undefined,
    });
  } catch (cause) {
    throw new PricingDataNetworkError({ cause });
  }
  if (response.status === 304) {
    return { kind: 'not-modified' };
  }
  if (!response.ok) {
    throw new PricingDataRequestError(response.status);
  }
  const data = PricingDataSchema.parse(await response.json());
  return { kind: 'modified', data, etag: response.headers.get('ETag') };
}
