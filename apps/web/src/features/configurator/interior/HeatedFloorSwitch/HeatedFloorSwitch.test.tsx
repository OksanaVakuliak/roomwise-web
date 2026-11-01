import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
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
import { useRoomPricing } from '../use-room-pricing';
import { HeatedFloorSwitch } from './HeatedFloorSwitch';

const catalogs = { en, uk };
const [livingId, bathroomId] = makeInteriorDraft().rooms.map(
  (room) => room.clientId,
);

function Harness({ clientId }: { clientId: string }) {
  const room = useDraft((state) =>
    state.rooms.find((item) => item.clientId === clientId),
  );
  const pricing = useRoomPricing();
  return room ? <HeatedFloorSwitch room={room} pricing={pricing} /> : null;
}

async function renderSwitch(clientId: string, locale: 'en' | 'uk' = 'en') {
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(<Harness clientId={clientId} />, { locale });
  });
  return result;
}

describe('HeatedFloorSwitch', () => {
  beforeEach(() => {
    installMemoryStorage();
    useDraft.setState({ ...makeInteriorDraft(), revision: 1 });
  });

  it('is shown for a room type the heated floor option allows', async () => {
    await renderSwitch(bathroomId);

    expect(
      screen.getByRole('switch', { name: en.HeatedFloorSwitch.title }),
    ).toBeChecked();
  });

  it('is hidden for a room type the option does not allow', async () => {
    await renderSwitch(livingId);

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('toggles the heated floor of its room', async () => {
    await renderSwitch(bathroomId);
    const revision = useDraft.getState().revision;

    await act(async () => {
      fireEvent.click(
        screen.getByRole('switch', { name: en.HeatedFloorSwitch.title }),
      );
    });

    const room = useDraft
      .getState()
      .rooms.find((item) => item.clientId === bathroomId);
    expect(room?.heatedFloor).toBe(false);
    expect(useDraft.getState().revision).toBe(revision + 1);
    expect(
      screen.getByRole('switch', { name: en.HeatedFloorSwitch.title }),
    ).not.toBeChecked();
  });

  it.each(forEachLocale)(
    'renders in %s with an accessible name and no axe violations',
    async (locale) => {
      const { container } = await renderSwitch(bathroomId, locale);

      expect(
        screen.getByRole('switch', {
          name: catalogs[locale].HeatedFloorSwitch.title,
        }),
      ).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
