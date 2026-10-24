import { type PricingData, PricingDataSchema } from '@roomwise/calc-engine';

export const PRICING_DATA_PATH = '/api/v1/public/pricing-data';

export type PricingDataResponse =
  | { kind: 'not-modified' }
  | { kind: 'modified'; data: PricingData; etag: string | null };

export async function fetchPricingData(
  etag: string | null,
): Promise<PricingDataResponse> {
  const response = await fetch(PRICING_DATA_PATH, {
    cache: 'no-store',
    headers: etag ? { 'If-None-Match': etag } : undefined,
  });
  if (response.status === 304) {
    return { kind: 'not-modified' };
  }
  if (!response.ok) {
    throw new Error(`Pricing data request failed with ${response.status}`);
  }
  const data = PricingDataSchema.parse(await response.json());
  return { kind: 'modified', data, etag: response.headers.get('ETag') };
}
