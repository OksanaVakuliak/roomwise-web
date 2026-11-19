import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSceneColors, useSceneColors } from './use-scene-colors';

const tokens: Record<string, string> = {
  '--paper': ' #111111 ',
  '--paint': '#222222',
  '--line': '#333333',
};

function stubTokens() {
  return vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (name: string) => tokens[name] ?? '',
  } as unknown as CSSStyleDeclaration);
}

afterEach(() => {
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
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() => useSceneColors(ref));

    expect(result.current?.background).toBe('#111111');
  });

  it('stays empty while disabled', () => {
    stubTokens();
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() => useSceneColors(ref, false));

    expect(result.current).toBeNull();
  });

  it('re-reads the colours when the theme changes', async () => {
    stubTokens();
    const ref = { current: document.createElement('div') };
    const { result } = renderHook(() => useSceneColors(ref));
    tokens['--paper'] = '#999999';

    act(() => document.documentElement.setAttribute('data-theme', 'dark'));

    await waitFor(() => expect(result.current?.background).toBe('#999999'));
    tokens['--paper'] = ' #111111 ';
  });
});
