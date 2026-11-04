import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { makeLeadCreated, makeLeadFormSettings } from '@/test/fixtures';
import { createTestQueryClient } from '@/test/render-with-providers';
import { api } from './client';
import {
  type LeadBody,
  leadKeys,
  submitLead,
  useLeadFormSettings,
} from './leads';
import { ApiRequestError } from './request-error';
import { createWriteGate } from './write';

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn() },
}));

const get = vi.mocked(api.GET) as unknown as ReturnType<typeof vi.fn>;
const post = vi.mocked(api.POST) as unknown as ReturnType<typeof vi.fn>;

const body = { name: 'Olena' } as unknown as LeadBody;

function setup(locale: 'en' | 'uk' = 'en') {
  const queryClient = createTestQueryClient();
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale={locale} messages={{}}>
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  }
  return { queryClient, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
});

describe('leadKeys', () => {
  it('scopes settings by language', () => {
    expect(leadKeys.settings('uk')).toEqual(['lead-settings', 'uk']);
  });
});

describe('submitLead', () => {
  it('posts the body with the idempotency header and no lang', async () => {
    const created = makeLeadCreated();
    post.mockResolvedValue({ data: created, response: { status: 201 } });

    const result = await submitLead(createWriteGate(), {
      body,
      idempotencyKey: 'key-1',
    });

    expect(result).toEqual(created);
    expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/public/leads', {
      params: { header: { 'Idempotency-Key': 'key-1' } },
      body,
    });
  });

  it('throws the api error on a failure', async () => {
    post.mockResolvedValue({
      error: { error: { code: 'PHONE_INVALID' } },
      response: { status: 422 },
    });

    await expect(
      submitLead(createWriteGate(), { body, idempotencyKey: 'key-1' }),
    ).rejects.toMatchObject({
      status: 422,
      apiError: { code: 'PHONE_INVALID' },
    });
  });
});

describe('useLeadFormSettings', () => {
  it('loads the settings in the active language', async () => {
    const settings = makeLeadFormSettings();
    get.mockResolvedValue({ data: settings, response: { status: 200 } });
    const { wrapper } = setup('uk');

    const { result } = renderHook(() => useLeadFormSettings(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(settings));
    expect(get).toHaveBeenCalledExactlyOnceWith(
      '/api/v1/public/leads/form-settings',
      { params: { query: { lang: 'uk' } } },
    );
  });

  it('waits for the server to wake up', () => {
    useWarmup.setState({ server: 'warming' });
    const { wrapper } = setup();

    renderHook(() => useLeadFormSettings(), { wrapper });

    expect(get).not.toHaveBeenCalled();
  });

  it('exposes a failure as an api error', async () => {
    get.mockResolvedValue({
      error: { error: { code: 'INTERNAL' } },
      response: { status: 500 },
    });
    const { wrapper } = setup();

    const { result } = renderHook(() => useLeadFormSettings(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiRequestError);
  });
});
