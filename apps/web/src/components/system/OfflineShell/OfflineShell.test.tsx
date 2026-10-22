import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { OfflineShell } from './OfflineShell';

function visit(path: string, language = 'en-US', reload = vi.fn()) {
  vi.stubGlobal('location', { ...window.location, pathname: path, reload });
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(language);
  return reload;
}

afterEach(() => {
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

  it('falls back to the browser language', async () => {
    visit('/', 'uk-UA');
    render(<OfflineShell />);

    expect(
      await screen.findByRole('heading', { name: /Немає з'єднання/ }),
    ).toBeVisible();
  });

  it('falls back to the default language', () => {
    visit('/', 'de-DE');
    render(<OfflineShell />);

    expect(
      screen.getByRole('heading', { name: 'No internet connection' }),
    ).toBeVisible();
    expect(document.documentElement.lang).toBe('en');
  });

  it('reloads on retry', () => {
    const reload = visit('/en');
    render(<OfflineShell />);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
