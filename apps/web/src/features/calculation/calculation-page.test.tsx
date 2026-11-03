import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { moneyMinor, rateDate } from '@/lib/format';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { useDraft } from '@/stores/draft';
import { axe } from '@/test/axe';
import {
  calculationIds,
  makeChangedPriceVersionView,
  makeExpiredVersionView,
  makeOldVersionView,
  makeVersionView,
} from '@/test/fixtures';
import { makeFullRoomsDraft } from '@/test/fixtures/draft';
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
const failure = (status: number, code: string) => ({
  error: { error: { code } },
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
) {
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <SavedCalculation publicId={id} versionNumber={versionNumber} />,
      {
        locale,
        queryClient: createTestQueryClient(),
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

describe('saved calculation page', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    resetWarmup();
    useWarmup.setState({ server: 'ready' });
    useDraft.getState().reset();
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
        screen.getAllByText(rateDate(version.createdAt, locale)).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getByText(rateDate(version.expiresAt, locale)),
      ).toBeInTheDocument();
      expect(screen.getByText(/44[.,]55/)).toBeInTheDocument();
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      expect(screen.queryByText(t.expired)).not.toBeInTheDocument();
      expect(screen.queryByText(t.recalculate)).not.toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
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
