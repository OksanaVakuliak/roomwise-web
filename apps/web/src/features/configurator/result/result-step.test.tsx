import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache, runEstimate } from '@/lib/engine/run-estimate';
import { moneyMinor } from '@/lib/format';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup } from '@/lib/warmup/warmup';
import { useDraft } from '@/stores/draft';
import { resetExchangeRate } from '@/stores/exchange-rate';
import { usePricingData } from '@/stores/pricing-data';
import { axe } from '@/test/axe';
import { categoryIds, productIds } from '@/test/fixtures/catalog';
import type { DraftV1 } from '@/test/fixtures/draft';
import { setLoadedRate } from '@/test/fixtures/exchange-rate';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  createTestQueryClient,
  forEachLocale,
  renderWithProviders,
  seedCatalog,
} from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import {
  bathroomId,
  catalogs,
  currentDraft,
  livingId,
  makeCatalog,
  makeDraft,
  noLandmarkRule,
  styleSelection,
} from '../interior/interior-step.helpers';
import { ConfiguratorShell } from '../shell/ConfiguratorShell/ConfiguratorShell';
import { ResultStep } from './ResultStep/ResultStep';

const pricing = makePricingData();

type RenderOptions = {
  locale?: 'en' | 'uk';
  draft?: DraftV1;
  currency?: 'USD' | 'UAH';
  rate?: boolean;
  shell?: boolean;
  queryClient?: ReturnType<typeof createTestQueryClient>;
  pricingData?: false;
  failEngineering?: boolean;
};

function withOptions(draft: DraftV1): DraftV1 {
  return {
    ...draft,
    options: {
      'opt-design': { quantity: 1 },
      'opt-soundproofing': { roomClientIds: [bathroomId] },
    },
  };
}

async function renderResult({
  locale = 'en',
  draft = withOptions(makeDraft()),
  currency = 'USD',
  rate = true,
  shell = false,
  queryClient = createTestQueryClient(),
  pricingData,
  failEngineering = false,
}: RenderOptions = {}) {
  setViewport(1024);
  resetExchangeRate();
  if (rate) {
    setLoadedRate();
  }
  useDraft.setState({ ...draft, revision: 1 });
  seedCatalog(queryClient, locale);
  queryClient.setQueryData(['room-types', locale], makeCatalog());
  if (failEngineering) {
    queryClient.removeQueries({ queryKey: ['engineering', locale] });
    queryClient
      .getQueryCache()
      .build(queryClient, { queryKey: ['engineering', locale] })
      .setState({
        status: 'error',
        error: new Error('failed'),
        data: undefined,
      });
  }
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      shell ? (
        <ConfiguratorShell>
          <ResultStep />
        </ConfiguratorShell>
      ) : (
        <ResultStep />
      ),
      {
        url: '/configurator/result',
        locale,
        currency,
        catalog: false,
        queryClient,
        pricing: pricingData,
      },
    );
  });
  return result;
}

function estimateOf(draft: DraftV1) {
  const { estimate, panel } = runEstimate({
    draft,
    draftRevision: 1,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  });
  if (estimate === null) {
    throw new Error('estimate expected');
  }
  return { estimate, panel };
}

function expectText(element: HTMLElement, expected: string) {
  expect((element.textContent ?? '').replace(/\s/g, ' ')).toContain(
    expected.replace(/\s/g, ' '),
  );
}

function totalHeading() {
  return screen.getByRole('heading', { level: 2, name: /\d/ });
}

function sectionOf(name: string | RegExp) {
  return screen.getByRole('region', { name });
}

function amountOf(region: HTMLElement) {
  const heading = within(region).getAllByRole('heading')[0];
  return heading.parentElement as HTMLElement;
}

function rowOf(title: string, index = 0) {
  const item = screen.getAllByText(title)[index].closest('li');
  if (!item) {
    throw new Error(`No row ${title}`);
  }
  return within(item);
}

