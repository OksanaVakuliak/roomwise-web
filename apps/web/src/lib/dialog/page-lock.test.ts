import { afterEach, describe, expect, it } from 'vitest';
import {
  inertElements,
  lockScroll,
  releaseElements,
  unlockScroll,
} from './page-lock';

afterEach(() => {
  document.body.replaceChildren();
  document.body.style.overflow = '';
});

describe('inertElements', () => {
  it('sets the inert attribute and releases it when the count returns to zero', () => {
    const element = document.createElement('div');
    document.body.append(element);

    const first = inertElements([element]);
    const second = inertElements([element]);
    expect(element).toHaveAttribute('inert');

    releaseElements(first);
    expect(element).toHaveAttribute('inert');
    releaseElements(second);
    expect(element).not.toHaveAttribute('inert');
  });

  it('skips elements that were already inert from elsewhere', () => {
    const element = document.createElement('div');
    element.setAttribute('inert', '');
    document.body.append(element);

    const locked = inertElements([element]);
    expect(locked).toEqual([]);
    releaseElements(locked);
    expect(element).toHaveAttribute('inert');
  });
});

describe('lockScroll', () => {
  it('restores the saved overflow only after the last unlock', () => {
    document.body.style.overflow = 'scroll';

    lockScroll();
    lockScroll();
    expect(document.body.style.overflow).toBe('hidden');

    unlockScroll();
    expect(document.body.style.overflow).toBe('hidden');
    unlockScroll();
    expect(document.body.style.overflow).toBe('scroll');
  });
});
