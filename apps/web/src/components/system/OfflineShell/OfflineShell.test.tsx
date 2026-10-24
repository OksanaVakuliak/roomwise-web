import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { OfflineShell } from './OfflineShell';

function visit(path: string, language = 'en-US', reload = vi.fn()) {
  vi.stubGlobal('location', { ...window.location, pathname: path, reload });
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(language);
  return reload;
}

afterEach(() => {
  document.cookie = 'NEXT_LOCALE=; max-age=0';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.documentElement.lang = '';
});

describe('OfflineShell', () => {
  it('says that calculation needs a connection', async () => {
    visit('/en/configurator');
    const { container } = render(<OfflineShell />);

    expect(
      await screen.findByRole('heading', { name: 'No internet connection' }),
    ).toBeVisible();
    expect(screen.getByText(/needs a connection to calculate/)).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes the language from the address', async () => {
    visit('/uk/configurator', 'en-US');
    render(<OfflineShell />);

    expect(
      await screen.findByRole('heading', { name: /Немає з'єднання/ }),
    ).toBeVisible();
    expect(document.documentElement.lang).toBe('uk');
    expect(document.title).toContain('Немає');
  });

  it('takes the language from the locale cookie when the address has none', async () => {
    document.cookie = 'NEXT_LOCALE=uk';
    visit('/', 'en-US');
    render(<OfflineShell />);

    expect(
      await screen.findByRole('heading', { name: /Немає з'єднання/ }),
    ).toBeVisible();
  });

  it('prefers the address over the cookie', async () => {
    document.cookie = 'NEXT_LOCALE=uk';
    visit('/en/configurator', 'uk-UA');
    render(<OfflineShell />);

    expect(
      await screen.findByRole('heading', { name: 'No internet connection' }),
    ).toBeVisible();
  });

  it('prefers the cookie over the browser language', async () => {
    document.cookie = 'NEXT_LOCALE=en';
    visit('/', 'uk-UA');
    render(<OfflineShell />);

    expect(
      await screen.findByRole('heading', { name: 'No internet connection' }),
    ).toBeVisible();
  });

  it('falls back to the browser language', async () => {
    visit('/', 'uk-UA');
    render(<OfflineShell />);

    expect(
      await screen.findByRole('heading', { name: /Немає з'єднання/ }),
    ).toBeVisible();
  });

  it('falls back to the default language', async () => {
    visit('/', 'de-DE');
    render(<OfflineShell />);

    expect(
      await screen.findByRole('heading', { name: 'No internet connection' }),
    ).toBeVisible();
    expect(document.documentElement.lang).toBe('en');
  });

  it('reloads on retry', async () => {
    const reload = visit('/en');
    render(<OfflineShell />);

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('shows no localized text before the language is known', () => {
    const html = renderToString(<OfflineShell />);
    expect(html).toContain('Roomwise');
    expect(html).not.toContain('No internet connection');
  });

  it('reloads when the connection returns', () => {
    const reload = visit('/en');
    const { unmount } = render(<OfflineShell />);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(reload).toHaveBeenCalledTimes(1);

    unmount();
    window.dispatchEvent(new Event('online'));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
