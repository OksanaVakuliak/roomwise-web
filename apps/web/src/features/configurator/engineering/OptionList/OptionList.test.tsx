import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { makeInteriorDraft } from '@/test/fixtures/draft';
import { renderWithProviders } from '@/test/render-with-providers';
import { useRoomPricing } from '../../shell/use-room-pricing';
import { OptionList } from './OptionList';

function Harness({ kind }: { kind: 'ENGINEERING' | 'ADDITIONAL' }) {
  const pricing = useRoomPricing();
  return pricing ? (
    <OptionList kind={kind} title="Apartment" pricing={pricing} />
  ) : null;
}

async function renderList(kind: 'ENGINEERING' | 'ADDITIONAL' = 'ENGINEERING') {
  await act(async () => {
    renderWithProviders(<Harness kind={kind} />);
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
});
