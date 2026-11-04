import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSaveRequest } from '@/features/configurator/result/build-save-request';
import { api } from '@/lib/api/client';
import { captureException } from '@/lib/monitoring/client';
import { installMemoryStorage } from '@/lib/theme/test-utils';
import { resetWarmup, useWarmup } from '@/lib/warmup';
import { pickDraft, useDraft } from '@/stores/draft';
import { checkPricingData } from '@/stores/pricing-data';
import { axe } from '@/test/axe';
import { makeLeadCreated, makeLeadFormSettings } from '@/test/fixtures';
import { makePricingData } from '@/test/fixtures/pricing-data';
import { renderWithProviders } from '@/test/render-with-providers';
import { makeDraft } from '../configurator/interior/interior-step.helpers';
import { LeadRequest, type LeadTarget } from './index';

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
const pricing = makePricingData();

const draftTarget: LeadTarget = { kind: 'draft' };
const snapshotTarget: LeadTarget = {
  kind: 'snapshot',
  publicId: 'k3m9x2q7',
  versionNumber: 3,
};

const created = (data: unknown) => ({ data, response: { status: 201 } });
const failure = (
  status: number,
  code: string,
  extra: { params?: object; fields?: object[] } = {},
) => ({
  error: { error: { code, ...extra } },
  response: { status },
});

const text = {
  en: {
    name: 'Name',
    phone: 'Phone',
    submit: 'Send the request',
    consent:
      'I agree to the processing of my personal data to receive an answer to this request.',
    confirmation: 'Request No. 1042 sent',
    open: 'Open the estimate',
    phoneError: /Enter a phone number in international format/,
    consentError: /^To send the request, agree/,
    nameError: /Enter your name/,
    retry: /seconds?\./,
  },
  uk: {
    name: "Ім'я",
    phone: 'Телефон',
    submit: 'Надіслати заявку',
    consent:
      'Погоджуюсь на обробку моїх персональних даних, щоб отримати відповідь на цю заявку.',
    confirmation: 'Заявку № 1042 надіслано',
    open: 'Відкрити розрахунок',
    phoneError: /Вкажіть номер телефону в міжнародному форматі/,
    consentError: /^Щоб надіслати заявку, погодьтеся/,
    nameError: /Вкажіть ім'я/,
    retry: /секунд/,
  },
} as const;

type Locale = keyof typeof text;

async function renderLead(
  target: LeadTarget = draftTarget,
  locale: Locale = 'en',
  lastSaved: 'none' | 'match' = 'none',
) {
  useDraft.setState({ ...makeDraft(), revision: 1, lastSaved: null });
  if (lastSaved === 'match') {
    const request = buildSaveRequest(pickDraft(useDraft.getState()), pricing);
    useDraft.setState({
      lastSaved: {
        publicId: 'saved123',
        versionNumber: 2,
        configurationHash: request?.hash ?? '',
      },
    });
  }
  let view!: ReturnType<typeof renderWithProviders>;
  await act(async () => {
    view = renderWithProviders(<LeadRequest target={target} />, {
      url: '/configurator/result',
      locale,
    });
  });
  await waitFor(() =>
    expect(screen.queryByText('Loading the request form')).toBeNull(),
  );
  return view;
}

const field = (name: string) => screen.getByLabelText(new RegExp(`^${name}`));

function fill(locale: Locale = 'en', phone = '+380501234567') {
  const t = text[locale];
  fireEvent.change(field(t.name), { target: { value: 'Olena' } });
  fireEvent.change(field(t.phone), { target: { value: phone } });
  fireEvent.click(screen.getByRole('checkbox'));
}

async function send(locale: Locale = 'en') {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: text[locale].submit }));
  });
}

const sentBody = (call = 0) => post.mock.calls[call][1].body;
const sentKey = (call = 0) =>
  post.mock.calls[call][1].params.header['Idempotency-Key'];

beforeEach(() => {
  vi.clearAllMocks();
  installMemoryStorage();
  resetWarmup();
  useWarmup.setState({ server: 'ready' });
  get.mockResolvedValue({
    data: makeLeadFormSettings(),
    response: { status: 200 },
  });
});

