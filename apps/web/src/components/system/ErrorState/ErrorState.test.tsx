import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import en from '../../../../messages/en.json';
import uk from '../../../../messages/uk.json';
import { ErrorState } from './ErrorState';

const catalogs = { en, uk };

function noop() {}

describe('ErrorState', () => {
  it.each(forEachLocale)('renders the %s texts as an alert', (locale) => {
    renderWithProviders(<ErrorState onRetry={noop} />, { locale });
    const texts = catalogs[locale].SystemStates;
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: texts.errorTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(texts.errorMessage)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: texts.retry }),
    ).toBeInTheDocument();
  });

  it('uses the title, message and heading level overrides', () => {
    renderWithProviders(
      <ErrorState
        onRetry={noop}
        title="Rooms failed"
        message="Could not load rooms."
        headingLevel={2}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Rooms failed' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Could not load rooms.')).toBeInTheDocument();
  });

  it('calls onRetry when the button is clicked', () => {
    const onRetry = vi.fn();
    renderWithProviders(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('is busy while the retry promise is pending', async () => {
    let finish: () => void = () => undefined;
    const onRetry = () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      });
    renderWithProviders(<ErrorState onRetry={onRetry} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    await act(async () => {
      finish();
    });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('becomes idle again when the retry rejects', async () => {
    let fail: () => void = () => undefined;
    const onRetry = () =>
      new Promise<void>((_, reject) => {
        fail = () => reject(new Error('still down'));
      });
    renderWithProviders(<ErrorState onRetry={onRetry} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    await act(async () => {
      fail();
    });
    expect(button).toBeEnabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<ErrorState onRetry={noop} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
