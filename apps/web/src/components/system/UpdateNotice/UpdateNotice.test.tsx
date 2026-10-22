import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { UpdateNotice } from './UpdateNotice';

const PAGE_VERSION = 'build-1';

function workerAt(version: string) {
  return { scriptURL: `https://roomwise.app/serwist/sw.js?v=${version}` };
}

function stubServiceWorker(controller: object | null) {
  const target = Object.assign(new EventTarget(), { controller });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: target,
  });
  return (next: object | null = target.controller) => {
    target.controller = next;
    target.dispatchEvent(new Event('controllerchange'));
  };
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_APP_VERSION', PAGE_VERSION);
});

afterEach(() => {
  Reflect.deleteProperty(navigator, 'serviceWorker');
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('UpdateNotice', () => {
  it('renders nothing before an update', () => {
    stubServiceWorker(workerAt(PAGE_VERSION));
    const { container } = renderWithProviders(<UpdateNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('announces a worker from a different build', async () => {
    const change = stubServiceWorker(workerAt(PAGE_VERSION));
    const { container } = renderWithProviders(<UpdateNotice />);

    act(() => change(workerAt('build-2')));

    expect(
      await screen.findByText('A new version is available.'),
    ).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is translated', async () => {
    const change = stubServiceWorker(workerAt(PAGE_VERSION));
    renderWithProviders(<UpdateNotice />, { locale: 'uk' });
    act(() => change(workerAt('build-2')));
    expect(await screen.findByText('Доступна нова версія.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Оновити' })).toBeVisible();
  });

  it('stays quiet when the worker matches the page', () => {
    const change = stubServiceWorker(workerAt(PAGE_VERSION));
    const { container } = renderWithProviders(<UpdateNotice />);
    act(() => change());
    expect(container).toBeEmptyDOMElement();
  });

  it('stays quiet on the first install of the same build', () => {
    const change = stubServiceWorker(null);
    const { container } = renderWithProviders(<UpdateNotice />);
    act(() => change(workerAt(PAGE_VERSION)));
    expect(container).toBeEmptyDOMElement();
  });

  it('stays quiet when the worker carries no version', () => {
    const change = stubServiceWorker(null);
    const { container } = renderWithProviders(<UpdateNotice />);
    act(() => change({ scriptURL: 'https://roomwise.app/serwist/sw.js' }));
    expect(container).toBeEmptyDOMElement();
  });

  it('does nothing without service worker support', () => {
    const { container } = renderWithProviders(<UpdateNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('reloads the page from the action', async () => {
    const change = stubServiceWorker(workerAt(PAGE_VERSION));
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    renderWithProviders(<UpdateNotice />);
    act(() => change(workerAt('build-2')));

    fireEvent.click(await screen.findByRole('button', { name: 'Reload' }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('can be dismissed', async () => {
    const change = stubServiceWorker(workerAt(PAGE_VERSION));
    const { container } = renderWithProviders(<UpdateNotice />);
    act(() => change(workerAt('build-2')));

    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));

    expect(container).toBeEmptyDOMElement();
  });
});
