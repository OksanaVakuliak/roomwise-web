import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { CutLayer, type CutLayerKind } from './CutLayer';

const kinds: CutLayerKind[] = ['problem', 'new', 'included'];

function layer(overrides: Partial<Parameters<typeof CutLayer>[0]> = {}) {
  return (
    <ul>
      <CutLayer
        kind="new"
        kindLabel="New layer"
        position="rest"
        material="glue"
        thickness={22}
        name="Glue, 2 mm"
        note="replaces the underlay"
        price="$31.80"
        {...overrides}
      />
    </ul>
  );
}

describe('CutLayer', () => {
  it.each(kinds)('exposes name, kind label and price for %s', (kind) => {
    render(layer({ kind, kindLabel: `Kind ${kind}` }));
    const item = screen.getByRole('listitem');
    expect(item).toHaveAttribute('data-kind', kind);
    expect(item).toHaveTextContent('Glue, 2 mm');
    expect(item).toHaveTextContent(`Kind ${kind}`);
    expect(item).toHaveTextContent('$31.80');
  });

  it('renders the hatch for its material', () => {
    const { container } = render(layer({ material: 'wood' }));
    expect(container.querySelector('svg[data-material="wood"]')).not.toBeNull();
  });

  it('applies the thickness as layer height', () => {
    render(layer({ thickness: 46 }));
    expect(screen.getByRole('listitem').style.getPropertyValue('--h')).toBe(
      '46px',
    );
  });

  it('differs between first and rest positions and between sizes', () => {
    const { rerender } = render(layer({ position: 'first' }));
    const first = screen.getByRole('listitem').className;
    rerender(layer({ position: 'rest' }));
    const rest = screen.getByRole('listitem').className;
    rerender(layer({ position: 'rest', size: 'desktop' }));
    const desktop = screen.getByRole('listitem').className;
    expect(new Set([first, rest, desktop]).size).toBe(3);
  });

  it('draws the revision cloud and mark only when given', () => {
    const { container, rerender } = render(layer({ kind: 'problem' }));
    expect(container.querySelector('path[vector-effect]')).not.toBeNull();
    expect(screen.queryByText('Revision 1')).toBeNull();
    rerender(
      layer({
        kind: 'problem',
        revision: { number: 1, label: 'Revision 1' },
        remarkId: 'remark-1',
      }),
    );
    expect(screen.getByText('Revision 1')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveAttribute(
      'aria-describedby',
      'remark-1',
    );
  });

  it('has no cloud for non-problem layers', () => {
    const { container } = render(layer({ kind: 'included' }));
    expect(container.querySelector('path[vector-effect]')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      layer({ kind: 'problem', revision: { number: 1, label: 'Revision 1' } }),
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
