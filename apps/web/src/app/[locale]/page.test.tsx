import { act, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import messages from '../../../messages/en.json';
import HomePage from './page';

vi.mock('next-intl/server', () => ({ setRequestLocale: vi.fn() }));

const params = Promise.resolve({ locale: 'en' });

async function renderPage() {
  let result!: ReturnType<typeof render>;

  await act(async () => {
    result = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Suspense>
          <HomePage params={params} />
        </Suspense>
      </NextIntlClientProvider>,
    );
  });

  return result;
}

describe('HomePage', () => {
  it('renders the Roomwise heading', async () => {
    await renderPage();

    expect(screen.getByText('Roomwise')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = await renderPage();

    expect(await axe(container)).toHaveNoViolations();
  });
});
