import * as engine from '@roomwise/calc-engine';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultDraft } from '@/lib/draft/schema';
import { clearEstimateCache, runEstimate } from '@/lib/engine/run-estimate';
import { moneyMinor } from '@/lib/format';
import { useDraft } from '@/stores/draft';
import { resetExchangeRate } from '@/stores/exchange-rate';
import { usePreferences } from '@/stores/preferences';
import { usePricingData } from '@/stores/pricing-data';
import { axe } from '@/test/axe';
import {
  type DraftV1,
  makeDraftRoom,
  makeEmptyDraft,
  makeInteriorDraft,
  makePartialDraft,
} from '@/test/fixtures/draft';
import { setLoadedRate } from '@/test/fixtures/exchange-rate';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { CostPanel } from './CostPanel';

vi.mock('@roomwise/calc-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@roomwise/calc-engine')>();
  return { ...actual, estimate: vi.fn(actual.estimate) };
});

const catalogs = { en, uk };
const pricing = makePricingData();

function renderPanel(draft: DraftV1, locale: 'en' | 'uk' = 'en') {
  useDraft.setState({ ...draft, revision: 1 });
  return renderWithProviders(<CostPanel />, { locale });
}

function figures(draft: DraftV1) {
  return runEstimate({
    draft,
    draftRevision: 1,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  }).panel;
}

function row(label: string) {
  const term = screen.getByText(label, { selector: 'dt, dt > button' });
  return term.closest('dt')?.nextElementSibling as HTMLElement;
}

