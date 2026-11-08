import type { PricingData } from '@roomwise/calc-engine';
import { estimate } from '@roomwise/calc-engine';
import type { SaveCalculationBody } from '@/lib/api/calculations';
import { configurationHash } from '@/lib/draft/hash';
import type { DraftV1 } from '@/lib/draft/schema';
import { findLimitViolations } from '@/lib/engine/limits';
import {
  IncompleteDraftError,
  toConfiguration,
} from '@/lib/engine/to-configuration';

export type SaveRequest = { body: SaveCalculationBody; hash: string };

export function buildSaveRequest(
  draft: DraftV1,
  pricing: PricingData,
): SaveRequest | null {
  const { styleId } = draft;
  try {
    const configuration = toConfiguration(draft, pricing, {
      mode: 'strict',
      currency: 'USD',
    });
    if (
      configuration === null ||
      findLimitViolations(configuration, pricing).length > 0
    ) {
      return null;
    }
    return {
      body: {
        configuration,
        styleId,
        clientPricingVersion: pricing.version,
        clientTotalUsdCents: estimate(configuration, pricing).totals.usdCents,
      },
      hash: configurationHash(configuration, styleId),
    };
  } catch (error) {
    if (error instanceof IncompleteDraftError) {
      return null;
    }
    throw error;
  }
}
