import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { usePricingData } from '@/stores/pricing-data';
import { axe } from '@/test/axe';
import { makeEngineering } from '@/test/fixtures/catalog';
import { makePartialDraft } from '@/test/fixtures/draft';
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

type RenderOptions = {
  engineering?: ReturnType<typeof makeEngineering>;
  pricing?: false;
  bare?: boolean;
};

async function renderEngineering(
  locale: 'en' | 'uk' = 'en',
  draft = makeDraft(),
  { engineering, pricing, bare }: RenderOptions = {},
) {
  setViewport(1024);
  useDraft.setState({ ...draft, revision: 1 });
  const queryClient = createTestQueryClient();
  seedCatalog(queryClient, locale);
  queryClient.setQueryData(['room-types', locale], makeCatalog());
  if (engineering) {
    queryClient.setQueryData(['engineering', locale], engineering);
  }
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      bare ? (
        <EngineeringStep />
      ) : (
        <ConfiguratorShell>
          <EngineeringStep />
        </ConfiguratorShell>
      ),
      {
        url: '/configurator/engineering',
        locale,
        catalog: false,
        queryClient,
        pricing,
      },
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

  it('shows a loading status while the prices are not loaded', async () => {
    await renderEngineering('en', makeDraft(), { pricing: false, bare: true });

    expect(
      screen.getByRole('status', { name: catalogs.en.EngineeringStep.loading }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('offers a retry when the prices fail to load', async () => {
    await renderEngineering('en', makeDraft(), { pricing: false, bare: true });

    await act(async () => {
      usePricingData.setState({ status: 'error' });
    });

    expect(
      screen.getByRole('heading', {
        name: catalogs.en.SystemStates.errorTitle,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: catalogs.en.SystemStates.retry }),
    ).toBeInTheDocument();
  });

  it('says so when a room has no engineering to offer', async () => {
    await renderEngineering('en', makeDraft(), {
      engineering: makeEngineering({ options: [] }),
    });
    const empty = catalogs.en.RoomEngineering.empty;

    expect(sectionOf('Living room').getByText(empty)).toBeInTheDocument();
    expect(sectionOf('Bedroom').getByText(empty)).toBeInTheDocument();
    expect(sectionOf('Bathroom').queryByText(empty)).not.toBeInTheDocument();
    expect(
      sectionOf('Bathroom').getByRole('switch', {
        name: catalogs.en.HeatedFloorSwitch.title,
      }),
    ).toBeInTheDocument();
  });

  it('keeps the options list when a room has options', async () => {
    await renderEngineering();

    expect(
      screen.queryByText(catalogs.en.RoomEngineering.empty),
    ).not.toBeInTheDocument();
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

describe('engineering step at partial scope', () => {
  const ELECTRICS = 'Replace wiring in the room';
  const PIPES = 'Replace pipes in the room';

  function partialDraft() {
    return { ...makeDraft(), object: makePartialDraft().object };
  }

  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
  });

  it('offers the wiring replacement in every room with a room-area price', async () => {
    await renderEngineering('en', partialDraft());

    for (const name of ['Living room', 'Bathroom', 'Bedroom']) {
      expect(
        sectionOf(name).getByRole('switch', { name: ELECTRICS }),
      ).toBeInTheDocument();
    }
  });

  it('offers the pipe replacement in wet rooms only', async () => {
    await renderEngineering('en', partialDraft());

    expect(
      sectionOf('Bathroom').getByRole('switch', { name: PIPES }),
    ).toBeInTheDocument();
    for (const name of ['Living room', 'Bedroom']) {
      expect(
        sectionOf(name).queryByRole('switch', { name: PIPES }),
      ).not.toBeInTheDocument();
    }
  });

  it('prices the wiring replacement by the area of the room', async () => {
    await renderEngineering('en', partialDraft());
    const living = sectionOf('Living room');
    const bedroom = sectionOf('Bedroom');
    const livingCost = living
      .getByRole('switch', { name: ELECTRICS })
      .closest('li')?.textContent;
    const bedroomCost = bedroom
      .getByRole('switch', { name: ELECTRICS })
      .closest('li')?.textContent;

    expect(livingCost).toMatch(/\d/);
    expect(bedroomCost).toMatch(/\d/);
    expect(livingCost).not.toBe(bedroomCost);
  });

  it('hides the whole package for separate works', async () => {
    await renderEngineering('en', partialDraft());

    expect(
      screen.queryByRole('region', { name: catalogs.en.PackageList.title }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Ventilation' }),
    ).not.toBeInTheDocument();
  });

  it('does not offer the replacement options at full scope', async () => {
    await renderEngineering();

    for (const name of ['Living room', 'Bathroom', 'Bedroom']) {
      for (const option of [ELECTRICS, PIPES]) {
        expect(
          sectionOf(name).queryByRole('switch', { name: option }),
        ).not.toBeInTheDocument();
      }
    }
    expect(
      screen.getAllByText(catalogs.en.PackageList.included),
    ).not.toHaveLength(0);
  });
});
