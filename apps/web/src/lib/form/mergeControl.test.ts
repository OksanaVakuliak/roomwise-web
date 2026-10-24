import { describe, expect, it } from 'vitest';
import { mergeControl } from './mergeControl';

describe('mergeControl', () => {
  it('does not emit undefined control keys', () => {
    const merged = mergeControl({ id: 'a' }, {});
    expect(merged).not.toHaveProperty('required');
    expect(merged).toEqual({
      id: 'a',
      'aria-busy': undefined,
      'aria-describedby': undefined,
      'aria-invalid': undefined,
    });
  });

  it('keeps a consumer aria-busy unless the control is busy', () => {
    expect(mergeControl({ id: 'a' }, { 'aria-busy': true })['aria-busy']).toBe(
      true,
    );
    expect(
      mergeControl({ id: 'a', 'aria-busy': true }, { 'aria-busy': false })[
        'aria-busy'
      ],
    ).toBe(true);
  });

  it('passes required and merges described-by ids', () => {
    const merged = mergeControl(
      { id: 'a', required: true, 'aria-describedby': 'h' },
      { 'aria-describedby': 'x h' },
    );
    expect(merged.required).toBe(true);
    expect(merged['aria-describedby']).toBe('x h');
  });
});
