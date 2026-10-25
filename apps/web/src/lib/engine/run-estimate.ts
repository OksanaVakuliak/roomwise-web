import {
  type Configuration,
  type Currency,
  estimate as computeEstimate,
  type Estimate,
  type LimitViolation,
  type PricingData,
  type Section,
} from '@roomwise/calc-engine';
import type { DraftV1 } from '@/test/fixtures/draft';
import { findLimitViolations, toFormLimitViolations } from './limits';
import { type CostPanelView, toCostPanelView } from './sections';
import { toConfiguration } from './to-configuration';

export type RunEstimateInput = {
  draft: DraftV1;
  draftRevision: number;
  pricing: PricingData;
  pricingVersion: string;
  currency: Currency;
};

export type RunEstimateResult = {
  configuration: Configuration | null;
  estimate: Estimate | null;
  violations: LimitViolation[];
  blockedLineIds: ReadonlySet<string>;
  panel: CostPanelView;
};

const CACHE_SIZE = 8;
type CacheEntry = {
  draft: DraftV1;
  pricing: PricingData;
  result: RunEstimateResult;
};

const cache = new Map<string, CacheEntry>();

function blockedLines(
  estimate: Estimate,
  violations: readonly LimitViolation[],
  configuration: Configuration,
): { lineIds: Set<string>; sections: Set<Section>; total: boolean } {
  const targets = toFormLimitViolations(violations, configuration).map(
    (violation) => violation.target,
  );
  const total = targets.some(
    (target) => target.kind === 'rooms' || target.kind === 'unknown',
  );
  const lineIds = new Set<string>();
  const sections = new Set<Section>();
  for (const line of estimate.lines) {
    const blocked = targets.some((target) => {
      switch (target.kind) {
        case 'object':
          return line.section === 'BASE' || line.section === 'OBJECT';
        case 'room':
          return line.roomClientId === target.roomClientId;
        case 'option':
          return line.optionId === target.optionId;
        default:
          return false;
      }
    });
    if (blocked) {
      lineIds.add(line.id);
      sections.add(line.section);
    }
  }
  return { lineIds, sections, total };
}

function compute(input: RunEstimateInput): RunEstimateResult {
  const { draft, pricing, currency } = input;
  const configuration = toConfiguration(draft, pricing, {
    mode: 'preview',
    currency,
  });
  if (configuration === null) {
    return {
      configuration: null,
      estimate: null,
      violations: [],
      blockedLineIds: new Set(),
      panel: toCostPanelView(null),
    };
  }
  const violations = findLimitViolations(configuration, pricing);
  const estimate = computeEstimate(configuration, pricing);
  const blocked = blockedLines(estimate, violations, configuration);
  return {
    configuration,
    estimate,
    violations,
    blockedLineIds: blocked.lineIds,
    panel: toCostPanelView(estimate, {
      blockedSections: blocked.sections,
      totalBlocked: blocked.total,
      materialsReady: draft.styleId !== null,
    }),
  };
}

export function runEstimate(input: RunEstimateInput): RunEstimateResult {
  const key = `${input.draftRevision}|${input.pricingVersion}|${input.currency}`;
  const cached = cache.get(key);
  if (
    cached &&
    cached.draft === input.draft &&
    cached.pricing === input.pricing
  ) {
    cache.delete(key);
    cache.set(key, cached);
    return cached.result;
  }
  const result = compute(input);
  cache.delete(key);
  cache.set(key, { draft: input.draft, pricing: input.pricing, result });
  if (cache.size > CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  return result;
}

export function clearEstimateCache(): void {
  cache.clear();
}
