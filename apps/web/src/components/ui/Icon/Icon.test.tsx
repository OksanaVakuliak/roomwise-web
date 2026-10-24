import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { IconName } from './Icon';
import { Icon } from './Icon';
import { icons } from './icons';

const names = Object.keys(icons) as IconName[];

describe('Icon', () => {
  it('is hidden from assistive tech without a label', () => {
    const { container } = render(<Icon name="check" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).not.toHaveAttribute('role');
  });

  it('exposes an image role with the label', () => {
    render(<Icon name="check" label="Done" />);
    const svg = screen.getByRole('img', { name: 'Done' });
    expect(svg).not.toHaveAttribute('aria-hidden');
  });

  it.each(names)('renders an svg for %s', (name) => {
    const { container } = render(<Icon name={name} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('applies size and custom classes', () => {
    const { container, rerender } = render(<Icon name="plus" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toMatch(/md/);
    rerender(<Icon name="plus" size="lg" className="extra" />);
    expect(svg?.getAttribute('class')).toMatch(/lg/);
    expect(svg).toHaveClass('extra');
  });

  it('uses currentColor for stroke and fill', () => {
    const { container, rerender } = render(<Icon name="moon" />);
    expect(container.querySelector('svg')).toHaveAttribute(
      'stroke',
      'currentColor',
    );
    rerender(<Icon name="stepPointer" />);
    expect(container.querySelector('svg')).toHaveAttribute(
      'fill',
      'currentColor',
    );
  });
});
