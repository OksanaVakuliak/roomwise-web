import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api/client';
import { ApiRequestError } from '@/lib/api/request-error';
import { createWriteGate, RateLimitedError } from '@/lib/api/write';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { adminErrors } from '@/test/fixtures/admin/errors';
import { makeAdminMe } from '@/test/fixtures/admin/me';
import { createTestQueryClient } from '@/test/render-with-providers';
import {
  changePassword,
  login,
  logout,
  me,
  useAdminMe,
  useLogin,
  useLogout,
} from './auth';
import { adminKeys } from './keys';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;

function setup() {
  const queryClient = createTestQueryClient();
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { queryClient, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

describe('adminKeys', () => {
  it('shapes keys as admin, area, parts', () => {
    expect(adminKeys.me()).toEqual(['admin', 'me']);
    expect(adminKeys.area('catalog', 'list', { page: 2 })).toEqual([
      'admin',
      'catalog',
      'list',
      { page: 2 },
    ]);
    expect(adminKeys.all()).toEqual(['admin']);
  });
});

describe('login', () => {
  it('posts credentials and returns the admin', async () => {
    const admin = makeAdminMe();
    post.mockResolvedValue({ data: admin, response: { status: 200 } });
    const body = { login: 'admin', password: 'secret' };

    await expect(login(createWriteGate(), body)).resolves.toEqual(admin);
    expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/admin/auth/login', {
      body,
    });
  });

  it('surfaces invalid credentials', async () => {
    const { status, body } = adminErrors.invalidCredentials();
    post.mockResolvedValue({ error: body, response: { status } });

    const failure = await login(createWriteGate(), {
      login: 'a',
      password: 'b',
    }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ApiRequestError);
    expect(failure).toMatchObject({ status: 401 });
  });

  it('surfaces 429 as RateLimitedError', async () => {
    const { status, body } = adminErrors.rateLimited(12);
    post.mockResolvedValue({ error: body, response: { status } });

    const failure = await login(createWriteGate(), {
      login: 'a',
      password: 'b',
    }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(RateLimitedError);
    expect(failure).toMatchObject({ retryAfterSeconds: 12 });
  });

  it('keeps 423 as an ApiRequestError with its wait', async () => {
    const { status, body } = adminErrors.locked(900);
    post.mockResolvedValue({ error: body, response: { status } });

    const failure = await login(createWriteGate(), {
      login: 'a',
      password: 'b',
    }).catch((error: unknown) => error);

    expect(failure).toMatchObject({
      status: 423,
      apiError: { params: { retryAfterSeconds: 900 } },
    });
  });
});

describe('logout and changePassword', () => {
  it('resolves on an empty 204 response', async () => {
    post.mockResolvedValue({ response: { status: 204 } });

    await expect(logout(createWriteGate())).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith('/api/v1/admin/auth/logout');
  });

  it('posts the password change', async () => {
    post.mockResolvedValue({ response: { status: 204 } });
    const body = { currentPassword: 'old', newPassword: 'new-secret' };

    await expect(
      changePassword(createWriteGate(), body),
    ).resolves.toBeUndefined();
    expect(post).toHaveBeenCalledWith('/api/v1/admin/auth/password', { body });
  });

  it('rejects when the password change fails', async () => {
    const { status, body } = adminErrors.demoForbidden();
    post.mockResolvedValue({ error: body, response: { status } });

    await expect(
      changePassword(createWriteGate(), {
        currentPassword: 'a',
        newPassword: 'b',
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('me', () => {
  it('returns the signed-in admin', async () => {
    const admin = makeAdminMe();
    get.mockResolvedValue({ data: admin, response: { status: 200 } });

    await expect(me()).resolves.toEqual(admin);
    expect(get).toHaveBeenCalledWith('/api/v1/admin/auth/me');
  });
});

describe('useAdminMe', () => {
  it('loads the admin once the server is ready', async () => {
    const admin = makeAdminMe();
    get.mockResolvedValue({ data: admin, response: { status: 200 } });
    const { wrapper } = setup();

    const { result } = renderHook(() => useAdminMe(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(admin));
  });

  it('does not fetch while the server is warming up', () => {
    useWarmup.setState({ server: 'warming' });
    const { wrapper } = setup();

    renderHook(() => useAdminMe(), { wrapper });

    expect(get).not.toHaveBeenCalled();
  });

  it('does not retry a 401', async () => {
    const { status, body } = adminErrors.unauthenticated();
    get.mockResolvedValue({ error: body, response: { status } });
    const { wrapper } = setup();

    const { result } = renderHook(() => useAdminMe(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(get).toHaveBeenCalledTimes(1);
  });
});

describe('useLogin and useLogout', () => {
  it('stores the admin after login', async () => {
    const admin = makeAdminMe();
    post.mockResolvedValue({ data: admin, response: { status: 200 } });
    const { queryClient, wrapper } = setup();

    const { result } = renderHook(() => useLogin(), { wrapper });
    await act(() =>
      result.current.mutateAsync({ login: 'admin', password: 'secret' }),
    );

    expect(queryClient.getQueryData(adminKeys.me())).toEqual(admin);
  });

  it('drops admin queries after logout', async () => {
    post.mockResolvedValue({ response: { status: 204 } });
    const { queryClient, wrapper } = setup();
    queryClient.setQueryData(adminKeys.me(), makeAdminMe());
    queryClient.setQueryData(adminKeys.area('catalog', 'list'), []);

    const { result } = renderHook(() => useLogout(), { wrapper });
    await act(() => result.current.mutateAsync());

    expect(queryClient.getQueryData(adminKeys.me())).toBeUndefined();
    expect(
      queryClient.getQueryData(adminKeys.area('catalog', 'list')),
    ).toBeUndefined();
  });
});