describe('CostPanel', () => {
  beforeEach(() => {
    clearEstimateCache();
    resetExchangeRate();
    setLoadedRate({ uahPerUsd: Number(pricing.exchangeRate?.rate) });
    useDraft.setState({ ...createDefaultDraft(), revision: 0 });
    vi.mocked(engine.estimate).mockClear();
  });

  it.each(forEachLocale)('shows every row in USD in %s', (locale) => {
    const draft = makeInteriorDraft();
    const panel = figures(draft);
    renderPanel(draft, locale);
    const t = catalogs[locale].CostPanel;
    const usd = (value: { usdCents: number } | null) =>
      moneyMinor(value?.usdCents ?? 0, 'USD', locale);

    expect(row(t.base).textContent).toBe(usd(panel.base));
    expect(row(t.materials).textContent).toBe(usd(panel.materials));
    expect(row(t.engineering).textContent).toBe(usd(panel.engineering));
    expect(row(t.additional).textContent).toBe(usd(panel.additional));
    expect(document.querySelector('b')?.textContent).toBe(usd(panel.total));
  });

  it('makes the total the sum of the rows', () => {
    const draft = makeInteriorDraft();
    const { base, materials, engineering, additional, total } = figures(draft);
    const sum = [base, materials, engineering, additional].reduce(
      (acc, part) => acc + (part?.usdCents ?? 0),
      0,
    );
    expect(total?.usdCents).toBe(sum);
  });

  it.each(forEachLocale)(
    'shows the heated floor warning in %s only for an unfit floor',
    (locale) => {
      const base = makeInteriorDraft();
      const bathroom = base.rooms[1];
      const unfit = {
        ...base,
        rooms: [
          {
            ...bathroom,
            heatedFloor: true,
            selections: {
              ...bathroom.selections,
              'cat-floor': {
                productId: 'p-laminate',
                disabled: false,
                source: 'manual' as const,
              },
            },
          },
        ],
      };
      const message =
        catalogs[locale].Estimate.warning.HEATED_FLOOR_INCOMPATIBLE;

      const { unmount } = renderPanel(unfit, locale);
      expect(screen.getByText(message)).toBeInTheDocument();
      unmount();

      renderPanel(base, locale);
      expect(screen.queryByText(message)).not.toBeInTheDocument();
    },
  );

  it.each(forEachLocale)('shows UAH amounts in %s', (locale) => {
    const draft = makeInteriorDraft();
    const panel = figures(draft);
    useDraft.setState({ ...draft, revision: 1 });
    renderWithProviders(<CostPanel />, { locale, currency: 'UAH' });
    const t = catalogs[locale].CostPanel;

    expect(row(t.base).textContent).toBe(
      moneyMinor(panel.base?.uahKopecks ?? 0, 'UAH', locale),
    );
    expect(document.querySelector('b')?.textContent).toBe(
      moneyMinor(panel.total?.uahKopecks ?? 0, 'UAH', locale),
    );
  });

  it.each(forEachLocale)('shows a dash for undefined rows in %s', (locale) => {
    renderPanel(makeEmptyDraft(), locale);
    const t = catalogs[locale].CostPanel;

    expect(row(t.materials)).toHaveTextContent('—');
    expect(row(t.materials)).not.toHaveTextContent('0');
  });

  it('shows a dash for materials until a product is chosen', () => {
    renderPanel(makeInteriorDraft({ rooms: [makeDraftRoom()] }));
    expect(row(en.CostPanel.materials)).toHaveTextContent('—');
  });

  it('switches the currency without recalculating', () => {
    useDraft.setState({ ...makeInteriorDraft(), revision: 1 });
    renderWithProviders(<CostPanel />);
    const calls = vi.mocked(engine.estimate).mock.calls.length;
    expect(screen.getAllByText(/[$]/, { selector: 'b' })).toHaveLength(1);

    act(() => usePreferences.setState({ currency: 'UAH' }));

    expect(screen.queryByText(/[$]/, { selector: 'b' })).toBeNull();
    expect(screen.getAllByText(/₴/, { selector: 'b' })).toHaveLength(1);
    expect(vi.mocked(engine.estimate).mock.calls).toHaveLength(calls);
  });

  it('recalculates when the draft changes', () => {
    renderPanel(makeInteriorDraft());
    const calls = vi.mocked(engine.estimate).mock.calls.length;

    act(() => useDraft.setState({ revision: 2 }));

    expect(vi.mocked(engine.estimate).mock.calls.length).toBeGreaterThan(calls);
  });

  it('announces a changed total politely', async () => {
    renderPanel(makeInteriorDraft());
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');

    act(() => usePreferences.setState({ currency: 'UAH' }));
    await vi.waitFor(() => expect(status).toHaveTextContent(/Total is now/));
  });

  it('shows an error state with retry when pricing data are unavailable', () => {
    useDraft.setState({ ...makeInteriorDraft(), revision: 1 });
    renderWithProviders(<CostPanel />, { pricing: false });
    act(() =>
      usePricingData.setState({ status: 'error', data: null, version: null }),
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(en.CostPanel.errorTitle);
    expect(
      within(alert).getByRole('button', { name: en.SystemStates.retry }),
    ).toBeInTheDocument();
  });

  describe('partial renovation', () => {
    function sections(draft: DraftV1) {
      return runEstimate({
        draft,
        draftRevision: 1,
        pricing,
        pricingVersion: pricing.version,
        currency: 'UAH',
      }).estimate;
    }

    it.each(forEachLocale)('has no base row in %s', (locale) => {
      renderPanel(makePartialDraft(), locale);
      const t = catalogs[locale].CostPanel;

      expect(screen.queryByText(t.base, { selector: 'dt' })).toBeNull();
      expect(screen.queryByText(t.materials, { selector: 'dt' })).toBeNull();
    });

    it.each(forEachLocale)(
      'shows works and materials as materials plus object in %s',
      (locale) => {
        const draft = makePartialDraft();
        const estimate = sections(draft);
        const totals = estimate?.totals.sections;
        renderPanel(draft, locale);
        const t = catalogs[locale].CostPanel;

        expect(row(t.worksAndMaterials).textContent).toBe(
          moneyMinor(
            (totals?.MATERIALS.usdCents ?? 0) + (totals?.OBJECT.usdCents ?? 0),
            'USD',
            locale,
          ),
        );
      },
    );

    it('makes the total the sum of the shown rows', () => {
      const draft = makePartialDraft();
      const { materials, engineering, additional, total } = figures(draft);
      const sum = [materials, engineering, additional].reduce(
        (acc, part) => acc + (part?.usdCents ?? 0),
        0,
      );
      expect(total?.usdCents).toBe(sum);
      expect(total?.usdCents).toBeGreaterThan(0);
    });

    it('counts balcony tiles as a separate job from the engine object line', () => {
      const withTiles = makePartialDraft({
        object: {
          ...makePartialDraft().object,
          balcony: { present: true, areaSqm: 4, tiles: true },
        },
      });
      const without = makePartialDraft({
        object: {
          ...makePartialDraft().object,
          balcony: { present: true, areaSqm: 4, tiles: false },
        },
      });
      const line = sections(withTiles)?.lines.find(
        (item) => item.section === 'OBJECT' && item.amountCents > 0,
      );
      expect(line).toBeDefined();

      renderPanel(withTiles);
      const shown = row(en.CostPanel.worksAndMaterials).textContent;
      const base = figures(without).materials?.usdCents ?? 0;

      expect(shown).toBe(
        moneyMinor(base + (line?.amountCents ?? 0), 'USD', 'en'),
      );
    });

    it('has no accessibility violations', async () => {
      const { container } = renderPanel(makePartialDraft());
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('base details', () => {
    const finishLevels = ['ROUGH', 'PRE_FINISH', 'LIVED_IN'] as const;
    const cases = finishLevels.flatMap((finishLevel) =>
      forEachLocale.flatMap(([locale]) =>
        (['USD', 'UAH'] as const).map(
          (currency) => [finishLevel, locale, currency] as const,
        ),
      ),
    );

    function apartment(finishLevel: (typeof finishLevels)[number]) {
      const draft = makeInteriorDraft();
      return {
        ...draft,
        object: { ...draft.object, finishLevel, totalAreaSqm: 60 },
      };
    }

    function minor(
      line: { amountCents: number; amountUahKopecks: number | null },
      currency: 'USD' | 'UAH',
    ) {
      return currency === 'USD'
        ? line.amountCents
        : (line.amountUahKopecks ?? 0);
    }

    function baseLines(draft: DraftV1) {
      return (
        runEstimate({
          draft,
          draftRevision: 1,
          pricing,
          pricingVersion: pricing.version,
          currency: 'UAH',
        }).estimate?.lines.filter((line) => line.section === 'BASE') ?? []
      );
    }

    function renderDetails(
      draft: DraftV1,
      locale: 'en' | 'uk',
      currency: 'USD' | 'UAH',
    ) {
      useDraft.setState({ ...draft, revision: 1 });
      return renderWithProviders(<CostPanel />, { locale, currency });
    }

    function toggle(locale: 'en' | 'uk') {
      return screen.getByRole('button', {
        name: catalogs[locale].CostPanel.base,
      });
    }

    function breakdown(locale: 'en' | 'uk') {
      const label = catalogs[locale].CostPanel.baseDetails.label;
      return document.querySelector(`dl[aria-label="${label}"]`);
    }

    function items(list: Element) {
      return Array.from(list.querySelectorAll('dt')).map((term) => ({
        name: term.textContent,
        amount: term.nextElementSibling?.textContent,
      }));
    }

    it.each(cases)(
      'expands the %s base breakdown in %s in %s',
      (finishLevel, locale, currency) => {
        const draft = apartment(finishLevel);
        const lines = baseLines(draft);
        renderDetails(draft, locale, currency);
        const button = toggle(locale);

        expect(button).toHaveAttribute('type', 'button');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(breakdown(locale)?.closest('dd')).toHaveAttribute('hidden');

        fireEvent.click(button);

        expect(button).toHaveAttribute('aria-expanded', 'true');
        const list = breakdown(locale) as HTMLElement;
        expect(list.closest('dd')).not.toHaveAttribute('hidden');
        expect(items(list)).toEqual(
          lines.map((line) => ({
            name: pricing.rules.find((rule) => rule.id === line.ruleId)?.name[
              locale
            ],
            amount: moneyMinor(minor(line, currency), currency, locale),
          })),
        );
      },
    );

    it.each(cases)(
      'sums the %s components to the base row in %s in %s',
      (finishLevel, locale, currency) => {
        const draft = apartment(finishLevel);
        const lines = baseLines(draft);
        renderDetails(draft, locale, currency);
        fireEvent.click(toggle(locale));

        const sum = lines.reduce((acc, line) => acc + minor(line, currency), 0);
        const baseRow = toggle(locale).closest('dt')?.nextElementSibling;

        expect(lines.length).toBeGreaterThan(1);
        expect(baseRow?.textContent).toBe(moneyMinor(sum, currency, locale));
      },
    );

    it.each(forEachLocale)(
      'lists the demolition only for a lived-in apartment in %s',
      (locale) => {
        const demolition = pricing.rules.find(
          (rule) => rule.id === 'rule-base-demolition',
        )?.name[locale] as string;

        for (const finishLevel of finishLevels) {
          const { unmount } = renderDetails(
            apartment(finishLevel),
            locale,
            'USD',
          );
          fireEvent.click(toggle(locale));
          const names = items(breakdown(locale) as Element).map(
            (item) => item.name,
          );

          expect(names.includes(demolition)).toBe(finishLevel === 'LIVED_IN');
          unmount();
        }
      },
    );

    it.each(forEachLocale)(
      'keeps interior categories out of the breakdown in %s',
      (locale) => {
        renderDetails(apartment('LIVED_IN'), locale, 'USD');
        fireEvent.click(toggle(locale));
        const text = breakdown(locale)?.textContent ?? '';

        const categoryRules = pricing.rules.filter(
          (rule) => rule.level === 'CATEGORY',
        );
        expect(categoryRules.length).toBeGreaterThan(0);
        for (const rule of categoryRules) {
          expect(text).not.toContain(rule.name[locale]);
        }
      },
    );

    it('can be focused and operated as a native button', () => {
      renderDetails(apartment('PRE_FINISH'), 'en', 'USD');
      const button = toggle('en');

      button.focus();
      expect(button).toHaveFocus();
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('aria-controls');
      expect(
        document.getElementById(button.getAttribute('aria-controls') ?? ''),
      ).toContainElement(breakdown('en') as HTMLElement);

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows a dash for a base component whose formula failed', () => {
      const broken = makePricingData({
        rules: pricing.rules.map((rule) =>
          rule.id === 'rule-base-materials'
            ? { ...rule, costFormula: 'missingVariable * 2' }
            : rule,
        ),
      });
      useDraft.setState({ ...apartment('ROUGH'), revision: 1 });
      renderWithProviders(<CostPanel />, { locale: 'en', pricing: broken });
      fireEvent.click(toggle('en'));

      const list = breakdown('en') as HTMLElement;
      const term = within(list).getByText('Rough materials');
      expect(term.nextElementSibling).toHaveTextContent('—');
    });

    it('has no toggle when the base has a single component', () => {
      const single = makePricingData({
        rules: pricing.rules.filter(
          (rule) =>
            rule.id !== 'rule-base-materials' &&
            rule.id !== 'rule-base-demolition',
        ),
      });
      useDraft.setState({ ...apartment('ROUGH'), revision: 1 });
      renderWithProviders(<CostPanel />, { locale: 'en', pricing: single });

      expect(
        screen.queryByRole('button', { name: en.CostPanel.base }),
      ).toBeNull();
      expect(breakdown('en')).toBeNull();
      expect(row(en.CostPanel.base).textContent).not.toBe('—');
    });

    it('has no accessibility violations with the breakdown expanded', async () => {
      const { container } = renderDetails(apartment('LIVED_IN'), 'en', 'USD');
      fireEvent.click(toggle('en'));
      expect(await axe(container)).toHaveNoViolations();
    });

    it.each(forEachLocale)(
      'has no base toggle or breakdown for a partial renovation in %s',
      (locale) => {
        renderPanel(makePartialDraft(), locale);

        expect(
          screen.queryByRole('button', {
            name: catalogs[locale].CostPanel.base,
          }),
        ).toBeNull();
        expect(breakdown(locale)).toBeNull();
      },
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = renderPanel(makeInteriorDraft());
    expect(await axe(container)).toHaveNoViolations();
  });
});
