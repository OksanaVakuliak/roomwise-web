import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import {
  createTestQueryClient,
  forEachLocale,
  renderWithProviders,
  seedCatalog,
} from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import {
  bathroomId,
  bedroomId,
  catalogs,
  currentDraft,
  makeCatalog,
  makeDraft,
  noLandmarkRule,
} from '../interior/interior-step.helpers';
import { ConfiguratorShell } from '../shell/ConfiguratorShell/ConfiguratorShell';
import { EngineeringStep } from './EngineeringStep/EngineeringStep';

const SOUNDPROOFING = 'Soundproofing';

async function renderEngineering(
  locale: 'en' | 'uk' = 'en',
  draft = makeDraft(),
) {
  setViewport(1024);
  useDraft.setState({ ...draft, revision: 1 });
  const queryClient = createTestQueryClient();
  seedCatalog(queryClient, locale);
  queryClient.setQueryData(['room-types', locale], makeCatalog());
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <ConfiguratorShell>
        <EngineeringStep />
      </ConfiguratorShell>,
      { url: '/configurator/engineering', locale, catalog: false, queryClient },
    );
  });
  return result;
}

function sectionOf(name: string) {
  return within(screen.getByRole('region', { name: new RegExp(name) }));
}

describe('engineering step rooms', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
  });

  it('renders a section for every room', async () => {
    await renderEngineering();

    for (const name of ['Living room', 'Bathroom', 'Bedroom']) {
      expect(
        screen.getByRole('heading', { level: 2, name: new RegExp(name) }),
      ).toBeInTheDocument();
    }
  });

  it('offers the heated floor only in room types the option allows', async () => {
    await renderEngineering();
    const title = catalogs.en.HeatedFloorSwitch.title;

    expect(
      sectionOf('Bathroom').getByRole('switch', { name: title }),
    ).toBeChecked();
    expect(
      sectionOf('Living room').queryByRole('switch', { name: title }),
    ).not.toBeInTheDocument();
    expect(
      sectionOf('Bedroom').queryByRole('switch', { name: title }),
    ).not.toBeInTheDocument();
  });

  it('lists the room options of every room', async () => {
    await renderEngineering();

    for (const name of ['Living room', 'Bathroom', 'Bedroom']) {
      expect(
        sectionOf(name).getByRole('switch', { name: SOUNDPROOFING }),
      ).not.toBeChecked();
    }
  });

  it('turns the heated floor of its room off and on', async () => {
    await renderEngineering();
    const revision = useDraft.getState().revision;
    const toggle = sectionOf('Bathroom').getByRole('switch', {
      name: catalogs.en.HeatedFloorSwitch.title,
    });

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(currentDraft().rooms[1].heatedFloor).toBe(false);
    expect(useDraft.getState().revision).toBe(revision + 1);
    expect(toggle).not.toBeChecked();

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(currentDraft().rooms[1].heatedFloor).toBe(true);
  });

  it('adds a room option only to its own room', async () => {
    await renderEngineering();

    await act(async () => {
      fireEvent.click(
        sectionOf('Bedroom').getByRole('switch', { name: SOUNDPROOFING }),
      );
    });

    expect(currentDraft().options['opt-soundproofing']).toEqual({
      roomClientIds: [bedroomId],
    });
    expect(
      sectionOf('Living room').getByRole('switch', { name: SOUNDPROOFING }),
    ).not.toBeChecked();
    expect(
      sectionOf('Bedroom').getByRole('switch', { name: SOUNDPROOFING }),
    ).toBeChecked();
  });

  it('shows the heated floor price of the room', async () => {
    await renderEngineering();

    expect(
      sectionOf('Bathroom').getByRole('switch', {
        name: catalogs.en.HeatedFloorSwitch.title,
      }),
    ).toHaveAccessibleDescription(/\$\d/);
  });

  it('prices the heated floor of a room that has it turned off', async () => {
    const draft = makeDraft();
    await renderEngineering('en', {
      ...draft,
      rooms: draft.rooms.map((room) =>
        room.clientId === bathroomId ? { ...room, heatedFloor: false } : room,
      ),
    });

    expect(
      sectionOf('Bathroom').getByRole('switch', {
        name: catalogs.en.HeatedFloorSwitch.title,
      }),
    ).toHaveAccessibleDescription(/\$\d/);
  });

  it.each(forEachLocale)(
    'renders in %s with no axe violations',
    async (locale) => {
      const { container } = await renderEngineering(locale);
      const text = catalogs[locale];

      expect(
        sectionOf('Bathroom').getByRole('switch', {
          name: text.HeatedFloorSwitch.title,
        }),
      ).toBeInTheDocument();
      expect(await axe(container, noLandmarkRule)).toHaveNoViolations();
    },
  );
});
