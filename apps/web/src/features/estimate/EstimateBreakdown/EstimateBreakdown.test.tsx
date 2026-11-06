import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearEstimateCache, runEstimate } from '@/lib/engine/run-estimate';
import { moneyMinor } from '@/lib/format';
import { makeInteriorDraft } from '@/test/fixtures';
import { makePricingData } from '@/test/fixtures/pricing-data';
import { renderWithProviders } from '@/test/render-with-providers';
import {
  buildEstimateModel,
  type EstimateCatalog,
  type EstimateModel,
  toEstimateRooms,
} from '../model';
import { EstimateBreakdown } from './EstimateBreakdown';

const pricing = makePricingData();

const catalog: EstimateCatalog = {
  product: (id) => ({ name: `Product ${id}`, brand: 'Acme' }),
  category: (id) => `Category ${id}`,
  option: (id) => `Option ${id}`,
  packageItem: (id) => `Package ${id}`,
  rule: (id) => `Rule ${id}`,
};

function makeModel(): EstimateModel {
  const draft = makeInteriorDraft();
  const { estimate } = runEstimate({
    draft,
    draftRevision: 1,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  });
  if (estimate === null) {
    throw new Error('estimate expected');
  }
  return buildEstimateModel({
    estimate,
    rooms: toEstimateRooms(draft.rooms, (code) => code),
    catalog,
  });
}

beforeEach(clearEstimateCache);

describe('EstimateBreakdown', () => {
  it('renders section subtotals in the display currency', () => {
    const model = makeModel();
    renderWithProviders(
      <EstimateBreakdown model={model} currency="UAH" locale="en" />,
    );
    const materials = screen.getByRole('region', { name: 'Materials' });
    const subtotal = model.materials.subtotal;
    expect(subtotal?.uahKopecks).not.toBeNull();
    const expected = moneyMinor(subtotal?.uahKopecks ?? 0, 'UAH', 'en');
    expect(
      within(materials).getAllByText(
        (content) =>
          content.replace(/\s/g, ' ') === expected.replace(/\s/g, ' '),
      ).length,
    ).toBeGreaterThan(0);
  });

  it('falls back to USD when kopecks are missing', () => {
    const model = makeModel();
    const stripped: EstimateModel = {
      ...model,
      engineering: {
        ...model.engineering,
        subtotal: model.engineering.subtotal && {
          usdCents: 12345,
          uahKopecks: null,
        },
      },
    };
    renderWithProviders(
      <EstimateBreakdown model={stripped} currency="UAH" locale="en" />,
    );
    const section = screen.getByRole('region', { name: 'Engineering' });
    expect(within(section).getByText('$123.45')).toBeInTheDocument();
  });

  it('shows actions unless read-only', () => {
    const model = makeModel();
    const renderAction = () => <button type="button">Change</button>;
    const { unmount } = renderWithProviders(
      <EstimateBreakdown
        model={model}
        currency="USD"
        locale="en"
        renderAction={renderAction}
      />,
    );
    expect(screen.getAllByRole('button', { name: 'Change' }).length).toBe(
      model.materials.rooms.length +
        (model.materials.balcony ? 1 : 0) +
        1 +
        (model.engineering.lines.length > 0 ? 1 : 0) +
        (model.additional.lines.length > 0 ? 1 : 0),
    );
    unmount();
    renderWithProviders(
      <EstimateBreakdown
        model={model}
        currency="USD"
        locale="en"
        readOnly
        renderAction={renderAction}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Change' })).toBeNull();
  });

  it('renders disabled lines with a mark and warnings as text', () => {
    const model = makeModel();
    const [room, ...rest] = model.materials.rooms;
    const [first, ...lines] = room?.lines ?? [];
    const edited: EstimateModel = {
      ...model,
      materials: {
        ...model.materials,
        rooms: [
          {
            ...room,
            roomClientId: room?.roomClientId ?? '',
            name: room?.name ?? '',
            subtotal: room?.subtotal ?? null,
            lines: [
              {
                ...first,
                disabled: true,
              },
              ...lines.map((line, index) =>
                index === 0
                  ? {
                      ...line,
                      warnings: [{ code: 'HEATED_FLOOR_INCOMPATIBLE' }],
                    }
                  : line,
              ),
            ],
          },
          ...rest,
        ],
      },
    } as EstimateModel;
    renderWithProviders(
      <EstimateBreakdown model={edited} currency="USD" locale="en" />,
    );
    expect(screen.getByText('Excluded')).toBeInTheDocument();
    expect(
      screen.getByText('Heated floor is not compatible with the chosen floor'),
    ).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });
});
