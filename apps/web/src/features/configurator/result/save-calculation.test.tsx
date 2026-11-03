import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogRoots } from '@/lib/api/catalog';
import { api } from '@/lib/api/client';
import { clearCardCostCache } from '@/lib/engine/card-cost';
import { clearEstimateCache, runEstimate } from '@/lib/engine/run-estimate';
import { moneyMinor } from '@/lib/format';
import { captureException, captureMessage } from '@/lib/monitoring/client';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { useDraft } from '@/stores/draft';
import { resetExchangeRate } from '@/stores/exchange-rate';
import { checkPricingData } from '@/stores/pricing-data';
import { calculationIds, makeVersionView } from '@/test/fixtures';
import { setLoadedRate } from '@/test/fixtures/exchange-rate';
import { makePricingData } from '@/test/fixtures/pricing-data';
import {
  createTestQueryClient,
  renderWithProviders,
  seedCatalog,
} from '@/test/render-with-providers';
import { setViewport } from '@/test/viewports';
import { makeCatalog, makeDraft } from '../interior/interior-step.helpers';
import { ResultStep } from './ResultStep/ResultStep';

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

const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;
const pricing = makePricingData();
const { publicId } = calculationIds;

const created = (data: unknown) => ({ data, response: { status: 201 } });
const failure = (status: number, code: string, params?: object) => ({
  error: { error: { code, params } },
  response: { status },
});

function clientTotal(): number {
  const { estimate } = runEstimate({
    draft: useDraft.getState(),
    draftRevision: useDraft.getState().revision,
    pricing,
    pricingVersion: pricing.version,
    currency: 'UAH',
  });
  if (estimate === null) {
    throw new Error('estimate expected');
  }
  return estimate.totals.usdCents;
}

function snapshot(usdCents: number, priceDifference: object | null = null) {
  const version = makeVersionView({
    totals: { usdCents, uahKopecks: usdCents * 45, sections: {} },
  });
  return { version, priceDifference };
}

async function renderResult(locale: 'en' | 'uk' = 'en') {
  setViewport(1024);
  resetExchangeRate();
  setLoadedRate();
  useDraft.setState({ ...makeDraft(), revision: 1, lastSaved: null });
  const queryClient = createTestQueryClient();
  seedCatalog(queryClient, locale);
  queryClient.setQueryData(['room-types', locale], makeCatalog());
  await act(async () => {
    renderWithProviders(<ResultStep />, {
      url: '/configurator/result',
      locale,
      catalog: false,
      queryClient,
    });
  });
  return queryClient;
}

const saveButton = (name: string | RegExp = /Save the estimate/) =>
  screen.getByRole('button', { name });

