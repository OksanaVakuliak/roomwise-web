import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SpecItemSkeleton } from './SpecItemSkeleton';

describe('SpecItemSkeleton', () => {
  it('is hidden from assistive tech', () => {
    const { container } = render(<SpecItemSkeleton />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
