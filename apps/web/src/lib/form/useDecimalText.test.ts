import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDecimalText } from './useDecimalText';

describe('useDecimalText', () => {
  it('starts from the value', () => {
    expect(renderHook(() => useDecimalText(4.2)).result.current[0]).toBe('4.2');
    expect(renderHook(() => useDecimalText(null)).result.current[0]).toBe('');
  });

  it('keeps an intermediate separator while the value matches', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDecimalText(value),
      { initialProps: { value: 3 as number | null } },
    );
    act(() => result.current[1]('3,'));
    rerender({ value: 3 });
    expect(result.current[0]).toBe('3,');
    act(() => result.current[1]('3.'));
    rerender({ value: 3 });
    expect(result.current[0]).toBe('3.');
  });

  it('keeps invalid text', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDecimalText(value),
      { initialProps: { value: 3 as number | null } },
    );
    act(() => result.current[1]('3x'));
    rerender({ value: 3 });
    expect(result.current[0]).toBe('3x');
  });

  it('re-syncs when the value changes externally', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDecimalText(value),
      { initialProps: { value: 3 as number | null } },
    );
    rerender({ value: 7.5 });
    expect(result.current[0]).toBe('7.5');
    rerender({ value: null });
    expect(result.current[0]).toBe('');
  });
});
