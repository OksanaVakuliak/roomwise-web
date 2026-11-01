import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import { makeInteriorDraft } from '@/test/fixtures/draft';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { useRoomPricing } from '../../interior/use-room-pricing';
import { RoomOptions } from './RoomOptions';

const catalogs = { en, uk };
const [livingId] = makeInteriorDraft().rooms.map((room) => room.clientId);
const optionName = 'Soundproofing';
function Harness({ clientId }: { clientId: string }) {
  const room = useDraft((state) =>
    state.rooms.find((item) => item.clientId === clientId),
  );
  const pricing = useRoomPricing();
  return room ? <RoomOptions room={room} pricing={pricing} /> : null;
}

async function renderOptions(locale: 'en' | 'uk' = 'en') {
  await act(async () => {
    renderWithProviders(<Harness clientId={livingId} />, { locale });
  });
}

describe('RoomOptions', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    useDraft.setState({ ...makeInteriorDraft(), revision: 1 });
  });

  it('lists the per-room engineering options of the room type with their cost', async () => {
    await renderOptions();

    const toggle = screen.getByRole('switch', { name: optionName });
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAccessibleDescription(/\$/);
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    expect(
      screen.queryByRole('switch', { name: en.HeatedFloorSwitch.title }),
    ).not.toBeInTheDocument();
  });

  it('adds and removes the room in the draft', async () => {
    await renderOptions();
    const toggle = screen.getByRole('switch', { name: optionName });

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(useDraft.getState().options['opt-soundproofing']).toEqual({
      roomClientIds: [livingId],
    });
    expect(toggle).toBeChecked();

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(useDraft.getState().options).toEqual({});
  });

  it('has no accessibility violations', async () => {
    await renderOptions();

    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });

  it.each(forEachLocale)('renders the heading in %s', async (locale) => {
    await renderOptions(locale);

    expect(
      screen.getByRole('heading', { name: catalogs[locale].RoomOptions.title }),
    ).toBeInTheDocument();
  });
});
