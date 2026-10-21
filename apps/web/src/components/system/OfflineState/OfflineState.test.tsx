import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { OfflineState } from './OfflineState';

const catalogs = { en, uk };

function noop() {}

describe('OfflineState', () => {
  it.each(forEachLocale)('renders the %s texts', (locale) => {
    renderWithProviders(<OfflineState onRetry={noop} />, {
      locale,
    });
    const texts = catalogs[locale].SystemStates;
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: texts.offlineTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(texts.offlineMessage)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: texts.retry }),
    ).toBeInTheDocument();
  });

  it('differs from the error texts', () => {
    expect(en.SystemStates.offlineTitle).not.toBe(en.SystemStates.errorTitle);
    expect(uk.SystemStates.offlineTitle).not.toBe(uk.SystemStates.errorTitle);
  });

  it('calls onRetry when the button is clicked', () => {
    const onRetry = vi.fn();
    renderWithProviders(<OfflineState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('is busy while the retry promise is pending', async () => {
    let finish: () => void = () => undefined;
    const onRetry = () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      });
    renderWithProviders(<OfflineState onRetry={onRetry} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await act(async () => {
      finish();
    });
    expect(button).toBeEnabled();
  });

  it('retries once when the connection returns', () => {
    const onRetry = vi.fn();
    renderWithProviders(<OfflineState onRetry={onRetry} />);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('removes the listener on unmount', () => {
    const onRetry = vi.fn();
    const { unmount } = renderWithProviders(<OfflineState onRetry={onRetry} />);
    unmount();
    window.dispatchEvent(new Event('online'));
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<OfflineState onRetry={noop} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
