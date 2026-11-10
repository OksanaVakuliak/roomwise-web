import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calculationKeys } from '@/lib/api/calculations';
import { api } from '@/lib/api/client';
import { localDate, moneyMinor } from '@/lib/format';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { useDraft } from '@/stores/draft';
import { useExchangeRate } from '@/stores/exchange-rate';
import {
  checkPricingData,
  resetPricingData,
  seedPricingData,
} from '@/stores/pricing-data';
import { axe } from '@/test/axe';
import {
  calculationIds,
  makeChangedPriceVersionView,
  makeExpiredVersionView,
  makeOldVersionView,
  makeVersionView,
} from '@/test/fixtures';
import { makeFullRoomsDraft } from '@/test/fixtures/draft';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  createTestQueryClient,
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { SavedCalculation } from './SavedCalculation/SavedCalculation';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));
vi.mock('@/lib/monitoring/client', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));
vi.mock('@/stores/pricing-data', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/stores/pricing-data')>()),
  checkPricingData: vi.fn().mockResolvedValue(undefined),
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;
const { publicId } = calculationIds;

const ok = (data: unknown) => ({ data, response: { status: 200 } });
const created = (data: unknown) => ({ data, response: { status: 201 } });
const failure = (status: number, code: string, params?: object) => ({
  error: { error: { code, params } },
  response: { status },
});

const normalize = (value: string) => value.replace(/ /g, ' ');

const text = {
  en: {
    recalculate: 'Recalculate',
    edit: 'Edit',
    expired: 'Expired',
    notFound: 'Estimate not found',
    total: 'Estimate total',
    versions: 'Versions',
    newer: 'A newer version of this estimate exists.',
    replace: 'Replace and edit',
    keep: 'Keep my draft',
  },
  uk: {
    recalculate: 'Перерахувати',
    edit: 'Редагувати',
    expired: 'Прострочено',
    notFound: 'Розрахунок не знайдено',
    total: 'Разом за розрахунком',
    versions: 'Версії',
    newer: 'Існує новіша версія цього розрахунку.',
    replace: 'Замінити й редагувати',
    keep: 'Залишити чернетку',
  },
} as const;

async function renderSaved(
  locale: 'en' | 'uk' = 'en',
  versionNumber?: string,
  id: string = publicId,
  options: {
    queryClient?: ReturnType<typeof createTestQueryClient>;
    preferences?: NonNullable<
      Parameters<typeof renderWithProviders>[1]
    >['preferences'];
  } = {},
) {
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <SavedCalculation publicId={id} versionNumber={versionNumber} />,
      {
        locale,
        queryClient: options.queryClient ?? createTestQueryClient(),
        preferences: options.preferences,
        url: `/calculations/${id}`,
      },
    );
  });
  return result;
}

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

const accessoryNames = {
  en: { laminate_underlay: 'Laminate underlay', tile_glue: 'Tile glue' },
  uk: {
    laminate_underlay: 'Підкладка під ламінат',
    tile_glue: 'Клей для плитки',
  },
} as const;

function withAccessories(locale: 'en' | 'uk') {
  const base = makeVersionView();
  const lines = base.lines.map((line) => {
    if (line.id === 'MATERIALS:living:cat-floor') {
      return {
        ...line,
        components: [
          {
            kind: 'MATERIAL' as const,
            ruleId: 'rule-floor',
            amountCents: 37800,
          },
          {
            kind: 'ACCESSORY' as const,
            ruleId: 'rule-floor',
            coefficientKey: 'laminate_underlay',
            amountCents: 4200,
          },
        ],
      };
    }
    if (line.id === 'MATERIALS:bath:cat-floor') {
      return {
        ...line,
        components: [
          { kind: 'MATERIAL' as const, ruleId: 'rule-tile', amountCents: 9900 },
          {
            kind: 'ACCESSORY' as const,
            ruleId: 'rule-tile',
            coefficientKey: 'tile_glue',
            amountCents: 9240,
          },
        ],
      };
    }
    return line;
  });
  return makeVersionView({ lines, accessories: accessoryNames[locale] });
}