describe.each(['en', 'uk'] as const)('lead request (%s)', (locale) => {
  const t = text[locale];

  it('sends the draft of an unsaved result and confirms with a link', async () => {
    await renderLead(draftTarget, locale);
    post.mockResolvedValue(created(makeLeadCreated()));
    fill(locale);

    await send(locale);

    const body = sentBody();
    expect(body.draft).toEqual(
      expect.objectContaining({
        styleId: useDraft.getState().styleId,
        clientPricingVersion: pricing.version,
      }),
    );
    expect(body.calculation).toBeUndefined();
    expect(screen.getByText(t.confirmation)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.open })).toHaveAttribute(
      'href',
      `/${locale}/calculations/k3m9x2q7/v/3`,
    );
    expect(useDraft.getState().lastSaved).toEqual({
      publicId: 'k3m9x2q7',
      versionNumber: 3,
      configurationHash: expect.any(String),
    });
    expect(screen.queryByRole('button', { name: t.submit })).toBeNull();
  });

  it('sends the displayed consent text and the active locale', async () => {
    await renderLead(snapshotTarget, locale);
    post.mockResolvedValue(created(makeLeadCreated()));
    expect(screen.getByLabelText(t.consent)).toBeInTheDocument();
    fill(locale);

    await send(locale);

    expect(sentBody()).toEqual(
      expect.objectContaining({
        consent: { accepted: true, text: t.consent },
        locale,
        website: '',
        name: 'Olena',
        phone: '+380501234567',
      }),
    );
  });

  it('flags a bad phone and missing consent without sending', async () => {
    await renderLead(snapshotTarget, locale);
    fireEvent.change(field(t.name), { target: { value: 'Olena' } });
    fireEvent.change(field(t.phone), { target: { value: '0501234567' } });

    await send(locale);

    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText(t.phoneError)).toBeInTheDocument();
    expect(screen.getByText(t.consentError)).toBeInTheDocument();
    expect(field(t.name)).toHaveValue('Olena');
    expect(field(t.phone)).toHaveValue('0501234567');
    expect(field(t.phone)).toHaveFocus();
    fireEvent.change(field(t.phone), { target: { value: '+3805' } });
    expect(screen.queryByText(t.phoneError)).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = await renderLead(snapshotTarget, locale);
    await send(locale);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('lead request', () => {
  it('references the saved snapshot when the draft is unchanged', async () => {
    await renderLead(draftTarget, 'en', 'match');
    post.mockResolvedValue(created(makeLeadCreated()));
    fill();

    await send();

    expect(sentBody().calculation).toEqual({
      publicId: 'saved123',
      versionNumber: 2,
    });
    expect(sentBody().draft).toBeUndefined();
    expect(checkPricingData).toHaveBeenCalled();
  });

  it('shows the form again once the draft changes after sending', async () => {
    await renderLead(draftTarget);
    post.mockResolvedValue(created(makeLeadCreated()));
    fill();
    await send();
    expect(screen.getByText(text.en.confirmation)).toBeInTheDocument();

    act(() => {
      useDraft.getState().toggleOption('opt-new', true);
    });

    expect(screen.queryByText(text.en.confirmation)).toBeNull();
    expect(
      screen.getByRole('button', { name: text.en.submit }),
    ).toBeInTheDocument();
  });

  it('keeps the confirmation on a snapshot target when the draft changes', async () => {
    await renderLead(snapshotTarget);
    post.mockResolvedValue(created(makeLeadCreated()));
    fill();
    await send();

    act(() => {
      useDraft.getState().toggleOption('opt-new', true);
    });

    expect(screen.getByText(text.en.confirmation)).toBeInTheDocument();
  });

  it('references the snapshot on a snapshot target', async () => {
    await renderLead(snapshotTarget);
    post.mockResolvedValue(created(makeLeadCreated()));
    fill();

    await send();

    expect(sentBody().calculation).toEqual({
      publicId: 'k3m9x2q7',
      versionNumber: 3,
    });
    expect(sentBody().draft).toBeUndefined();
  });

  it('shows server field errors and keeps the values', async () => {
    await renderLead(snapshotTarget);
    post.mockResolvedValue(
      failure(400, 'VALIDATION_FAILED', {
        fields: [
          { path: 'name', code: 'too_long' },
          { path: 'consent.accepted', code: 'invalid' },
        ],
      }),
    );
    fill();

    await send();

    expect(screen.getByText(text.en.nameError)).toBeInTheDocument();
    expect(screen.getByText(text.en.consentError)).toBeInTheDocument();
    expect(field('Name')).toHaveValue('Olena');
    expect(field('Phone')).toHaveValue('+380501234567');
  });

  it('shows a generic failure when validation has no usable fields', async () => {
    await renderLead(snapshotTarget);
    post.mockResolvedValue(failure(400, 'VALIDATION_FAILED'));
    fill();

    await send();

    expect(screen.getByText(/Could not send the request/)).toBeInTheDocument();
    expect(captureException).toHaveBeenCalled();
  });

  it('shows the phone error on PHONE_INVALID and keeps the values', async () => {
    await renderLead(snapshotTarget);
    post.mockResolvedValue(failure(422, 'PHONE_INVALID'));
    fill();

    await send();

    expect(screen.getByText(text.en.phoneError)).toBeInTheDocument();
    expect(field('Phone')).toHaveValue('+380501234567');
    expect(field('Phone')).toHaveFocus();
  });

  it('sends one request with one key on a double click', async () => {
    await renderLead(snapshotTarget);
    let resolve!: (value: unknown) => void;
    post.mockReturnValue(new Promise((done) => (resolve = done)));
    fill();
    const button = screen.getByRole('button', { name: 'Send the request' });

    await act(async () => {
      fireEvent.click(button);
      fireEvent.click(button);
    });

    expect(post).toHaveBeenCalledTimes(1);
    await act(async () => resolve(created(makeLeadCreated())));
    expect(screen.getByText('Request No. 1042 sent')).toBeInTheDocument();
  });

  it('counts down on 429 and disables the button', async () => {
    await renderLead(snapshotTarget);
    post.mockResolvedValue(
      failure(429, 'RATE_LIMITED', { params: { retryAfterSeconds: 30 } }),
    );
    fill();

    await send();

    expect(
      screen.getByText(/You can send the request again in 30 seconds/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send the request' }),
    ).toBeDisabled();
  });

  it('shows the server notice above the form', async () => {
    await renderLead(snapshotTarget);
    expect(screen.getByText(makeLeadFormSettings().notice)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send the request' }),
    ).toBeEnabled();
  });

  it('renders no form when the settings fail and retries on demand', async () => {
    get.mockResolvedValueOnce(failure(500, 'INTERNAL'));
    await renderLead(snapshotTarget);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Send the request' }),
    ).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Try again|Retry/i }));
    });

    expect(
      await screen.findByRole('button', { name: 'Send the request' }),
    ).toBeInTheDocument();
  });

  it('resends the draft with a new key after the snapshot vanished', async () => {
    await renderLead(draftTarget, 'en', 'match');
    post
      .mockResolvedValueOnce(failure(404, 'CALCULATION_NOT_FOUND'))
      .mockResolvedValueOnce(created(makeLeadCreated()));
    fill();

    await send();

    expect(useDraft.getState().lastSaved).toBeNull();
    expect(
      screen.getByText(/will be saved anew when you send the request/),
    ).toBeInTheDocument();

    await send();

    expect(sentBody(0).calculation).toBeDefined();
    expect(sentBody(1).draft).toBeDefined();
    expect(sentBody(1).calculation).toBeUndefined();
    expect(sentKey(1)).not.toBe(sentKey(0));
  });

  it('shows a not found failure on a snapshot target', async () => {
    await renderLead(snapshotTarget);
    post.mockResolvedValue(failure(404, 'CALCULATION_NOT_FOUND'));
    fill();

    await send();

    expect(
      screen.getByText(/estimate for this request was not found/),
    ).toBeInTheDocument();
  });

  it('notes an expired estimate and a changed total', async () => {
    await renderLead(snapshotTarget);
    post.mockResolvedValue(
      created(
        makeLeadCreated({
          expiredAtSubmission: true,
          priceDifference: {
            clientTotalUsdCents: 100000,
            savedTotalUsdCents: 112500,
            diffCents: 12500,
          },
        }),
      ),
    );
    fill();

    await send();

    expect(screen.getByText(/already expired/)).toBeInTheDocument();
    expect(
      screen.getByText(/The total has increased by \$125/),
    ).toBeInTheDocument();
  });
});
