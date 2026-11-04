import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { makeInteriorDraft } from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import { renderWithProviders } from '@/test/render-with-providers';
import { useRoomPricing } from '../../shell/use-room-pricing';
import { OptionList } from './OptionList';

function Harness({ kind }: { kind: 'ENGINEERING' | 'ADDITIONAL' }) {
  const pricing = useRoomPricing();
  return pricing ? (
    <OptionList kind={kind} title="Apartment" pricing={pricing} />
  ) : null;
}

async function renderList(
  kind: 'ENGINEERING' | 'ADDITIONAL' = 'ENGINEERING',
  pricing = makePricingData(),
) {
  await act(async () => {
    renderWithProviders(<Harness kind={kind} />, { pricing });
  });
}

describe('OptionList', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    useDraft.setState({ ...makeInteriorDraft(), revision: 1, options: {} });
  });

  it('lists only apartment-level options of the kind', async () => {
    await renderList();

    expect(
      screen.getByRole('switch', { name: 'Air conditioner' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('switch')).toHaveLength(1);
  });

  it('adds and removes a project option in the draft', async () => {
    await renderList('ADDITIONAL');
    const toggle = screen.getByRole('switch', { name: /design/i });

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(useDraft.getState().options['opt-design']).toEqual({});
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(useDraft.getState().options).toEqual({});
  });

  it('describes a coefficient-priced option without a sum until it is computed', async () => {
    const base = makePricingData();
    await renderList(
      'ENGINEERING',
      makePricingData({
        options: base.options.map((option) =>
          option.id === 'opt-ac'
            ? {
                ...option,
                priceCents: null,
                priceCoefficientKeys: ['tile_glue'],
              }
            : option,
        ),
      }),
    );

    expect(
      screen.getByRole('switch', { name: 'Air conditioner' }),
    ).toHaveAccessibleDescription(/price depends on the area/);
  });

  it('shows a quantity stepper starting at the minimum for a piece option', async () => {
    await renderList();

    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: 'Air conditioner' }));
    });

    expect(useDraft.getState().options['opt-ac']).toEqual({ quantity: 1 });
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });

  it('shows the allowed range when the quantity is out of bounds', async () => {
    useDraft.setState({ options: { 'opt-ac': { quantity: 11 } } });
    await renderList();

    expect(screen.getByText('Allowed from 1 to 10')).toBeInTheDocument();
  });

  it('rounds a typed fractional quantity', async () => {
    useDraft.setState({ options: { 'opt-ac': { quantity: 2 } } });
    await renderList();

    await act(async () => {
      fireEvent.change(screen.getByRole('spinbutton'), {
        target: { value: '2.5' },
      });
    });

    expect(
      Number.isInteger(useDraft.getState().options['opt-ac']?.quantity),
    ).toBe(true);
  });

  it('keeps a chosen option that became unavailable and lets it be turned off', async () => {
    useDraft.setState({ options: { 'opt-ac': { quantity: 2 } } });
    const pricing = makePricingData();
    await renderList('ENGINEERING', {
      ...pricing,
      options: pricing.options.map((o) =>
        o.id === 'opt-ac' ? { ...o, available: false } : o,
      ),
    });

    const toggle = screen.getByRole('switch', { name: 'Air conditioner' });
    expect(screen.getByText(/No longer available/)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(useDraft.getState().options).toEqual({});
  });
});