describe('saved calculation page', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    resetWarmup();
    useWarmup.setState({ server: 'ready' });
    useDraft.getState().reset();
    vi.mocked(checkPricingData).mockClear();
    seedPricingData(makePricingData(), null);
  });

  afterEach(() => {
    resetPricingData();
    useExchangeRate.setState({ rate: null });
    vi.useRealTimers();
  });

  describe.each(forEachLocale)('in %s', (locale) => {
    const t = text[locale];

    it('shows a read-only snapshot with its saved date, expiry and rate', async () => {
      const version = makeVersionView();
      get.mockResolvedValue(ok(version));
      const { container } = await renderSaved(locale);

      expect(
        await screen.findByRole('heading', {
          level: 2,
          name: new RegExp(t.total),
        }),
      ).toHaveTextContent(
        normalize(moneyMinor(version.totals.usdCents, 'USD', locale)),
      );
      expect(
        screen.getAllByText(localDate(version.createdAt, locale)).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getByText(localDate(version.expiresAt, locale)),
      ).toBeInTheDocument();
      expect(screen.getByText(/44[.,]55/)).toBeInTheDocument();
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      expect(screen.queryByText(t.expired)).not.toBeInTheDocument();
      expect(screen.queryByText(t.recalculate)).not.toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('shows accessory sub-lines under the product line', async () => {
      const version = withAccessories(locale);
      get.mockResolvedValue(ok(version));
      const { container } = await renderSaved(locale);

      const names = accessoryNames[locale];
      const sublines = [
        [names.laminate_underlay, 4200],
        [names.tile_glue, 9240],
      ] as const;
      for (const [name, cents] of sublines) {
        const item = (await screen.findByText(new RegExp(name))).closest('li');
        expect(normalize(item?.textContent ?? '')).toBe(
          `${name} · ${normalize(moneyMinor(cents, 'USD', locale))}`,
        );
      }
      for (const line of version.lines) {
        if (line.components) {
          const sum = line.components.reduce(
            (total, component) => total + component.amountCents,
            0,
          );
          expect(sum).toBe(line.amountCents);
        }
      }
      expect(await axe(container)).toHaveNoViolations();
    });

    it('hides accessory sub-lines of an item that is no longer available', async () => {
      const version = withAccessories(locale);
      const priceStatus = version.priceStatus;
      if (!priceStatus) {
        throw new Error('price status expected');
      }
      get.mockResolvedValue(
        ok({
          ...version,
          priceStatus: {
            ...priceStatus,
            unavailableItems: [
              {
                lineId: 'MATERIALS:living:cat-floor',
                productId: null,
                optionId: null,
              },
            ],
          },
        }),
      );
      await renderSaved(locale);

      const names = accessoryNames[locale];
      expect(
        await screen.findByText(new RegExp(names.tile_glue)),
      ).toBeVisible();
      expect(
        screen.queryByText(new RegExp(names.laminate_underlay)),
      ).not.toBeInTheDocument();
    });

    it('offers to recalculate when prices changed and opens the new version', async () => {
      const version = makeChangedPriceVersionView();
      get.mockResolvedValue(ok(version));
      post.mockResolvedValue(created(makeVersionView({ number: 4 })));
      const { container, location } = await renderSaved(locale);

      const button = await screen.findByRole('button', {
        name: t.recalculate,
      });
      const diff = normalize(moneyMinor(12500, 'USD', locale));
      expect(
        screen.getByText((content) => normalize(content).includes(diff)),
      ).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();

      await click(button);

      expect(post).toHaveBeenCalledExactlyOnceWith(
        '/api/v1/public/calculations/{publicId}/versions',
        expect.objectContaining({
          params: {
            path: { publicId },
            query: { lang: locale },
            header: { 'Idempotency-Key': expect.any(String) },
          },
          body: { basedOnVersion: version.number },
        }),
      );
      await waitFor(() =>
        expect(location().pathname).toBe(
          `/${locale}/calculations/${publicId}/v/4`,
        ),
      );
    });

    it('marks an expired estimate and offers to recalculate it', async () => {
      get.mockResolvedValue(ok(makeExpiredVersionView()));
      const { container } = await renderSaved(locale);

      expect(await screen.findByText(t.expired)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: t.recalculate }),
      ).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('links an older version to the newest one and lists all versions', async () => {
      get.mockResolvedValue(ok(makeOldVersionView()));
      const { container } = await renderSaved(locale, '1');

      expect(await screen.findByText(t.newer)).toBeInTheDocument();
      expect(
        screen
          .getAllByRole('link')
          .some(
            (link) =>
              link.getAttribute('href') ===
              `/${locale}/calculations/${publicId}/v/3`,
          ),
      ).toBe(true);
      const list = screen.getByRole('region', { name: t.versions });
      expect(within(list).getAllByRole('listitem')).toHaveLength(3);
      expect(list.querySelector('[aria-current="page"]')).not.toBeNull();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('shows not found for a missing calculation', async () => {
      get.mockResolvedValue(failure(404, 'CALCULATION_NOT_FOUND'));
      await renderSaved(locale, undefined, 'nope');

      expect(
        await screen.findByRole('heading', { level: 2, name: t.notFound }),
      ).toBeInTheDocument();
    });

    it('shows not found for a version that is not a number', async () => {
      await renderSaved(locale, 'abc');

      expect(
        await screen.findByRole('heading', { level: 2, name: t.notFound }),
      ).toBeInTheDocument();
      expect(get).not.toHaveBeenCalled();
    });

    it('replaces a non-empty draft with the snapshot after confirmation', async () => {
      useDraft.getState().replaceDraft(makeFullRoomsDraft());
      get.mockResolvedValue(ok(makeVersionView()));
      const { location, container } = await renderSaved(locale);

      await click(await screen.findByRole('button', { name: t.edit }));
      const dialog = await screen.findByRole('dialog');
      expect(await axe(container)).toHaveNoViolations();
      expect(useDraft.getState().lastSaved).toBeNull();

      await click(within(dialog).getByRole('button', { name: t.replace }));

      await waitFor(() =>
        expect(location().pathname).toBe(`/${locale}/configurator/result`),
      );
      const draft = useDraft.getState();
      expect(draft.rooms.map((room) => room.clientId)).toEqual([
        calculationIds.livingRoom,
        calculationIds.bathroom,
      ]);
      expect(draft.lastSaved).toMatchObject({ publicId, versionNumber: 3 });
    });

    it('keeps the draft when the replacement is declined', async () => {
      useDraft.getState().replaceDraft(makeFullRoomsDraft());
      get.mockResolvedValue(ok(makeVersionView()));
      const { location } = await renderSaved(locale);

      await click(await screen.findByRole('button', { name: t.edit }));
      await click(await screen.findByRole('button', { name: t.keep }));

      expect(location().pathname).toBe(`/${locale}/calculations/${publicId}`);
      expect(useDraft.getState().lastSaved).toBeNull();
    });
  });

  it.each([
    ['an empty map', {}],
    ['no map', undefined],
  ])(
    'opens an old snapshot with %s without accessory lines',
    async (_, accessories) => {
      const version = withAccessories('en');
      const { accessories: _drop, ...rest } = version;
      get.mockResolvedValue(
        ok(accessories === undefined ? rest : { ...version, accessories }),
      );
      await renderSaved();

      await screen.findByText('Oak Natural Laminate');
      expect(screen.queryByText(/Laminate underlay/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tile glue/)).not.toBeInTheDocument();
    },
  );

  it('titles the saved separate works as works and materials', async () => {
    const base = makeVersionView();
    get.mockResolvedValue(
      ok({
        ...base,
        configuration: { ...base.configuration, scope: 'PARTIAL' },
      }),
    );
    await renderSaved();

    expect(
      await screen.findByRole('heading', { name: /Works and materials/ }),
    ).toBeInTheDocument();
  });

  it('keeps snapshot names and sums when current prices differ', async () => {
    const version = makeChangedPriceVersionView();
    get.mockResolvedValue(ok(version));
    await renderSaved();

    expect(await screen.findByText('Oak Natural Laminate')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Estimate total/ }),
    ).toHaveTextContent(
      normalize(moneyMinor(version.totals.usdCents, 'USD', 'en')),
    );
    expect(version.priceStatus?.currentTotalUsdCents).not.toBe(
      version.totals.usdCents,
    );
  });

  it('shows an error and allows a retry when recalculation fails', async () => {
    get.mockResolvedValue(ok(makeChangedPriceVersionView()));
    post.mockResolvedValue(failure(500, 'INTERNAL'));
    await renderSaved();

    await click(await screen.findByRole('button', { name: 'Recalculate' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not recalculate',
    );
    expect(screen.getByRole('button', { name: 'Recalculate' })).toBeEnabled();
  });

  it('shows the price difference in USD when the snapshot has no rate', async () => {
    useExchangeRate.setState({
      rate: { uahPerUsd: 40, date: '2026-01-01', source: 'NBU' },
    });
    get.mockResolvedValue(
      ok(makeChangedPriceVersionView({ exchangeRate: null })),
    );
    await renderSaved('en', undefined, publicId, {
      preferences: { currency: 'UAH' },
    });

    const diff = normalize(moneyMinor(12500, 'USD', 'en'));
    expect(
      await screen.findByText((content) => normalize(content).includes(diff)),
    ).toBeInTheDocument();
  });

  it('leaves the pending state and seeds the new version after recalculating', async () => {
    const queryClient = createTestQueryClient();
    const next = makeVersionView({ number: 4 });
    get.mockResolvedValue(ok(makeChangedPriceVersionView()));
    post.mockResolvedValue(created(next));
    const { location } = await renderSaved('en', undefined, publicId, {
      queryClient,
    });

    await click(await screen.findByRole('button', { name: 'Recalculate' }));

    await waitFor(() =>
      expect(location().pathname).toBe(`/en/calculations/${publicId}/v/4`),
    );
    expect(
      queryClient.getQueryData(calculationKeys.version(publicId, 4, 'en')),
    ).toEqual(next);
    expect(
      screen.getByRole('button', { name: 'Recalculate' }),
    ).not.toHaveAttribute('aria-busy');
  });

  it('allows recalculating again once the rate limit has passed', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    get.mockResolvedValue(ok(makeChangedPriceVersionView()));
    post.mockResolvedValue(
      failure(429, 'RATE_LIMITED', { retryAfterSeconds: 3 }),
    );
    await renderSaved();

    await click(await screen.findByRole('button', { name: 'Recalculate' }));
    expect(screen.getByRole('button', { name: 'Recalculate' })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('2');

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: 'Recalculate' })).toBeEnabled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('runs the edit only once on a double click', async () => {
    get.mockResolvedValue(ok(makeVersionView()));
    let finish!: () => void;
    vi.mocked(checkPricingData).mockReturnValueOnce(
      new Promise<void>((done) => {
        finish = done;
      }),
    );
    const { location } = await renderSaved();
    const button = await screen.findByRole('button', { name: 'Edit' });

    await act(async () => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    await act(async () => {
      finish();
    });

    await waitFor(() =>
      expect(location().pathname).toBe('/en/configurator/result'),
    );
    expect(checkPricingData).toHaveBeenCalledTimes(1);
  });

  it('keeps the draft and shows an error when pricing data is unavailable', async () => {
    const draft = makeFullRoomsDraft();
    useDraft.getState().replaceDraft(draft);
    get.mockResolvedValue(ok(makeVersionView()));
    const { location } = await renderSaved();
    resetPricingData();

    await click(await screen.findByRole('button', { name: 'Edit' }));
    await click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Replace and edit',
      }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load current prices',
    );
    expect(location().pathname).toBe(`/en/calculations/${publicId}`);
    expect(useDraft.getState().rooms.map((room) => room.clientId)).toEqual(
      draft.rooms.map((room) => room.clientId),
    );
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled();
  });

  it('opens the configurator result at once when the draft is empty', async () => {
    get.mockResolvedValue(ok(makeVersionView()));
    const { location } = await renderSaved();

    await click(await screen.findByRole('button', { name: 'Edit' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(location().pathname).toBe('/en/configurator/result'),
    );
    expect(useDraft.getState().rooms).toHaveLength(2);
  });

  it('shows a category without a product as not calculated, not excluded', async () => {
    const base = makeVersionView();
    const lines = [
      ...base.lines,
      {
        ...base.lines[2],
        id: 'MATERIALS:bath:cat-walls',
        status: 'NOT_CALCULATED' as const,
        roomClientId: calculationIds.bathroom,
        roomName: 'Bathroom',
        categoryName: 'Walls',
        productId: null,
        product: null,
        amountCents: 0,
        amountUahKopecks: 0,
        quantity: null,
        unit: null,
        unitPriceCents: null,
      },
    ];
    get.mockResolvedValue(ok(makeVersionView({ lines })));
    await renderSaved();

    await screen.findByText('Oak Natural Laminate');
    expect(screen.queryByText('Excluded')).not.toBeInTheDocument();
    expect(screen.getAllByText(/Not calculated/).length).toBeGreaterThan(0);
  });
});
