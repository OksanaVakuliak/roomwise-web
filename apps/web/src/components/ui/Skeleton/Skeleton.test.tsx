import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it.each(['line', 'block', 'circle'] as const)(
    'renders the %s variant hidden from assistive tech',
    (variant) => {
      const { container } = render(<Skeleton variant={variant} />);
      expect(container.firstElementChild).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    },
  );

  it('passes size props as css variables', () => {
    const { container } = render(<Skeleton width="60%" height="2rem" />);
    const node = container.firstElementChild as HTMLElement;
    expect(node.style.getPropertyValue('--skeleton-width')).toBe('60%');
    expect(node.style.getPropertyValue('--skeleton-height')).toBe('2rem');
  });

  it('sets no size variables by default', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).not.toHaveAttribute('style');
  });

  it('has no axe violations inside a busy container', async () => {
    const { container } = render(
      <div aria-busy="true">
        <Skeleton />
        <Skeleton variant="circle" />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
