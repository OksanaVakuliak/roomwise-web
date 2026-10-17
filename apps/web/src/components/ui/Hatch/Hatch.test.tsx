import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { Hatch, type HatchMaterial } from './Hatch';

const patterned: HatchMaterial[] = ['wood', 'glue', 'screed', 'concrete'];
const materials: HatchMaterial[] = [...patterned, 'cable'];

describe('Hatch', () => {
  it.each(materials)('renders %s as a decorative svg', (material) => {
    const { container } = render(<Hatch material={material} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('data-material', material);
  });

  it.each(patterned)('fills %s with its own pattern', (material) => {
    const { container } = render(<Hatch material={material} />);
    const id = container.querySelector('pattern')?.id;
    expect(id).toBeTruthy();
    expect(container.querySelector('rect:last-child')).toHaveAttribute(
      'fill',
      `url(#${id})`,
    );
  });

  it('draws cable as circles without a pattern', () => {
    const { container } = render(<Hatch material="cable" />);
    expect(container.querySelector('pattern')).toBeNull();
    expect(container.querySelectorAll('circle')).toHaveLength(7);
  });

  it('gives each instance a unique pattern id', () => {
    const { container } = render(
      <>
        <Hatch material="wood" />
        <Hatch material="wood" />
      </>,
    );
    const ids = [...container.querySelectorAll('pattern')].map((p) => p.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Hatch material="wood" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
