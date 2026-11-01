import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache, runEstimate } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import { makeInteriorDraft } from '@/test/fixtures/draft';
import { forEachLocale } from '@/test/render-with-providers';
import {
  bathroomId,
  bedroomId,
  cardNamed,
  catalogs,
  categoryRows,
  chooseButton,
  costRow,
  currentDraft,
  livingId,
  panelOf,
  pricing,
  renderStep,
  roomSection,
  showcase,
  styleSelection,
  usd,
} from './interior-step.helpers';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const HEATED_FLOOR_LINE = 'ENGINEERING:option:opt-heated-floor';
const SOUNDPROOFING_LINE = 'ENGINEERING:option:opt-soundproofing';
const SOUNDPROOFING = 'Soundproofing';
const floorQuery = `category=${categoryIds.floor}`;
const bathroomUrl = `/configurator/interior?room=${bathroomId}&${floorQuery}`;
const livingUrl = `/configurator/interior?room=${livingId}&${floorQuery}`;
const bedroomUrl = `/configurator/interior?room=${bedroomId}&${floorQuery}`;

function heatedDraft(productId: string, heatedFloor = true) {
  const base = makeInteriorDraft();
  return {
    ...base,
    rooms: [
      base.rooms[0],
      {
        ...base.rooms[1],
        heatedFloor,
        selections: {
          ...base.rooms[1].selections,
          [categoryIds.floor]: styleSelection(productId),
        },
      },
    ],
  };
}

function estimateLine(lineId: string) {
  return runEstimate({
    draft: currentDraft(),
    draftRevision: useDraft.getState().revision,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  }).estimate?.lines.find((line) => line.id === lineId);
}

async function toggle(name: string) {
  await act(async () => {
    fireEvent.click(screen.getByRole('switch', { name }));
  });
}

