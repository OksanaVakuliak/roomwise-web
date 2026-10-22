import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { UpdateNotice } from './UpdateNotice';

function stubServiceWorker(controller: object | null) {
  const target = new EventTarget();
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: Object.assign(target, { controller }),
  });
  return () => {
    target.dispatchEvent(new Event('controllerchange'));
  };
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'serviceWorker');
  vi.unstubAllGlobals();
});

describe('UpdateNotice', () => {
  it('renders nothing before an update', () => {
    stubServiceWorker({});
    const { container } = renderWithProviders(<UpdateNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces a new version after the controller changes', async () => {
    const change = stubServiceWorker({});
    const { container } = renderWithProviders(<UpdateNotice />);

    act(change);

    expect(
      await screen.findByText('A new version is available.'),
    ).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is translated', async () => {
    const change = stubServiceWorker({});
    renderWithProviders(<UpdateNotice />, { locale: 'uk' });
    act(change);
    expect(await screen.findByText('Доступна нова версія.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Оновити' })).toBeVisible();
  });

  it('stays quiet on the first install', () => {
    const change = stubServiceWorker(null);
    const { container } = renderWithProviders(<UpdateNotice />);
    act(change);
    expect(container).toBeEmptyDOMElement();
  });

  it('does nothing without service worker support', () => {
    const { container } = renderWithProviders(<UpdateNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('reloads the page from the action', async () => {
    const change = stubServiceWorker({});
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    renderWithProviders(<UpdateNotice />);
    act(change);

    fireEvent.click(await screen.findByRole('button', { name: 'Reload' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('can be dismissed', async () => {
    const change = stubServiceWorker({});
    const { container } = renderWithProviders(<UpdateNotice />);
    act(change);

    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));

    expect(container).toBeEmptyDOMElement();
  });
});
