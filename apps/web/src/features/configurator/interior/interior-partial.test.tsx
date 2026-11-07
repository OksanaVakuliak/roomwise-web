import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache } from '@/lib/engine/run-estimate';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
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
  renderStep,
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
      within(floorRow()).getByRole('button', {
        name: new RegExp(`^${text.ChosenList.add}`),
      }),
    );
  });
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
        within(floorRow()).getByRole('button', {
          name: new RegExp(`^${text.ChosenList.add}`),
        }),
      ).toBeInTheDocument();
      expect(costRow(text.CostPanel.worksAndMaterials)).toHaveTextContent('—');
    },
  );

  it.each(forEachLocale)(
    'lists material, labor and preparation of the chosen floor in %s',
    async (locale) => {
      await renderStep(url, { draft: makePartialRoomDraft('ROUGH'), locale });
      const text = catalogs[locale].Specification.components;

      await enableFloorWithLaminate(locale);

      const line = estimateLine(currentDraft(), floorLineId);
      expect(line?.components?.map((component) => component.kind)).toEqual([
        'MATERIAL',
        'LABOR',
        'PREP',
      ]);
      const items = within(within(floorRow()).getByRole('list')).getAllByRole(
        'listitem',
      );
      expect(items.map((item) => item.firstElementChild?.textContent)).toEqual([
        text.material,
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

      expect(categoryRows('Living room')[2]).toHaveTextContent(laborMissing);
      expect(categoryRows('Living room')[0]).not.toHaveTextContent(
        laborMissing,
      );
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
    expect(within(card).getAllByRole('listitem')).toHaveLength(3);
  });
});
