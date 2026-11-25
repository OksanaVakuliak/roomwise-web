import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import { makeAdminLeads } from '@/test/fixtures/admin/leads';
import { makeAdminMe } from '@/test/fixtures/admin/me';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { AdminSessionGate, AdminSessionProvider } from '../session';
import { PanelShell } from '../shell';
import { AdminHome } from './AdminHome';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;

const expected = {
  en: { count: 'New leads: 5', none: 'No new leads' },
  uk: { count: 'Нові заявки: 5', none: 'Нових заявок немає' },
} as const;

function mockApi(total: number | 'pending') {
  get.mockImplementation((path: string) => {
    if (path === '/api/v1/admin/leads') {
      return total === 'pending'
        ? new Promise(() => {})
        : Promise.resolve({
            data: { ...makeAdminLeads(), total },
            response: { status: 200 },
          });
    }
    return Promise.resolve({ data: makeAdminMe(), response: { status: 200 } });
  });
}

const setup = (locale: 'en' | 'uk') =>
  renderWithProviders(
    <AdminSessionProvider>
      <AdminSessionGate>
        <PanelShell>
          <AdminHome />
        </PanelShell>
      </AdminSessionGate>
    </AdminSessionProvider>,
    { locale, url: '/admin' },
  );

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

describe.each(forEachLocale)('AdminHome (%s)', (locale) => {
  it('links the new leads count to the NEW list', async () => {
    mockApi(5);
    setup(locale);

    const link = await screen.findByRole('link', {
      name: expected[locale].count,
    });
    expect(link).toHaveAttribute('href', `/${locale}/admin/leads?status=NEW`);
    expect(get).toHaveBeenCalledWith('/api/v1/admin/leads', {
      params: { query: { status: 'NEW', pageSize: 1 } },
    });
  });

  it('says there are no new leads when the count is zero', async () => {
    mockApi(0);
    setup(locale);

    expect(
      await screen.findByRole('link', { name: expected[locale].none }),
    ).toBeInTheDocument();
  });

  it('shows a skeleton while the count loads', async () => {
    mockApi('pending');
    setup(locale);

    const main = (await screen.findByRole('heading', { level: 1 }))
      .parentElement as HTMLElement;
    expect(within(main).getByRole('status')).toBeInTheDocument();
  });

  it('offers a card link to every section', async () => {
    mockApi(5);
    setup(locale);
    await screen.findByRole('link', { name: expected[locale].count });

    const cards = screen.getByRole('region', {
      name: locale === 'en' ? 'Sections' : 'Розділи',
    });
    expect(within(cards).getAllByRole('link')).toHaveLength(14);
  });

  it('has no axe violations', async () => {
    mockApi(5);
    const { container } = setup(locale);
    await screen.findByRole('link', { name: expected[locale].count });

    expect(await axe(container)).toHaveNoViolations();
  });
});
