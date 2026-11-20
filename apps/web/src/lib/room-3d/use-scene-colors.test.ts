import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSceneColors, useSceneColors } from './use-scene-colors';

const DEFAULT_TOKENS: Record<string, string> = {
  '--paper': ' #111111 ',
  '--paint': '#222222',
  '--line': '#333333',
};

const tokens: Record<string, string> = { ...DEFAULT_TOKENS };

function stubTokens() {
  return vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (name: string) => tokens[name] ?? '',
  } as unknown as CSSStyleDeclaration);
}

afterEach(() => {
  Object.assign(tokens, DEFAULT_TOKENS);
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-theme');
});

describe('readSceneColors', () => {
  it('maps the design tokens to scene colours', () => {
    stubTokens();

    expect(readSceneColors(document.createElement('div'))).toEqual({
      background: '#111111',
      neutral: '#222222',
      edge: '#333333',
    });
  });
});

describe('useSceneColors', () => {
  it('reads the colours once the element is available', () => {
    stubTokens();
    const element = document.createElement('div');

    const { result } = renderHook(() => useSceneColors(element));

    expect(result.current?.background).toBe('#111111');
  });

  it('reads the colours when the element mounts after enabling', () => {
    stubTokens();

    const { result, rerender } = renderHook(
      ({ element }: { element: HTMLElement | null }) => useSceneColors(element),
      { initialProps: { element: null as HTMLElement | null } },
    );
    expect(result.current).toBeNull();

    rerender({ element: document.createElement('div') });

    expect(result.current?.background).toBe('#111111');
  });

  it('keeps the same object when the theme change leaves colours unchanged', async () => {
    const spy = stubTokens();
    const element = document.createElement('div');
    const { result } = renderHook(() => useSceneColors(element));
    const first = result.current;
    spy.mockClear();

    act(() => document.documentElement.setAttribute('data-theme', 'dark'));

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(result.current).toBe(first);
  });

  it('stays empty while disabled', () => {
    stubTokens();
    const element = document.createElement('div');

    const { result } = renderHook(() => useSceneColors(element, false));

    expect(result.current).toBeNull();
  });

  it('re-reads the colours when the theme changes', async () => {
    stubTokens();
    const element = document.createElement('div');
    const { result } = renderHook(() => useSceneColors(element));
    tokens['--paper'] = '#999999';

    act(() => document.documentElement.setAttribute('data-theme', 'dark'));

    await waitFor(() => expect(result.current?.background).toBe('#999999'));
  });
});
