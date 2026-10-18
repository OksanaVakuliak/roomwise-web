import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreferences } from '@/stores/preferences';
import { renderWithProviders } from '@/test/render-with-providers';
import { PreferenceSwitches } from './PreferenceSwitches';

const hydration = vi.hoisted(() => ({ hydrated: false }));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}));
vi.mock('@/stores/use-preferences-hydration', () => ({
  usePreferencesHydration: () => hydration.hydrated,
}));

describe('PreferenceSwitches', () => {
  beforeEach(() => {
    hydration.hydrated = false;
  });

  it('ignores clicks and hides the stored values before hydration', () => {
    renderWithProviders(<PreferenceSwitches />);
    const currency = screen.getByRole('button', {
      name: 'Switch currency to UAH',
    });

    fireEvent.click(currency);

    expect(usePreferences.getState().currency).toBe('USD');
    expect(currency).toBeEmptyDOMElement();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('applies clicks and shows the stored values after hydration', () => {
    hydration.hydrated = true;
    renderWithProviders(<PreferenceSwitches />);
    const currency = screen.getByRole('button', {
      name: 'Switch currency to UAH',
    });

    expect(currency).toHaveTextContent('$');
    fireEvent.click(currency);

    expect(usePreferences.getState().currency).toBe('UAH');
  });
});
