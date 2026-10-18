import { fireEvent, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EstimateStamp } from '@/components/ui';
import { axe } from '@/test/axe';
import {
  forEachLocale,
  renderWithProviders,
} from '@/test/render-with-providers';
import { forEachViewport, setViewport } from '@/test/viewports';
import { ZoneStub } from '../ZoneStub/ZoneStub';
import { StepLayout } from './StepLayout';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest} />
  ),
}));

const parts = [{ key: 'base', label: 'Base', value: '$1', share: 100 }];

function layout() {
  return (
    <StepLayout
      steps={<nav aria-label="Steps">steps</nav>}
      content={<h1>Title</h1>}
      scene={<ZoneStub kind="scene" />}
      detail={<p>detail</p>}
      showcase={<ZoneStub kind="showcase" />}
      cost={
        <EstimateStamp
          totalLabel="Total"
          total="$1"
          parts={parts}
          barLabel="Split"
          toggleLabel="Show breakdown"
          actions={<button type="button">Next</button>}
        />
      }
    />
  );
}

describe('StepLayout', () => {
  beforeEach(() => setViewport(390));

  it.each(forEachViewport)(
    'renders every zone in visual order at %i',
    (width) => {
      setViewport(width);
      const { container } = renderWithProviders(layout());
      const order = [
        'steps',
        'Title',
        '3D room view',
        'detail',
        'Specification showcase',
        'Total',
        'Next',
      ].map((text) => screen.getByText(text));
      order.forEach((node, index) => {
        const next = order[index + 1];
        if (next) {
          expect(
            node.compareDocumentPosition(next) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ).toBeTruthy();
        }
      });
      expect(container.querySelectorAll('h1')).toHaveLength(1);
    },
  );

  it('labels the scene, showcase and cost zones', () => {
    renderWithProviders(layout());
    for (const name of ['Room view', 'Specification', 'Estimate']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
  });

  it('expands the cost breakdown', () => {
    renderWithProviders(layout());
    const toggle = screen.getByRole('button', { name: 'Show breakdown' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it.each(forEachLocale)('has no axe violations in %s', async (locale) => {
    const { container } = renderWithProviders(layout(), { locale });
    expect(await axe(container)).toHaveNoViolations();
  });
});
