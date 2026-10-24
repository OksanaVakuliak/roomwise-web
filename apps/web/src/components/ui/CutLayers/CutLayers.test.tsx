import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { CutLayer } from '../CutLayer/CutLayer';
import { CutLayers } from './CutLayers';

describe('CutLayers', () => {
  it('is a labelled list of layers', async () => {
    const { container } = render(
      <CutLayers label="Floor layers">
        <CutLayer
          kind="new"
          kindLabel="New layer"
          position="first"
          material="glue"
          thickness={22}
          name="Glue"
          note="2 mm"
          price="$31.80"
        />
        <CutLayer
          kind="included"
          kindLabel="Included"
          position="rest"
          material="concrete"
          thickness={46}
          name="Slab"
          note="already there"
          price="0"
        />
      </CutLayers>,
    );
    const list = screen.getByRole('list', { name: 'Floor layers' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(await axe(container)).toHaveNoViolations();
  });
});
