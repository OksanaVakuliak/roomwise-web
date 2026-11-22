import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import { adminErrors } from '@/test/fixtures/admin/errors';
import { makeAdminMe, makeDemoMe } from '@/test/fixtures/admin/me';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { AdminSessionGate, AdminSessionProvider } from '../session';
import { AdminShell } from './index';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;
const replace = vi.fn();
const originalLocation = window.location;

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, replace },
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

const setup = (
  locale: 'en' | 'uk',
  { url = '/admin', newLeads }: { url?: string; newLeads?: number } = {},
) =>
  renderWithProviders(
    <AdminSessionProvider>
      <AdminSessionGate>
        <AdminShell newLeads={newLeads}>
          <h1>content</h1>
        </AdminShell>
      </AdminSessionGate>
    </AdminSessionProvider>,
    { locale, url },
  );

const sidebar = () => screen.getByRole('complementary');

describe.each(forEachLocale)('AdminShell (%s)', (locale) => {
  beforeEach(() => {
    get.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
  });

  it('lists every section and marks the current one', async () => {
    setup(locale, { url: '/admin/catalog/products/abc' });
    await screen.findByRole('heading', { name: 'content' });

    const links = within(sidebar()).getAllByRole('link');
    expect(links).toHaveLength(15);
    const current = links.filter(
      (link) => link.getAttribute('aria-current') === 'page',
    );
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute(
      'href',
      `/${locale}/admin/catalog/products`,
    );
  });

  it('marks only the home link on the root path', async () => {
    setup(locale);
    await screen.findByRole('heading', { name: 'content' });

    const current = within(sidebar())
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('href', `/${locale}/admin`);
  });

  it('shows the new leads count on the leads link', async () => {
    setup(locale, { url: '/admin/leads', newLeads: 3 });
    await screen.findByRole('heading', { name: 'content' });

    const leads = within(sidebar())
      .getAllByRole('link')
      .find((link) => link.getAttribute('href')?.endsWith('/admin/leads'));
    expect(leads).toHaveTextContent('3');
  });

  it('opens the navigation in a side panel on a phone', async () => {
    setup(locale);
    await screen.findByRole('heading', { name: 'content' });

    const menu = screen.getAllByRole('button').find((button) => {
      return button.getAttribute('aria-haspopup') === 'dialog';
    });
    expect(menu).toBeDefined();
    fireEvent.click(menu as HTMLElement);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByRole('link')).toHaveLength(15);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('closes the phone menu when the current page link is tapped', async () => {
    setup(locale);
    await screen.findByRole('heading', { name: 'content' });

    const menu = screen.getAllByRole('button').find((button) => {
      return button.getAttribute('aria-haspopup') === 'dialog';
    });
    fireEvent.click(menu as HTMLElement);
    const dialog = await screen.findByRole('dialog');
    const current = within(dialog)
      .getAllByRole('link')
      .find((link) => link.getAttribute('aria-current') === 'page');
    fireEvent.click(current as HTMLElement);

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('signs out, clears the cache and replaces the location', async () => {
    post.mockResolvedValue({ data: true, response: { status: 204 } });
    const { queryClient } = setup(locale);
    await screen.findByRole('heading', { name: 'content' });
    queryClient.setQueryData(['admin', 'leads'], { items: [] });

    const button = screen.getAllByRole('button').find((item) => {
      return item.textContent === (locale === 'uk' ? 'Вийти' : 'Sign out');
    });
    fireEvent.click(button as HTMLElement);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(`/${locale}/admin/login`),
    );
    expect(post).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(['admin', 'leads'])).toBeUndefined();
  });

  it('keeps the page and reports a failed sign out', async () => {
    const failure = adminErrors.staleRevision();
    post.mockResolvedValue({
      error: failure.body,
      response: { status: failure.status },
    });
    setup(locale);
    await screen.findByRole('heading', { name: 'content' });

    const button = screen.getAllByRole('button').find((item) => {
      return item.textContent === (locale === 'uk' ? 'Вийти' : 'Sign out');
    });
    await act(async () => {
      fireEvent.click(button as HTMLElement);
    });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('shows no demo banner for a regular admin', async () => {
    setup(locale);
    await screen.findByRole('heading', { name: 'content' });
    expect(document.querySelector('time')).toBeNull();
  });

  it('shows the demo banner with the reset time in local time', async () => {
    get.mockResolvedValue({ data: makeDemoMe(), response: { status: 200 } });
    setup(locale);

    const banner = await screen.findByText(
      locale === 'uk' ? /Демо-режим/ : /Demo mode/,
    );
    expect(banner).toBeInTheDocument();
    const time = document.querySelector('time');
    expect(time).toHaveAttribute('datetime', '2026-11-22T03:00:00.000Z');
    expect(time?.textContent).not.toBe('');
  });

  it('has no axe violations', async () => {
    get.mockResolvedValue({ data: makeDemoMe(), response: { status: 200 } });
    const { container } = setup(locale, { newLeads: 2 });
    await screen.findByRole('heading', { name: 'content' });
    expect(await axe(container)).toHaveNoViolations();
  });
});
