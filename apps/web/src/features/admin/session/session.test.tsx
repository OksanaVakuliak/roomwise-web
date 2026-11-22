import { useMutation } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { type ChangeEvent, useCallback, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changePassword } from '@/lib/admin-api/auth';
import { api } from '@/lib/api/client';
import { ApiRequestError } from '@/lib/api/request-error';
import { createWriteGate } from '@/lib/api/write';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { axe } from '@/test/axe';
import { adminErrors, makeAdminFailure } from '@/test/fixtures/admin/errors';
import { makeAdminMe, makeDemoMe } from '@/test/fixtures/admin/me';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import {
  AdminSessionGate,
  AdminSessionProvider,
  useAdminSession,
  useCan,
} from './index';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;

const failure = (error: { status: number; body: unknown }) => ({
  error: error.body,
  response: { status: error.status },
});

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

function Form() {
  const { withReauth } = useAdminSession();
  const [gate] = useState(createWriteGate);
  const [note, setNote] = useState('');
  const mutation = useMutation({
    mutationFn: () =>
      withReauth(() =>
        changePassword(gate, { currentPassword: note, newPassword: 'x' }),
      ),
  });
  const { mutate } = mutation;
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setNote(event.target.value),
    [],
  );
  const onSave = useCallback(() => mutate(), [mutate]);
  return (
    <div>
      <input aria-label="note" value={note} onChange={onChange} />
      <button type="button" onClick={onSave}>
        save
      </button>
      <output data-testid="state">{mutation.status}</output>
    </div>
  );
}

function CanProbe() {
  const can = useCan('lead-delete');
  return <output data-testid="can">{JSON.stringify(can)}</output>;
}

const setup = (locale: 'en' | 'uk') =>
  renderWithProviders(
    <AdminSessionProvider>
      <AdminSessionGate>
        <Form />
        <CanProbe />
      </AdminSessionGate>
    </AdminSessionProvider>,
    { locale, url: '/admin/leads' },
  );

