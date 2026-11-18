import { act, fireEvent, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('keeps only the content and the cost zone in a single column', () => {
    renderWithProviders(
      <StepLayout
        single
        steps={<nav aria-label="Steps">steps</nav>}
        content={<h1>Title</h1>}
        scene={<ZoneStub kind="scene" />}
        showcase={<ZoneStub kind="showcase" />}
        cost={<button type="button">Back</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Estimate' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Room view' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Specification' }),
    ).not.toBeInTheDocument();
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

  describe('pinned aside', () => {
    const heights = { Specification: 0, Estimate: 0 };
    const observers: ResizeObserverCallback[] = [];

    beforeEach(() => {
      observers.length = 0;
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(callback: ResizeObserverCallback) {
            observers.push(callback);
          }
          observe() {}
          unobserve() {}
          disconnect() {}
        },
      );
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
          const label = this.getAttribute('aria-label') as
            | keyof typeof heights
            | null;
          return label && label in heights ? heights[label] : 0;
        },
      );
      window.innerHeight = 800;
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    function aside() {
      return screen.getByRole('region', { name: 'Estimate' }).parentElement;
    }

    it('pins the aside on desktop when the showcase and cost fit the viewport', () => {
      setViewport(1024);
      heights.Specification = 300;
      heights.Estimate = 200;
      renderWithProviders(layout());
      expect(aside()).toHaveAttribute('data-pinned');
    });

    it('does not pin the aside when the showcase is taller than the viewport', () => {
      setViewport(1024);
      heights.Specification = 700;
      heights.Estimate = 200;
      renderWithProviders(layout());
      expect(aside()).not.toHaveAttribute('data-pinned');
    });

    it('does not pin the aside below the desktop breakpoint', () => {
      setViewport(390);
      heights.Specification = 100;
      heights.Estimate = 100;
      renderWithProviders(layout());
      expect(aside()).not.toHaveAttribute('data-pinned');
    });

    it('re-measures when the content resizes and when the window resizes', () => {
      setViewport(1024);
      heights.Specification = 300;
      heights.Estimate = 200;
      renderWithProviders(layout());
      expect(aside()).toHaveAttribute('data-pinned');

      heights.Specification = 700;
      act(() => {
        observers.forEach((callback) => callback([], {} as ResizeObserver));
      });
      expect(aside()).not.toHaveAttribute('data-pinned');

      window.innerHeight = 1200;
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      expect(aside()).toHaveAttribute('data-pinned');
    });
  });
});
