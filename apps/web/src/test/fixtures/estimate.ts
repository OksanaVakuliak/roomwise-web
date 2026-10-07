export type EstimateLine = {
  productId: string;
  quantity: number;
  totalCents: number;
};

export type Estimate = {
  lines: EstimateLine[];
  totalCents: number;
};

export function makeEstimateLine(
  overrides: Partial<EstimateLine> = {},
): EstimateLine {
  return {
    productId: '00000000-0000-4000-8000-000000000001',
    quantity: 22,
    totalCents: 53900,
    ...overrides,
  };
}

export function makeEstimate(overrides: Partial<Estimate> = {}): Estimate {
  const lines = overrides.lines ?? [makeEstimateLine()];
  return {
    lines,
    totalCents: lines.reduce((sum, line) => sum + line.totalCents, 0),
    ...overrides,
  };
}