describe.each(forEachLocale)('admin session (%s)', (locale) => {
  it('shows a skeleton and no content while checking', async () => {
    get.mockReturnValue(new Promise(() => {}));
    setup(locale);

    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.queryByLabelText('note')).not.toBeInTheDocument();
  });

  it('redirects to login with next after a 401 on me', async () => {
    get.mockResolvedValue(failure(adminErrors.unauthenticated()));
    const { router } = setup(locale);

    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1));
    const target = String(router.replace.mock.calls[0]?.[0]);
    expect(target).toContain('/admin/login?next=');
    expect(decodeURIComponent(target)).toContain('/admin/leads');
    expect(screen.queryByLabelText('note')).not.toBeInTheDocument();
  });

  it('redirects when a later read returns 401', async () => {
    get.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
    const { router, queryClient } = setup(locale);
    await screen.findByLabelText('note');
    expect(router.replace).not.toHaveBeenCalled();

    const { status, body } = adminErrors.unauthenticated();
    await act(async () => {
      await queryClient
        .fetchQuery({
          queryKey: ['admin', 'leads'],
          queryFn: () => Promise.reject(new ApiRequestError(status, body)),
        })
        .catch(() => undefined);
    });
    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1));
  });

  it('treats the session as anonymous when a refetch of me returns 401', async () => {
    get.mockResolvedValueOnce({
      data: makeAdminMe(),
      response: { status: 200 },
    });
    get.mockResolvedValue(failure(adminErrors.unauthenticated()));
    const { router, queryClient } = setup(locale);
    await screen.findByLabelText('note');

    await act(async () => {
      window.dispatchEvent(
        Object.assign(new Event('pageshow'), { persisted: true }),
      );
    });

    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1));
    expect(
      decodeURIComponent(String(router.replace.mock.calls[0]?.[0])),
    ).toContain('/admin/login?next=/');
    expect(screen.queryByLabelText('note')).not.toBeInTheDocument();
    expect(queryClient.getQueryData(['admin', 'me'])).toBeNull();
  });

  it('makes the session anonymous when another read returns 401', async () => {
    get.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
    const { queryClient } = setup(locale);
    await screen.findByLabelText('note');

    const { status, body } = adminErrors.unauthenticated();
    await act(async () => {
      await queryClient
        .fetchQuery({
          queryKey: ['admin', 'leads'],
          queryFn: () => Promise.reject(new ApiRequestError(status, body)),
        })
        .catch(() => undefined);
    });

    await waitFor(() =>
      expect(queryClient.getQueryData(['admin', 'me'])).toBeNull(),
    );
  });

  it('shows a retryable error instead of a blank panel when me fails with a server error', async () => {
    get.mockResolvedValue(failure(makeAdminFailure(500, 'INTERNAL')));
    const { router } = setup(locale);

    const alert = await screen.findByRole('alert', {}, { timeout: 8000 });
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('note')).not.toBeInTheDocument();

    get.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
    fireEvent.click(within(alert).getByRole('button'));

    expect(await screen.findByLabelText('note')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  }, 15000);

  it('reauthenticates on a 401 mutation, repeats it once and keeps the form', async () => {
    get.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
    post
      .mockResolvedValueOnce(failure(adminErrors.unauthenticated()))
      .mockResolvedValueOnce({ data: makeAdminMe(), response: { status: 200 } })
      .mockResolvedValueOnce({ data: true, response: { status: 204 } });
    const { router } = setup(locale);

    fireEvent.change(await screen.findByLabelText('note'), {
      target: { value: 'draft text' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    const dialog = await screen.findByRole('dialog');
    expect(router.replace).not.toHaveBeenCalled();
    expect(await axe(document.body)).toHaveNoViolations();

    const inputs = dialog.querySelectorAll('input');
    expect(inputs[0]).toHaveValue(makeAdminMe().login);
    expect(inputs[0]).toHaveAttribute('readonly');
    fireEvent.change(inputs[1] as HTMLInputElement, {
      target: { value: 'secret' },
    });
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement);

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('success'),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(3);
    expect(post.mock.calls[0]?.[0]).toBe('/api/v1/admin/auth/password');
    expect(post.mock.calls[1]?.[0]).toBe('/api/v1/admin/auth/login');
    expect(post.mock.calls[1]?.[1]).toMatchObject({
      body: { login: makeAdminMe().login, password: 'secret' },
    });
    expect(post.mock.calls[2]?.[0]).toBe('/api/v1/admin/auth/password');
    expect(screen.getByLabelText('note')).toHaveValue('draft text');
  });

  it('fails the mutation when the dialog is cancelled', async () => {
    get.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
    post.mockResolvedValue(failure(adminErrors.unauthenticated()));
    setup(locale);

    fireEvent.click(await screen.findByRole('button', { name: 'save' }));
    const dialog = await screen.findByRole('dialog');
    const buttons = dialog.querySelectorAll('button[type="button"]');
    fireEvent.click(buttons[buttons.length - 1] as HTMLButtonElement);

    await waitFor(() =>
      expect(screen.getByTestId('state')).toHaveTextContent('error'),
    );
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('forbids lead deletion for the demo with a reason', async () => {
    get.mockResolvedValue({ data: makeDemoMe(), response: { status: 200 } });
    setup(locale);

    const probe = await screen.findByTestId('can');
    const can = JSON.parse(probe.textContent ?? '{}') as {
      allowed: boolean;
      reason?: string;
    };
    expect(can.allowed).toBe(false);
    expect(can.reason).toBeTruthy();
  });

  it('allows the action for a regular admin', async () => {
    get.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
    setup(locale);

    expect(await screen.findByTestId('can')).toHaveTextContent(
      '{"allowed":true}',
    );
  });

  it('re-checks the session on a persisted pageshow', async () => {
    get.mockResolvedValue({ data: makeAdminMe(), response: { status: 200 } });
    setup(locale);
    await screen.findByLabelText('note');
    expect(get).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(
        Object.assign(new Event('pageshow'), { persisted: false }),
      );
    });
    expect(get).toHaveBeenCalledTimes(1);

    await act(async () => {
      window.dispatchEvent(
        Object.assign(new Event('pageshow'), { persisted: true }),
      );
    });
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });
});
