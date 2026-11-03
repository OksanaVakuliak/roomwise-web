import { act, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { moneyMinor } from '@/lib/format';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import { calculationIds, makeVersionView } from '@/test/fixtures';
import {
  createTestQueryClient,
  renderWithProviders,
} from '@/test/render-with-providers';
import { CalculationScreen } from './CalculationScreen';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const { publicId } = calculationIds;

const ok = (data: unknown) => ({ data, response: { status: 200 } });
const failure = (status: number, code: string) => ({
  error: { error: { code } },
  response: { status },
});

const badge = () => <span>badge-slot</span>;
const notices = () => <p>notices-slot</p>;
const versions = () => <p>versions-slot</p>;
const actions = () => <button type="button">actions-slot</button>;

const normalize = (text: string) => text.replace(/ /g, ' ');

type RenderOptions = {
  locale?: 'en' | 'uk';
  currency?: 'USD' | 'UAH';
  versionNumber?: string;
  id?: string;
};

async function renderScreen({
  locale = 'en',
  currency = 'USD',
  versionNumber,
  id = publicId,
}: RenderOptions = {}) {
  let result!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    result = renderWithProviders(
      <CalculationScreen
        publicId={id}
        versionNumber={versionNumber}
        badge={badge}
        notices={notices}
        versions={versions}
        actions={actions}
      />,
      {
        locale,
        currency,
        queryClient: createTestQueryClient(),
        url: `/calculations/${id}`,
      },
    );
  });
  return result;
}

describe('CalculationScreen', () => {
  beforeEach(() => {
    get.mockReset();
    resetWarmup();
    useWarmup.setState({ server: 'ready' });
  });

  it.each([
    ['en', 'Estimate total'],
    ['uk', 'Разом за розрахунком'],
  ] as const)('renders the saved snapshot in %s', async (locale, total) => {
    const version = makeVersionView();
    get.mockResolvedValue(ok(version));
    const { container } = await renderScreen({ locale });

    expect(get.mock.calls[0]?.[0]).toBe(
      '/api/v1/public/calculations/{publicId}',
    );
    expect(await screen.findByText('Oak Natural Laminate')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 2, name: new RegExp(total) }),
    ).toHaveTextContent(
      normalize(moneyMinor(version.totals.usdCents, 'USD', locale)),
    );
    expect(screen.getByText('badge-slot')).toBeInTheDocument();
    expect(screen.getByText('notices-slot')).toBeInTheDocument();
    expect(screen.getByText('versions-slot')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'actions-slot' }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the amount in hryvnias at the rate saved with the snapshot', async () => {
    const version = makeVersionView();
    get.mockResolvedValue(ok(version));
    await renderScreen({ currency: 'UAH' });

    expect(
      await screen.findByRole('heading', { level: 2, name: /Estimate total/ }),
    ).toHaveTextContent(
      normalize(moneyMinor(version.totals.uahKopecks ?? 0, 'UAH', 'en')),
    );
    expect(screen.getByText(/NBU rate: ₴44\.55 per \$1/)).toBeInTheDocument();
  });

  it('falls back to dollars with a note when the snapshot has no rate', async () => {
    const version = makeVersionView({ exchangeRate: null });
    get.mockResolvedValue(ok(version));
    await renderScreen({ currency: 'UAH' });

    expect(
      await screen.findByRole('heading', { level: 2, name: /Estimate total/ }),
    ).toHaveTextContent(
      normalize(moneyMinor(version.totals.usdCents, 'USD', 'en')),
    );
    expect(
      screen.getByText(/saved without a hryvnia rate/),
    ).toBeInTheDocument();
  });

  it('requests the exact version for a version route', async () => {
    get.mockResolvedValue(ok(makeVersionView()));
    await renderScreen({ versionNumber: '2' });

    expect(get.mock.calls[0]?.[0]).toBe(
      '/api/v1/public/calculations/{publicId}/versions/{number}',
    );
    expect(get.mock.calls[0]?.[1].params.path).toEqual({
      publicId,
      number: '2',
    });
  });

  it('shows a loading status while the request is pending', async () => {
    get.mockReturnValue(new Promise(() => undefined));
    await renderScreen();

    expect(
      screen.getByRole('status', { name: 'Loading the estimate' }),
    ).toBeInTheDocument();
  });

  it.each([
    ['en', 'Estimate not found', 'Start calculation'],
    ['uk', 'Розрахунок не знайдено', 'Почати розрахунок'],
  ] as const)(
    'shows the not found state in %s',
    async (locale, title, action) => {
      get.mockResolvedValue(failure(404, 'CALCULATION_NOT_FOUND'));
      const { container } = await renderScreen({ locale });

      expect(
        await screen.findByRole('heading', { level: 2, name: title }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: action })).toHaveAttribute(
        'href',
        `/${locale}/configurator`,
      );
      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it.each(['abc', '0', '1.5', '-1'])(
    'shows not found without a request for version %s',
    async (versionNumber) => {
      await renderScreen({ versionNumber });

      expect(
        await screen.findByRole('heading', {
          level: 2,
          name: 'Estimate not found',
        }),
      ).toBeInTheDocument();
      expect(get).not.toHaveBeenCalled();
    },
  );

  it('shows not found without a request for an overlong id', async () => {
    await renderScreen({ id: 'a'.repeat(65) });

    expect(await screen.findByText('Estimate not found')).toBeInTheDocument();
    expect(get).not.toHaveBeenCalled();
  });

  it('shows the error state with retry for other errors', async () => {
    get.mockResolvedValue(failure(500, 'INTERNAL'));
    await renderScreen();

    expect(
      await screen.findByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Estimate not found')).not.toBeInTheDocument();
  });
});
