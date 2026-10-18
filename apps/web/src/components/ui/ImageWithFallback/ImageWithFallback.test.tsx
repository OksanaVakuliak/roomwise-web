import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { ImageWithFallback } from './ImageWithFallback';

describe('ImageWithFallback', () => {
  it('renders the image with the item name as alt', () => {
    render(<ImageWithFallback src="/a.svg" name="Oak laminate" />);
    expect(screen.getByRole('img', { name: 'Oak laminate' })).toHaveAttribute(
      'src',
      '/a.svg',
    );
  });

  it('swaps to a placeholder with the name when the image fails', () => {
    render(<ImageWithFallback src="/missing.svg" name="Oak laminate" />);
    fireEvent.error(screen.getByRole('img'));
    expect(document.querySelector('img')).toBeNull();
    expect(
      screen.getByRole('img', { name: 'Oak laminate' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Oak laminate')).toBeInTheDocument();
  });

  it('shows the placeholder when src is missing', () => {
    render(<ImageWithFallback name="Oak laminate" />);
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('Oak laminate')).toBeInTheDocument();
  });

  it('tries the image again when src changes', () => {
    const { rerender } = render(<ImageWithFallback src="/a.svg" name="Item" />);
    fireEvent.error(screen.getByRole('img'));
    expect(document.querySelector('img')).toBeNull();
    rerender(<ImageWithFallback src="/b.svg" name="Item" />);
    expect(document.querySelector('img')).toHaveAttribute('src', '/b.svg');
  });

  it('does not fail an image on mount without an error event', () => {
    render(<ImageWithFallback src="/a.svg" name="Item" />);
    expect(document.querySelector('img')).toBeInTheDocument();
  });

  it('keeps the box ratio through a css variable', () => {
    const { container } = render(
      <ImageWithFallback name="Item" ratio="4 / 3" />,
    );
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue(
        '--image-ratio',
      ),
    ).toBe('4 / 3');
  });

  it('has no axe violations in both states', async () => {
    const { container } = render(
      <>
        <ImageWithFallback src="/a.svg" name="Image item" />
        <ImageWithFallback name="Placeholder item" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('re-evaluates an image that reports itself broken before hydration', () => {
    const complete = vi
      .spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(true);
    const width = vi
      .spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get')
      .mockReturnValue(0);
    const setSrc = vi.spyOn(HTMLImageElement.prototype, 'src', 'set');
    render(<ImageWithFallback src="/broken.svg" name="Oak laminate" />);
    expect(setSrc).toHaveBeenCalledTimes(2);
    expect(document.querySelector('img')).toBeInTheDocument();
    fireEvent.error(screen.getByRole('img'));
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByText('Oak laminate')).toBeInTheDocument();
    complete.mockRestore();
    width.mockRestore();
    setSrc.mockRestore();
  });
});
