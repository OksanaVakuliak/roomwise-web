import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { Locale } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSessionProvider } from '@/features/admin/session';
import { api } from '@/lib/api/client';
import { toast, useToasts } from '@/lib/toast';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import { makeAdminFailure } from '@/test/fixtures/admin/errors';
import { makeAdminMe, makeDemoMe } from '@/test/fixtures/admin/me';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { AdminAccount } from './index';

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

async function setup(locale: Locale, me = makeAdminMe()) {
  get.mockResolvedValue({ data: me, response: { status: 200 } });
  const view = renderWithProviders(
    <AdminSessionProvider>
      <AdminAccount />
    </AdminSessionProvider>,
    { locale, url: '/admin/account' },
  );
  const t = catalogs[locale as 'en' | 'uk'].AdminAccount;
  await screen.findByText(me.login);
  return { ...view, t };
}

const field = (label: string) => screen.getByLabelText(new RegExp(label));

function fill(
  t: typeof en.AdminAccount,
  values: { current: string; next: string; confirm: string },
) {
  fireEvent.change(field(t.currentPassword), {
    target: { value: values.current },
  });
  fireEvent.change(field(t.newPassword), { target: { value: values.next } });
  fireEvent.change(field(t.confirmPassword), {
    target: { value: values.confirm },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
  for (const { id } of useToasts.getState().items) toast.dismiss(id);
});

describe.each(forEachLocale)('AdminAccount (%s)', (locale) => {
  it('shows the login and has no a11y violations', async () => {
    const { container, t } = await setup(locale);
    expect(screen.getByText(t.login)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('changes the password, shows a toast and resets the form', async () => {
    post.mockResolvedValue({ response: { status: 204 } });
    const { t } = await setup(locale);
    fill(t, {
      current: 'old-password',
      next: 'new-password-1',
      confirm: 'new-password-1',
    });
    fireEvent.click(screen.getByRole('button', { name: t.submit }));

    await waitFor(() =>
      expect(useToasts.getState().items.map((item) => item.message)).toContain(
        t.changed,
      ),
    );
    expect(post).toHaveBeenCalledWith('/api/v1/admin/auth/password', {
      body: { currentPassword: 'old-password', newPassword: 'new-password-1' },
    });
    expect(field(t.currentPassword)).toHaveValue('');
    expect(field(t.newPassword)).toHaveValue('');
    expect(field(t.confirmPassword)).toHaveValue('');
  });

  it('blocks submit when the confirmation differs', async () => {
    const { t } = await setup(locale);
    fill(t, {
      current: 'old-password',
      next: 'new-password-1',
      confirm: 'other',
    });
    fireEvent.click(screen.getByRole('button', { name: t.submit }));

    expect(await screen.findByText(t.mismatch)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('shows a server field error under the field', async () => {
    post.mockResolvedValue(
      failure(
        makeAdminFailure(400, 'VALIDATION_FAILED', {
          fields: [
            { path: 'newPassword', code: 'TOO_SHORT', params: { min: 12 } },
          ],
        }),
      ),
    );
    const { t } = await setup(locale);
    fill(t, { current: 'old-password', next: 'short', confirm: 'short' });
    fireEvent.click(screen.getByRole('button', { name: t.submit }));

    const message = catalogs[
      locale as 'en' | 'uk'
    ].AdminErrors.field.TOO_SHORT.replace('{min}', '12');
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(field(t.newPassword)).toHaveValue('short');
  });

  it('marks a wrong current password on its field', async () => {
    post.mockResolvedValue(
      failure(makeAdminFailure(401, 'INVALID_CREDENTIALS')),
    );
    const { t } = await setup(locale);
    fill(t, {
      current: 'wrong',
      next: 'new-password-1',
      confirm: 'new-password-1',
    });
    fireEvent.click(screen.getByRole('button', { name: t.submit }));

    expect(await screen.findByText(t.wrongPassword)).toBeInTheDocument();
  });

  it('explains why the form is unavailable in demo and sends nothing', async () => {
    const { t } = await setup(locale, makeDemoMe());
    const button = screen.getByRole('button', { name: t.submit });
    const reason = catalogs[locale as 'en' | 'uk'].Admin.demo.reason.password;
    expect(button).toHaveAccessibleDescription(reason);
    expect(field(t.currentPassword)).toBeDisabled();
    fireEvent.click(button);
    fireEvent.submit(button.closest('form') as HTMLFormElement);

    expect(post).not.toHaveBeenCalled();
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toHaveTextContent(reason);
  });
});