async function save(name?: string | RegExp) {
  await act(async () => {
    fireEvent.click(saveButton(name));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  installMemoryStorage();
  clearEstimateCache();
  clearCardCostCache();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

describe('save calculation', () => {
  it('shows the link with copy and the snapshot sums after 201', async () => {
    await renderResult();
    const total = clientTotal();
    post.mockResolvedValue(created(snapshot(total)));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await save();

    const link = `${window.location.origin}/en/calculations/${publicId}/v/3`;
    expect(screen.getByLabelText('Link to the estimate')).toHaveValue(link);
    expect(screen.getByText('Estimate saved')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Open the estimate' }),
    ).toHaveAttribute('href', `/en/calculations/${publicId}/v/3`);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(link));
    expect(await screen.findByText('Link copied')).toBeInTheDocument();
    expect(useDraft.getState().lastSaved).toEqual({
      publicId,
      versionNumber: 3,
      configurationHash: expect.any(String),
    });
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('offers to save again once the draft changes after saving', async () => {
    await renderResult();
    post.mockResolvedValue(created(snapshot(clientTotal())));

    await save();
    await act(async () => {
      useDraft.setState((state) => ({ revision: state.revision + 1 }));
    });

    expect(saveButton()).toBeEnabled();
    expect(screen.queryByLabelText('Link to the estimate')).toBeNull();
  });

  it('sends the strict configuration with lang, key and client totals', async () => {
    await renderResult('uk');
    const total = clientTotal();
    post.mockResolvedValue(created(snapshot(total)));

    await save('Зберегти розрахунок');

    expect(post).toHaveBeenCalledExactlyOnceWith(
      '/api/v1/public/calculations',
      expect.objectContaining({
        params: {
          query: { lang: 'uk' },
          header: { 'Idempotency-Key': expect.any(String) },
        },
        body: expect.objectContaining({
          styleId: useDraft.getState().styleId,
          clientPricingVersion: pricing.version,
          clientTotalUsdCents: total,
          configuration: expect.objectContaining({ currency: 'USD' }),
        }),
      }),
    );
    expect(screen.getByLabelText('Посилання на розрахунок')).toHaveValue(
      `${window.location.origin}/uk/calculations/${publicId}/v/3`,
    );
    expect(
      screen.getByRole('link', { name: 'Відкрити розрахунок' }),
    ).toHaveAttribute('href', `/uk/calculations/${publicId}/v/3`);
    expect(checkPricingData).toHaveBeenCalled();
  });

  it('replaces the screen sums with the snapshot and notes the price change', async () => {
    await renderResult();
    const saved = clientTotal() + 12500;
    post.mockResolvedValue(
      created(snapshot(saved, { diffCents: 12500, savedTotalUsdCents: saved })),
    );

    await save();

    expect(
      screen.getByRole('heading', { level: 2, name: /\d/ }).textContent,
    ).toContain(moneyMinor(saved, 'USD', 'en').replace(/\s/g, ' '));
    expect(
      screen.getByText(/The total has increased by \$125/),
    ).toBeInTheDocument();
    expect(checkPricingData).toHaveBeenCalledTimes(2);
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('reports a discrepancy on the same pricing version without private data', async () => {
    await renderResult();
    const total = clientTotal();
    post.mockResolvedValue(created(snapshot(total + 700)));

    await save();

    expect(
      screen.getByText(/The total has increased by \$7/),
    ).toBeInTheDocument();
    expect(captureMessage).toHaveBeenCalledExactlyOnceWith(
      'estimate-discrepancy',
      {
        level: 'error',
        fingerprint: ['estimate-discrepancy'],
        tags: {
          pricingVersion: pricing.version,
          clientTotalUsdCents: total,
          serverTotalUsdCents: total + 700,
          diffCents: 700,
        },
      },
    );
    expect(JSON.stringify(vi.mocked(captureMessage).mock.calls)).not.toContain(
      publicId,
    );
  });

  it('sends one request with one key on a double click', async () => {
    await renderResult();
    const total = clientTotal();
    let resolve!: (value: unknown) => void;
    post.mockReturnValue(new Promise((done) => (resolve = done)));

    await act(async () => {
      fireEvent.click(saveButton());
      fireEvent.click(saveButton());
    });

    expect(post).toHaveBeenCalledTimes(1);
    expect(saveButton()).toHaveAttribute('aria-busy', 'true');
    await act(async () => resolve(created(snapshot(total))));
    expect(screen.getByText('Estimate saved')).toBeInTheDocument();
  });

  it('reuses the key when the same request is retried', async () => {
    await renderResult();
    post
      .mockResolvedValueOnce(failure(500, 'INTERNAL'))
      .mockResolvedValueOnce(created(snapshot(clientTotal())));

    await save();
    expect(screen.getByText(/Could not save the estimate/)).toBeInTheDocument();
    await save();

    const keys = post.mock.calls.map(
      ([, options]) => options.params.header['Idempotency-Key'],
    );
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
  });

  it('waits for a sleeping server and then sends', async () => {
    await renderResult();
    act(() => useWarmup.setState({ server: 'warming' }));
    post.mockResolvedValue(created(snapshot(clientTotal())));

    await save();

    expect(post).not.toHaveBeenCalled();
    expect(saveButton(/Waking the server/)).toHaveAttribute(
      'aria-busy',
      'true',
    );
    await act(async () => useWarmup.setState({ server: 'ready' }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Estimate saved')).toBeInTheDocument();
  });

  it('refreshes prices and points to the object on INPUT_OUT_OF_BOUNDS', async () => {
    await renderResult();
    post.mockResolvedValue(failure(422, 'INPUT_OUT_OF_BOUNDS'));

    await save();

    expect(screen.getByText(/outside the allowed range/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Go to the object' }),
    ).toBeVisible();
    expect(checkPricingData).toHaveBeenCalledTimes(2);
  });

  it('refreshes the data on UNKNOWN_REFERENCE', async () => {
    const queryClient = await renderResult();
    const invalidate = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined);
    post.mockResolvedValue(failure(422, 'UNKNOWN_REFERENCE'));

    await save();

    expect(
      screen.getByText(/materials or services have changed/),
    ).toBeVisible();
    expect(checkPricingData).toHaveBeenCalledTimes(2);
    for (const root of Object.values(catalogRoots)) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: [root] });
    }
  });

  it('clears the style on STYLE_NOT_FOUND', async () => {
    await renderResult();
    post.mockResolvedValue(failure(422, 'STYLE_NOT_FOUND'));

    await save();

    expect(useDraft.getState().styleId).toBeNull();
  });

  it('shows an error state on VALIDATION_FAILED and reports it', async () => {
    await renderResult();
    post.mockResolvedValue(failure(400, 'VALIDATION_FAILED'));

    await save();

    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
    expect(captureException).toHaveBeenCalled();
  });

  it('asks to try again on a reused key and reports it', async () => {
    await renderResult();
    post.mockResolvedValue(failure(422, 'IDEMPOTENCY_KEY_REUSED'));

    await save();

    expect(screen.getByText(/Could not save the estimate/)).toBeVisible();
    expect(captureException).toHaveBeenCalled();
  });

  it('blocks the button for retryAfterSeconds on 429', async () => {
    await renderResult();
    post.mockResolvedValue(
      failure(429, 'RATE_LIMITED', { retryAfterSeconds: 30 }),
    );

    await save();

    expect(screen.getByText(/save again in 30 seconds/)).toBeVisible();
    expect(saveButton()).toBeDisabled();
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('re-enables the button once retryAfterSeconds have passed', async () => {
    post.mockResolvedValue(
      failure(429, 'RATE_LIMITED', { retryAfterSeconds: 3 }),
    );
    vi.useFakeTimers();
    try {
      await renderResult();
      await save();
      expect(saveButton()).toBeDisabled();

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/save again in 2 seconds/)).toBeVisible();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      expect(saveButton()).toBeEnabled();
      expect(screen.queryByText(/save again in/)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('builds the request from the draft as it is after the pricing check', async () => {
    await renderResult();
    let finishCheck!: () => void;
    vi.mocked(checkPricingData).mockReturnValueOnce(
      new Promise<void>((done) => (finishCheck = done)),
    );
    post.mockImplementation(async (_url, options) =>
      created(snapshot(options.body.clientTotalUsdCents)),
    );

    await act(async () => {
      fireEvent.click(saveButton());
    });
    await act(async () => {
      useDraft.setState((state) => ({
        revision: state.revision + 1,
        rooms: state.rooms.map((room, index) =>
          index === 0 ? { ...room, lengthM: (room.lengthM ?? 0) + 1 } : room,
        ),
      }));
    });
    const edited = clientTotal();
    await act(async () => finishCheck());

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][1].body.clientTotalUsdCents).toBe(edited);
    expect(screen.getByLabelText('Link to the estimate')).toBeVisible();
  });

  it('drops a failure notice once the draft changes', async () => {
    await renderResult();
    post.mockResolvedValue(failure(500, 'INTERNAL'));

    await save();
    expect(screen.getByText(/Could not save the estimate/)).toBeVisible();
    await act(async () => {
      useDraft.setState((state) => ({ revision: state.revision + 1 }));
    });

    expect(screen.queryByText(/Could not save the estimate/)).toBeNull();
  });

  it('shows no banner when the price difference is zero', async () => {
    await renderResult();
    const total = clientTotal();
    post.mockResolvedValue(
      created(snapshot(total, { diffCents: 0, savedTotalUsdCents: total })),
    );

    await save();

    expect(screen.getByText('Estimate saved')).toBeInTheDocument();
    expect(screen.queryByText(/The total has/)).toBeNull();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('words a decrease as a decrease', async () => {
    await renderResult();
    const saved = clientTotal() - 12500;
    post.mockResolvedValue(
      created(
        snapshot(saved, { diffCents: -12500, savedTotalUsdCents: saved }),
      ),
    );

    await save();

    expect(screen.getByText(/The total has decreased by \$125/)).toBeVisible();
  });
});