describe('result step', () => {
  beforeEach(() => {
    installMemoryStorage();
    clearEstimateCache();
    clearCardCostCache();
    resetWarmup();
  });

  it.each(forEachLocale)(
    'shows the total as the sum of the four sections in %s',
    async (locale) => {
      const draft = withOptions(makeDraft());
      const { estimate, panel } = estimateOf(draft);
      await renderResult({ locale, draft });

      const total = moneyMinor(estimate.totals.usdCents, 'USD', locale);
      expectText(totalHeading(), total);
      const parts = [
        panel.base,
        panel.materials,
        panel.engineering,
        panel.additional,
      ];
      expect(parts.reduce((sum, part) => sum + (part?.usdCents ?? 0), 0)).toBe(
        estimate.totals.usdCents,
      );
      for (const part of parts) {
        const expected = moneyMinor(part?.usdCents ?? 0, 'USD', locale).replace(
          /\s/g,
          ' ',
        );
        expect(
          screen.getAllByText(
            (content) => content.replace(/\s/g, ' ') === expected,
          ).length,
        ).toBeGreaterThan(0);
      }
    },
  );

  it('shows the engine total once, without the cost panel', async () => {
    await renderResult({ draft: withOptions(makeDraft()), shell: true });
    const { estimate } = estimateOf(useDraft.getState());

    const total = moneyMinor(estimate.totals.usdCents, 'USD', 'en');
    expect(screen.getAllByText(total, { exact: false })).toHaveLength(1);
    expect(screen.queryByText('Total on the drawing')).not.toBeInTheDocument();
  });

  it.each([
    ['USD', 'usdCents', 'USD'],
    ['UAH', 'uahKopecks', 'UAH'],
  ] as const)(
    'sums the room rows into the materials amount in %s to the last minor unit',
    async (currency, field, minorCurrency) => {
      const draft = withOptions(makeDraft());
      const { estimate } = estimateOf(draft);
      await renderResult({ draft, currency });

      const rows = estimate.lines.filter(
        (line) => line.section === 'MATERIALS',
      );
      const sum = rows.reduce(
        (acc, line) =>
          acc +
          ((field === 'usdCents' ? line.amountCents : line.amountUahKopecks) ??
            0),
        0,
      );
      expect(sum).toBe(
        field === 'usdCents'
          ? estimate.totals.sections.MATERIALS.usdCents
          : estimate.totals.sections.MATERIALS.uahKopecks,
      );
      expectText(
        amountOf(sectionOf('Materials')),
        moneyMinor(sum, minorCurrency, 'en'),
      );
    },
  );

  it('shows quantity, unit and amount of a line', async () => {
    const draft = withOptions(makeDraft());
    const { estimate } = estimateOf(draft);
    await renderResult({ draft });

    const line = estimate.lines.find(
      (item) => item.id === `MATERIALS:${livingId}:${categoryIds.walls}`,
    );
    if (!line || line.quantity === null || line.unitPriceCents === null) {
      throw new Error('walls line expected');
    }
    expect(line.amountCents).toBe(
      Math.round(line.quantity * line.unitPriceCents),
    );
    const row = rowOf('Silk White Wall Paint');
    const quantity = new Intl.NumberFormat('en', {
      maximumFractionDigits: 2,
    }).format(line.quantity);
    const unit = moneyMinor(line.unitPriceCents, 'USD', 'en');
    expectText(
      row.getByText(new RegExp(`${quantity} m²`)),
      `${quantity} m² × ${unit}`,
    );
    expect(
      row.getByText(moneyMinor(line.amountCents ?? 0, 'USD', 'en')),
    ).toBeInTheDocument();
  });

  it('shows the brand of a product', async () => {
    await renderResult();

    expect(
      within(sectionOf(/Living room/)).getAllByText(/Roomwise/).length,
    ).toBeGreaterThan(0);
  });

  it('names the room of a room-level engineering line', async () => {
    await renderResult();

    const engineering = within(sectionOf('Engineering'));
    expect(
      engineering.getAllByText(/Bathroom 1/).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('shows the room unit of a per-room option', async () => {
    await renderResult();

    expect(
      within(sectionOf('Engineering')).getByText(/1 rm × /),
    ).toBeInTheDocument();
  });

  it.each(forEachLocale)(
    'links every section back to its step in %s',
    async (locale) => {
      await renderResult({ locale });
      const text = catalogs[locale];
      const change = text.ResultStep.change;
      const sections = text.EstimateBreakdown.sections;
      const livingLink = screen
        .getAllByRole('link', { name: new RegExp(`^${change} `) })
        .find((link) => link.getAttribute('href')?.includes('interior'));
      expect(livingLink).toHaveAttribute(
        'href',
        expect.stringMatching(
          new RegExp(`^/${locale}/configurator/interior\\?room=${livingId}$`),
        ),
      );
      const hrefOf = (name: string) =>
        screen
          .getByRole('link', { name: `${change} ${name}` })
          .getAttribute('href');
      expect(hrefOf(sections.base)).toBe(`/${locale}/configurator/object`);
      expect(hrefOf(sections.engineering)).toBe(
        `/${locale}/configurator/engineering`,
      );
      expect(hrefOf(sections.additional)).toBe(
        `/${locale}/configurator/engineering`,
      );
      expect(
        screen
          .getByRole('link', { name: text.ResultStep.changeObject })
          .getAttribute('href'),
      ).toBe(`/${locale}/configurator/object`);
      expect(
        screen
          .getByRole('link', { name: text.ResultStep.changeStyle })
          .getAttribute('href'),
      ).toBe(`/${locale}/configurator/style`);
    },
  );

  it('links the bathroom to the interior step with its own id', async () => {
    await renderResult();

    expect(
      screen.getByRole('link', { name: 'Change Bathroom 1' }),
    ).toHaveAttribute('href', `/en/configurator/interior?room=${bathroomId}`);
  });

  it('shows the heated floor warning next to the affected line', async () => {
    const base = makeDraft();
    const draft = withOptions({
      ...base,
      rooms: [
        base.rooms[0],
        {
          ...base.rooms[1],
          selections: {
            ...base.rooms[1].selections,
            [categoryIds.floor]: styleSelection(productIds.laminate),
          },
        },
        base.rooms[2],
      ],
    });
    await renderResult({ draft });
    const message = catalogs.en.Estimate.warning.HEATED_FLOOR_INCOMPATIBLE;

    const row = rowOf('Oak Natural Laminate', 1);
    expect(row.getByText(message)).toBeInTheDocument();
  });

  it('shows no heated floor warning for a compatible floor', async () => {
    await renderResult();

    expect(
      screen.queryByText(
        catalogs.en.Estimate.warning.HEATED_FLOOR_INCOMPATIBLE,
      ),
    ).not.toBeInTheDocument();
  });

  it.each(forEachLocale)(
    'shows kopeck amounts and the rate note in hryvnias in %s',
    async (locale) => {
      const draft = withOptions(makeDraft());
      const { estimate } = estimateOf(draft);
      await renderResult({ locale, draft, currency: 'UAH' });

      const total = moneyMinor(estimate.totals.uahKopecks ?? 0, 'UAH', locale);
      expectText(totalHeading(), total);
      expect(
        sectionOf(catalogs[locale].EstimateBreakdown.sections.materials)
          .textContent,
      ).not.toContain('$');
      const note = catalogs[locale].ExchangeRate.noteNbu.split('{')[0];
      expect(screen.getByText(new RegExp(note))).toBeInTheDocument();
    },
  );

  it('shows dollars with an explanation when the rate is missing', async () => {
    const draft = withOptions(makeDraft());
    const { estimate } = estimateOf(draft);
    await renderResult({ draft, currency: 'UAH', rate: false });

    expectText(
      totalHeading(),
      moneyMinor(estimate.totals.usdCents, 'USD', 'en'),
    );
    expect(
      screen.getByText(catalogs.en.ExchangeRate.unavailable),
    ).toBeInTheDocument();
    expect(screen.queryByText(/NBU rate/)).not.toBeInTheDocument();
  });

  it('keeps hryvnias when an option breaks the limits', async () => {
    const base = withOptions(makeDraft());
    const draft = {
      ...base,
      options: { ...base.options, 'opt-ac': { quantity: 50 } },
    };
    const { panel } = estimateOf(draft);
    expect(panel.total).toBeNull();
    await renderResult({ draft, currency: 'UAH' });

    expect(
      screen.queryByText(catalogs.en.ExchangeRate.unavailable),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/NBU rate/)).toBeInTheDocument();
    const totalBlock = screen.getByText(/NBU rate/).closest('section');
    if (!totalBlock || panel.base?.uahKopecks == null) {
      throw new Error('total block and base kopecks expected');
    }
    expectText(totalBlock, moneyMinor(panel.base.uahKopecks, 'UAH', 'en'));
    expect(totalBlock.textContent).not.toContain(
      moneyMinor(panel.base.usdCents, 'USD', 'en'),
    );
  });

  it('marks a disabled category as excluded', async () => {
    const base = makeDraft();
    const draft = {
      ...base,
      rooms: [
        {
          ...base.rooms[0],
          selections: {
            ...base.rooms[0].selections,
            [categoryIds.ceiling]: {
              productId: null,
              disabled: true,
              source: 'manual' as const,
            },
          },
        },
        ...base.rooms.slice(1),
      ],
    };
    await renderResult({ draft });

    const living = within(sectionOf(/Living room/));
    expect(
      living.getByText(catalogs.en.EstimateBreakdown.disabled),
    ).toBeTruthy();
  });

  it.each(forEachLocale)(
    'states that the estimate is preliminary in %s',
    async (locale) => {
      await renderResult({ locale });

      expect(
        screen.getByText(catalogs[locale].ResultStep.preliminary),
      ).toBeInTheDocument();
    },
  );

  it('shows the object and the style', async () => {
    await renderResult();
    const object = within(sectionOf('Object and style'));

    expect(object.getByText('Finish level')).toBeInTheDocument();
    expect(object.getByText('Pre-finish')).toBeInTheDocument();
    expect(object.getByText('62 m²')).toBeInTheDocument();
    expect(object.getByText('Balcony')).toBeInTheDocument();
    expect(object.getByText('Modern')).toBeInTheDocument();
  });

  it('names the lived-in finish level', async () => {
    const draft = withOptions(makeDraft());
    await renderResult({
      draft: { ...draft, object: { ...draft.object, finishLevel: 'LIVED_IN' } },
    });

    expect(
      within(sectionOf('Object and style')).getByText('Lived-in'),
    ).toBeInTheDocument();
  });

  it('shows a loading state until the pricing data arrives', async () => {
    await renderResult({ pricingData: false });

    expect(
      screen.getByRole('status', { name: catalogs.en.ResultStep.loading }),
    ).toBeInTheDocument();
  });

  it('offers a retry when the pricing data failed', async () => {
    await renderResult({ pricingData: false });
    await act(async () => {
      usePricingData.setState({ status: 'error' });
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: catalogs.en.SystemStates.retry }),
    ).toBeInTheDocument();
  });

  it('offers a retry when the catalog failed', async () => {
    await renderResult({ failEngineering: true });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: catalogs.en.SystemStates.retry }),
    ).toBeInTheDocument();
  });

  it('toggles an additional option and updates the total', async () => {
    const draft = makeDraft();
    await renderResult({ draft });
    const section = within(sectionOf(catalogs.en.ResultStep.additionalTitle));
    const toggle = section.getByRole('switch', { name: 'Design project' });
    const before = totalHeading().textContent;

    expect(toggle).not.toBeChecked();
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(currentDraft().options['opt-design']).toEqual({});
    expect(toggle).toBeChecked();
    expect(totalHeading().textContent).not.toBe(before);
  });

  it.each(forEachLocale)(
    'has no accessibility violations in %s',
    async (locale) => {
      const { container } = await renderResult({
        locale,
        currency: 'UAH',
      });

      expect(await axe(container, noLandmarkRule)).toHaveNoViolations();
    },
  );
});