describe('heated floor and room options on the interior step', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
    vi.mocked(api.GET).mockReset();
  });

  describe('switch', () => {
    it.each(forEachLocale)(
      'is offered for a room type the option allows in %s',
      async (locale) => {
        await renderStep(bathroomUrl, {
          locale,
          draft: heatedDraft(productIds.tile, false),
        });

        expect(
          screen.getByRole('switch', {
            name: catalogs[locale].HeatedFloorSwitch.title,
          }),
        ).not.toBeChecked();
      },
    );

    it.each([
      ['bedroom', bedroomUrl],
      ['living room', livingUrl],
    ])('is not offered in a %s', async (_name, url) => {
      await renderStep(url);

      expect(
        screen.queryByRole('switch', {
          name: catalogs.en.HeatedFloorSwitch.title,
        }),
      ).not.toBeInTheDocument();
    });

    it('recalculates and adds the heated floor line to engineering when turned on', async () => {
      await renderStep(bathroomUrl, {
        draft: heatedDraft(productIds.tile, false),
      });
      const before = panelOf(currentDraft());
      expect(estimateLine(HEATED_FLOOR_LINE)).toBeUndefined();

      await toggle(catalogs.en.HeatedFloorSwitch.title);

      expect(currentDraft().rooms[1].heatedFloor).toBe(true);
      expect(estimateLine(HEATED_FLOOR_LINE)?.amountCents).toBeGreaterThan(0);
      const after = panelOf(currentDraft());
      expect(after.engineering?.usdCents).toBeGreaterThan(
        before.engineering?.usdCents ?? 0,
      );
      expect(costRow(catalogs.en.CostPanel.engineering)).toHaveTextContent(
        usd(after.engineering?.usdCents),
      );
    });

    it('removes the heated floor line again when turned off', async () => {
      await renderStep(bathroomUrl, { draft: heatedDraft(productIds.tile) });
      expect(estimateLine(HEATED_FLOOR_LINE)).toBeDefined();

      await toggle(catalogs.en.HeatedFloorSwitch.title);

      expect(estimateLine(HEATED_FLOOR_LINE)).toBeUndefined();
    });
  });

  describe('incompatible finish', () => {
    it.each(forEachLocale)(
      'warns on the card, in the category and in the cost panel in %s',
      async (locale) => {
        const text = catalogs[locale];
        await renderStep(bathroomUrl, {
          locale,
          draft: heatedDraft(productIds.laminate),
        });
        const list = showcase('Flooring');

        expect(cardNamed(list, 'Oak Natural Laminate')).toHaveTextContent(
          text.ProductShowcase.heatedFloorWarning,
        );
        expect(
          cardNamed(list, 'Stone Grey Porcelain Tile'),
        ).not.toHaveTextContent(text.ProductShowcase.heatedFloorWarning);
        expect(categoryRows('Bathroom')[0]).toHaveTextContent(
          text.ChosenList.heatedFloorWarning,
        );
        expect(
          screen.getByText(text.Estimate.warning.HEATED_FLOOR_INCOMPATIBLE),
        ).toBeInTheDocument();
        for (const button of within(
          cardNamed(list, 'Oak Natural Laminate'),
        ).getAllByRole('button')) {
          expect(button).toBeEnabled();
        }
      },
    );

    it('shows no warning for a compatible floor', async () => {
      await renderStep(bathroomUrl, { draft: heatedDraft(productIds.tile) });

      expect(categoryRows('Bathroom')[0]).not.toHaveTextContent(
        catalogs.en.ChosenList.heatedFloorWarning,
      );
      expect(
        screen.queryByText(
          catalogs.en.Estimate.warning.HEATED_FLOOR_INCOMPATIBLE,
        ),
      ).not.toBeInTheDocument();
    });

    it('does not block choosing the unfit floor', async () => {
      await renderStep(bathroomUrl, { draft: heatedDraft(productIds.tile) });

      await act(async () => {
        fireEvent.click(
          chooseButton(showcase('Flooring'), 'Oak Natural Laminate'),
        );
      });

      expect(currentDraft().rooms[1].selections[categoryIds.floor]).toEqual(
        expect.objectContaining({ productId: productIds.laminate }),
      );
    });
  });

  describe('room type change', () => {
    it.each(forEachLocale)(
      'turns the heated floor off with a notice in %s',
      async (locale) => {
        await renderStep(bathroomUrl, {
          locale,
          draft: heatedDraft(productIds.tile),
        });

        act(() => {
          useDraft
            .getState()
            .updateRoom(
              bathroomId,
              { roomTypeCode: 'BEDROOM' },
              undefined,
              pricing.options,
            );
        });

        expect(currentDraft().rooms[1].heatedFloor).toBe(false);
        expect(
          await screen.findByText(
            catalogs[locale].DraftNotices.heatedFloorReset,
          ),
        ).toBeInTheDocument();
        expect(estimateLine(HEATED_FLOOR_LINE)).toBeUndefined();
      },
    );
  });

  describe('room option', () => {
    it.each(forEachLocale)(
      'appears among the chosen items and in engineering in %s',
      async (locale) => {
        await renderStep(livingUrl, { locale });
        const before = panelOf(currentDraft());
        expect(estimateLine(SOUNDPROOFING_LINE)).toBeUndefined();

        await toggle(SOUNDPROOFING);

        expect(currentDraft().options['opt-soundproofing']).toEqual({
          roomClientIds: [livingId],
        });
        const section = within(roomSection('Living room'));
        expect(section.getByText(SOUNDPROOFING)).toBeInTheDocument();
        expect(
          section.getByText(catalogs[locale].ChosenList.option),
        ).toBeInTheDocument();
        expect(estimateLine(SOUNDPROOFING_LINE)?.amountCents).toBeGreaterThan(
          0,
        );
        expect(panelOf(currentDraft()).engineering?.usdCents).toBeGreaterThan(
          before.engineering?.usdCents ?? 0,
        );
      },
    );

    it('adds its cost to the room subtotal', async () => {
      await renderStep(livingUrl);
      await toggle(SOUNDPROOFING);

      const option = estimateLine(SOUNDPROOFING_LINE)?.amountCents ?? 0;
      const materials = (
        runEstimate({
          draft: currentDraft(),
          draftRevision: useDraft.getState().revision,
          pricing,
          pricingVersion: pricing.version,
          currency: 'UAH',
        }).estimate?.lines ?? []
      )
        .filter((line) => line.id.startsWith(`MATERIALS:${livingId}:`))
        .reduce((sum, line) => sum + line.amountCents, 0);

      expect(option).toBeGreaterThan(0);
      expect(
        within(roomSection('Living room')).getByRole('heading', { level: 3 }),
      ).toHaveTextContent(usd(materials + option));
    });

    it('is removed from the chosen items and the estimate by its remove button', async () => {
      await renderStep(livingUrl);
      await toggle(SOUNDPROOFING);

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: /Remove Soundproofing from/ }),
        );
      });

      expect(currentDraft().options).toEqual({});
      expect(
        screen.getByRole('switch', { name: SOUNDPROOFING }),
      ).not.toBeChecked();
      expect(estimateLine(SOUNDPROOFING_LINE)).toBeUndefined();
    });

    it('is offered in a room type the option does not restrict', async () => {
      await renderStep(bedroomUrl);

      expect(
        screen.getByRole('switch', { name: SOUNDPROOFING }),
      ).toBeInTheDocument();
    });
  });
});
