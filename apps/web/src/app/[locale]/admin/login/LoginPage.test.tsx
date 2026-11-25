import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { Locale } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '@/features/admin/session';
import { api } from '@/lib/api/client';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import { adminErrors, makeAdminFailure } from '@/test/fixtures/admin/errors';
import { makeAdminMe } from '@/test/fixtures/admin/me';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../../messages/en.json';
import uk from '../../../../../messages/uk.json';
import { LoginPage } from './LoginPage';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;

const catalogs = { en, uk };

const failure = (error: { status: number; body: unknown }) => ({
  error: error.body,
  response: { status: error.status },
});

const anonymous = () =>
  get.mockResolvedValue(failure(adminErrors.unauthenticated()));

function setup(locale: Locale, url = '/admin/login') {
  return renderWithProviders(
    <AdminSessionProvider>
      <LoginPage />
    </AdminSessionProvider>,
    { locale, url },
  );
}

function fill(
  labels: { login: string; password: string },
  values: { login: string; password: string },
) {
  fireEvent.change(screen.getByLabelText(new RegExp(labels.login)), {
    target: { value: values.login },
  });
  fireEvent.change(screen.getByLabelText(new RegExp(labels.password)), {
    target: { value: values.password },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
  anonymous();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe.each(forEachLocale)('admin login page (%s)', (locale) => {
  const t = catalogs[locale].AdminAuth;
  const errors = catalogs[locale].AdminErrors;

  it('shows a generic error that does not name the wrong field', async () => {
    post.mockResolvedValue(failure(adminErrors.invalidCredentials()));
    const { container } = setup(locale);

    fill(t, { login: 'admin', password: 'wrong' });
    fireEvent.click(screen.getByRole('button', { name: t.submit }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(errors.invalidCredentials);
    expect(screen.getByLabelText(new RegExp(t.login))).not.toBeInvalid();
    expect(screen.getByLabelText(new RegExp(t.password))).not.toBeInvalid();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('blocks the form during a lockout and unblocks it at zero', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    post.mockResolvedValue(
      failure(
        makeAdminFailure(423, 'ACCOUNT_LOCKED', {
          params: { retryAfterSeconds: 3 },
        }),
      ),
    );
    setup(locale);

    fill(t, { login: 'admin', password: 'secret' });
    fireEvent.click(screen.getByRole('button', { name: t.submit }));

    const message = (seconds: number) =>
      t.retryIn.replace('{seconds}', String(seconds));
    expect(await screen.findByText(message(3))).toBeInTheDocument();
    expect(screen.getByText(t.locked)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.submit })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(message(2))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.submit })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button', { name: t.submit })).toBeEnabled();
    await waitFor(() =>
      expect(screen.queryByText(t.locked)).not.toBeInTheDocument(),
    );
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('fills the demo credentials without sending them', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_ADMIN_LOGIN', 'demo-user');
    vi.stubEnv('NEXT_PUBLIC_DEMO_ADMIN_PASSWORD', 'demo-pass');
    const { container } = setup(locale);

    expect(screen.getByText('demo-user')).toBeInTheDocument();
    expect(screen.getByText('demo-pass')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: t.demo.fill }));

    expect(screen.getByLabelText(new RegExp(t.login))).toHaveValue('demo-user');
    expect(screen.getByLabelText(new RegExp(t.password))).toHaveValue(
      'demo-pass',
    );
    expect(post).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows no demo hint without the environment variables', () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_ADMIN_LOGIN', '');
    vi.stubEnv('NEXT_PUBLIC_DEMO_ADMIN_PASSWORD', '');
    setup(locale);

    expect(screen.queryByText(t.demo.title)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: t.demo.fill }),
    ).not.toBeInTheDocument();
  });

  it('shows no demo hint when only one variable is set', () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_ADMIN_LOGIN', 'demo-user');
    vi.stubEnv('NEXT_PUBLIC_DEMO_ADMIN_PASSWORD', '');
    setup(locale);

    expect(screen.queryByText(t.demo.title)).not.toBeInTheDocument();
  });

  it('shows the warm-up screen while the server is waking', () => {
    useWarmup.setState({ server: 'warming', startedAt: Date.now() - 5000 });
    setup(locale);

    expect(
      screen.getByText(catalogs[locale].SystemStates.warmupTitle),
    ).toBeInTheDocument();
  });

  it('redirects to the requested admin page after signing in', async () => {
    post.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
    const { router } = setup(
      locale,
      `/admin/login?next=${encodeURIComponent('/admin/leads?status=NEW')}`,
    );

    fill(t, { login: 'admin', password: 'secret' });
    fireEvent.click(screen.getByRole('button', { name: t.submit }));

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        `/${locale}/admin/leads?status=NEW`,
      ),
    );
  });

  it.each([
    'https://evil.example/admin',
    '//evil.example',
    '/configurator',
    '/admin/login',
  ])('falls back to /admin for the unsafe next %s', async (unsafe) => {
    post.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
    const { router } = setup(
      locale,
      `/admin/login?next=${encodeURIComponent(unsafe)}`,
    );

    fill(t, { login: 'admin', password: 'secret' });
    fireEvent.click(screen.getByRole('button', { name: t.submit }));

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(`/${locale}/admin`),
    );
    expect(router.replace).toHaveBeenCalledTimes(1);
  });

  it('redirects at once when the session is already open', async () => {
    get.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
    const { router } = setup(
      locale,
      `/admin/login?next=${encodeURIComponent('/admin/account')}`,
    );

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(`/${locale}/admin/account`),
    );
    expect(post).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = setup(locale);
    expect(await axe(container)).toHaveNoViolations();
  });
});
