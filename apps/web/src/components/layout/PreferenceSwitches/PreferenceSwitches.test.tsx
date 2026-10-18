import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreferences } from '@/stores/preferences';
import { renderWithProviders } from '@/test/render-with-providers';
import { PreferenceSwitches } from './PreferenceSwitches';

const hydration = vi.hoisted(() => ({ hydrated: false }));
const navigation = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
  usePathname: () => '/configurator',
}));
vi.mock('@/stores/use-preferences-hydration', () => ({
  usePreferencesHydration: () => hydration.hydrated,
}));
vi.mock('@/stores/use-system-theme-watcher', () => ({
  useSystemThemeWatcher: () => {},
}));

describe('PreferenceSwitches', () => {
  beforeEach(() => {
    hydration.hydrated = false;
    navigation.replace.mockClear();
    window.history.replaceState(null, '', '/');
  });

  it('ignores currency and theme clicks and hides the stored values before hydration', () => {
    renderWithProviders(<PreferenceSwitches />);
    const currency = screen.getByRole('button', { name: 'Switch currency' });
    const theme = screen.getByRole('button', { name: 'Switch theme' });

    fireEvent.click(currency);
    fireEvent.click(theme);

    expect(usePreferences.getState().currency).toBe('USD');
    expect(usePreferences.getState().theme).toBe('light');
    expect(currency).toBeEmptyDOMElement();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('switches the language before hydration', () => {
    renderWithProviders(<PreferenceSwitches />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch language to Ukrainian' }),
    );

    expect(navigation.replace).toHaveBeenCalledWith('/configurator', {
      locale: 'uk',
    });
  });

  it('keeps the query string and hash when switching the language', () => {
    window.history.replaceState(null, '', '/configurator?id=1#x');
    renderWithProviders(<PreferenceSwitches />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch language to Ukrainian' }),
    );

    expect(navigation.replace).toHaveBeenCalledWith('/configurator?id=1#x', {
      locale: 'uk',
    });
  });

  it('applies clicks and names the next value after hydration', () => {
    hydration.hydrated = true;
    renderWithProviders(<PreferenceSwitches />);
    const currency = screen.getByRole('button', {
      name: 'Switch currency to UAH',
    });

    expect(currency).toHaveTextContent('$');
    expect(
      screen.getByRole('button', { name: 'Switch theme to dark' }),
    ).toBeInTheDocument();
    fireEvent.click(currency);

    expect(usePreferences.getState().currency).toBe('UAH');
  });

  it('exposes the buttons as plain actions, not toggles', () => {
    renderWithProviders(<PreferenceSwitches />);

    for (const button of screen.getAllByRole('button')) {
      expect(button).not.toHaveAttribute('aria-pressed');
    }
  });
});
