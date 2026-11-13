import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import { categoryIds, productIds, styleIds } from '@/test/fixtures/catalog';
import { forEachLocale } from '@/test/render-with-providers';
import en from '../../../../messages/en.json';
import {
  cardNamed,
  catalogs,
  categoryRows,
  costRow,
  currentDraft,
  estimateLine,
  livingId,
  makePartialRoomDraft,
  noLandmarkRule,
  offSelection,
  pricing,
  renderStep,
  roomSection,
  showcase,
  styleSelection,
  usd,
} from './interior-step.helpers';

vi.mock('@/lib/api/client', () => ({ api: { GET: vi.fn() } }));

const floorLineId = `MATERIALS:${livingId}:${categoryIds.floor}`;
const url = `/configurator/interior?room=${livingId}&category=${categoryIds.floor}`;

function floorRow() {
  return categoryRows('Living room')[0];
}

async function enableFloorWithLaminate(locale: 'en' | 'uk' = 'en') {
  const text = catalogs[locale];
  await act(async () => {
    fireEvent.click(
      within(showcase('Flooring')).getByRole('button', {
        name: text.ProductShowcase.chooseLabel.replace(
          '{name}',
          'Oak Natural Laminate',
        ),
      }),
    );
  });
}

describe('InteriorStep at partial scope', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
    vi.mocked(api.GET).mockReset();
  });

  it.each(forEachLocale)(
    'starts a new room with nothing enabled in %s',
    async (locale) => {
      await renderStep(url, { draft: makePartialRoomDraft(), locale });
      const text = catalogs[locale];

      expect(screen.getByText(text.Specification.enableHint)).toBeVisible();
      expect(
        screen.queryByRole('button', {
          name: new RegExp(`^${text.ChosenList.remove}`),
        }),
      ).toBeNull();
      expect(
        within(roomSection('Living room')).queryAllByRole('listitem'),
      ).toHaveLength(0);
      expect(costRow(text.CostPanel.worksAndMaterials)).toHaveTextContent('—');
    },
  );

  it.each(forEachLocale)(
    'has no accessibility violations with every category disabled in %s',
    async (locale) => {
      await renderStep(url, { draft: makePartialRoomDraft(), locale });

      expect(
        screen.getByText(catalogs[locale].Specification.enableHint),
      ).toBeVisible();
      expect(await axe(document.body, noLandmarkRule)).toHaveNoViolations();
    },
    30_000,
  );

  it.each(forEachLocale)(
    'lists material, labor and preparation of the chosen floor in %s',
    async (locale) => {
      await renderStep(url, { draft: makePartialRoomDraft('ROUGH'), locale });
      const text = {
        ...catalogs[locale].Specification.components,
        showDetailsPrefix:
          catalogs[locale].ChosenList.showDetails.split(':')[0],
      };

      await enableFloorWithLaminate(locale);

      const line = estimateLine(currentDraft(), floorLineId);
      expect(line?.components?.map((component) => component.kind)).toEqual([
        'MATERIAL',
        'ACCESSORY',
        'LABOR',
        'PREP',
      ]);
      fireEvent.click(
        within(floorRow()).getByRole('button', {
          name: new RegExp(`^${text.showDetailsPrefix}`),
        }),
      );
      const items = within(within(floorRow()).getByRole('list')).getAllByRole(
        'listitem',
      );
      expect(items.map((item) => item.firstElementChild?.textContent)).toEqual([
        text.material,
        pricing.accessories?.laminate_underlay?.[locale],
        text.labor,
        text.prep,
      ]);
      line?.components?.forEach((component, index) => {
        expect(items[index].lastElementChild?.textContent).toMatch(/\d/);
        expect(component.amountCents).toBeGreaterThan(0);
      });
      expect(await axe(document.body, noLandmarkRule)).toHaveNoViolations();
    },
    30_000,
  );

  it('removes the screed when the finish moves from rough to pre-finish', async () => {
    await renderStep(url, { draft: makePartialRoomDraft('ROUGH') });
    await enableFloorWithLaminate();
    const rough = estimateLine(currentDraft(), floorLineId);
    const screed = rough?.components?.find((c) => c.kind === 'PREP');
    expect(screed?.amountCents).toBeGreaterThan(0);
    expect(floorRow()).toHaveTextContent(en.Specification.components.prep);
    expect(floorRow()).toHaveTextContent(usd(screed?.amountCents));

    await act(async () => {
      useDraft.getState().setObject({ finishLevel: 'PRE_FINISH' });
    });

    const pre = estimateLine(currentDraft(), floorLineId);
    expect(pre?.amountCents).toBe(
      (rough?.amountCents ?? 0) - (screed?.amountCents ?? 0),
    );
    expect(floorRow()).not.toHaveTextContent(en.Specification.components.prep);
    expect(floorRow()).toHaveTextContent(usd(pre?.amountCents));
  });

  it.each(forEachLocale)(
    'warns when the rule has no labor price in %s',
    async (locale) => {
      await renderStep(url, {
        locale,
        draft: makePartialRoomDraft('PRE_FINISH', {
          [categoryIds.floor]: offSelection(),
          [categoryIds.walls]: offSelection(),
          [categoryIds.ceiling]: {
            ...styleSelection(productIds.ceilingPaint),
            disabled: false,
          },
        }),
      });
      const { laborMissing } = catalogs[locale].Specification;

      expect(categoryRows('Living room')).toHaveLength(1);
      expect(categoryRows('Living room')[0]).toHaveTextContent(laborMissing);
    },
  );

  it('prices the showcase card with labor and preparation', async () => {
    await renderStep(url, { draft: makePartialRoomDraft('ROUGH') });
    const card = cardNamed(showcase('Flooring'), 'Oak Natural Laminate');

    const alone = estimateLine(
      makePartialRoomDraft('ROUGH', {
        [categoryIds.floor]: styleSelection(productIds.laminate),
        [categoryIds.walls]: offSelection(),
        [categoryIds.ceiling]: offSelection(),
      }),
      floorLineId,
    );
    const material = alone?.components?.find((c) => c.kind === 'MATERIAL');
    expect(card).toHaveTextContent(usd(alone?.amountCents));
    expect(alone?.amountCents).toBeGreaterThan(material?.amountCents ?? 0);
    expect(within(card).queryAllByRole('listitem')).toHaveLength(0);
    fireEvent.click(
      within(card).getByRole('button', {
        name: /^Show price breakdown/,
      }),
    );
    expect(within(card).getAllByRole('listitem')).toHaveLength(4);
  });

  it('toggles the price breakdown of a chosen row', async () => {
    await renderStep(url, { draft: makePartialRoomDraft('ROUGH') });
    await enableFloorWithLaminate();
    const row = floorRow();
    const name = en.ChosenList.showDetails.replace('{category}', 'Flooring');

    expect(within(row).queryByRole('list')).toBeNull();
    const toggle = within(row).getByRole('button', { name });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(row).getByRole('button', { name: /^Remove Flooring/ }),
    ).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(within(row).getByRole('list')).toBeInTheDocument();
    expect(
      within(row).getByRole('button', {
        name: en.ChosenList.hideDetails.replace('{category}', 'Flooring'),
      }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  describe('fill from style', () => {
    const fillName = (locale: 'en' | 'uk') =>
      catalogs[locale].Specification.fillFromStyle;
    const styled = (productId: string | null, disabled: boolean) => ({
      productId,
      disabled,
      source: 'style' as const,
    });
    const withStyle = (
      selections: Parameters<typeof makePartialRoomDraft>[1],
      styleId: string | null = styleIds.modern,
    ) => ({ ...makePartialRoomDraft('PRE_FINISH', selections), styleId });

    it.each(forEachLocale)(
      'fills only the enabled categories in %s',
      async (locale) => {
        await renderStep(url, {
          locale,
          draft: withStyle({
            [categoryIds.floor]: styled(null, false),
            [categoryIds.walls]: styled(null, true),
            [categoryIds.ceiling]: styled(null, true),
          }),
        });

        await act(async () => {
          fireEvent.click(
            screen.getByRole('button', { name: fillName(locale) }),
          );
        });

        const selections = currentDraft().rooms[0].selections;
        expect(selections[categoryIds.floor]).toEqual(
          styled(productIds.laminate, false),
        );
        expect(selections[categoryIds.walls]).toEqual(styled(null, true));
        expect(selections[categoryIds.ceiling]).toEqual(styled(null, true));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(await axe(document.body, noLandmarkRule)).toHaveNoViolations();
      },
      30_000,
    );

    it('asks before replacing manual choices', async () => {
      await renderStep(url, {
        draft: withStyle({
          [categoryIds.floor]: {
            productId: productIds.tile,
            disabled: false,
            source: 'manual',
          },
          [categoryIds.walls]: styled(null, true),
          [categoryIds.ceiling]: styled(null, true),
        }),
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: fillName('en') }));
      });

      const dialog = screen.getByRole('dialog');
      expect(currentDraft().rooms[0].selections[categoryIds.floor]).toEqual(
        expect.objectContaining({ productId: productIds.tile }),
      );

      await act(async () => {
        fireEvent.click(
          within(dialog).getByRole('button', {
            name: en.StyleStep.confirm.confirm,
          }),
        );
      });

      expect(currentDraft().rooms[0].selections[categoryIds.floor]).toEqual(
        styled(productIds.laminate, false),
      );
    });

    it('is hidden without a chosen style', async () => {
      await renderStep(url, {
        draft: withStyle({ [categoryIds.floor]: styled(null, false) }, null),
      });

      expect(screen.queryByRole('button', { name: fillName('en') })).toBeNull();
    });

    it('is hidden at full scope', async () => {
      await renderStep(url);

      expect(screen.queryByRole('button', { name: fillName('en') })).toBeNull();
    });
  });
});
