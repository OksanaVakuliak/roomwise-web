import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { Gallery, type GalleryProps } from './Gallery';

const props: GalleryProps = {
  label: 'Oak laminate photos',
  images: [
    { src: '/a.jpg', name: 'Front view' },
    { src: '/b.jpg', name: 'Side view' },
    { src: null, name: 'Close-up' },
  ],
  thumbnailLabel: (index, total) => `image ${index} of ${total}`,
};

function thumbs() {
  return screen.getAllByRole('button');
}

describe('Gallery', () => {
  it('shows the first image large by default', () => {
    render(<Gallery {...props} />);
    expect(screen.getAllByAltText('Front view')).toHaveLength(2);
    expect(screen.getAllByAltText('Side view')).toHaveLength(1);
  });

  it('labels the group and thumbnails', () => {
    render(<Gallery {...props} />);
    expect(
      screen.getByRole('group', { name: 'Oak laminate photos' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'image 2 of 3' }),
    ).toBeInTheDocument();
  });

  it('marks the active thumbnail and keeps one tab stop', () => {
    render(<Gallery {...props} />);
    expect(thumbs()[0]).toHaveAttribute('aria-current', 'true');
    expect(thumbs()[1]).not.toHaveAttribute('aria-current');
    expect(thumbs().map((button) => button.tabIndex)).toEqual([0, -1, -1]);
  });

  it('switches the main image on click', () => {
    render(<Gallery {...props} />);
    fireEvent.click(thumbs()[1]);
    expect(thumbs()[1]).toHaveAttribute('aria-current', 'true');
    expect(screen.getAllByAltText('Side view')).toHaveLength(2);
  });

  it('moves with arrow keys, wrapping around, and focuses the thumbnail', () => {
    render(<Gallery {...props} />);
    thumbs()[0].focus();
    fireEvent.keyDown(thumbs()[0], { key: 'ArrowRight' });
    expect(thumbs()[1]).toHaveFocus();
    expect(thumbs()[1]).toHaveAttribute('aria-current', 'true');
    fireEvent.keyDown(thumbs()[1], { key: 'ArrowLeft' });
    fireEvent.keyDown(thumbs()[0], { key: 'ArrowLeft' });
    expect(thumbs()[2]).toHaveFocus();
    fireEvent.keyDown(thumbs()[2], { key: 'ArrowRight' });
    expect(thumbs()[0]).toHaveFocus();
  });

  it('jumps with Home and End', () => {
    render(<Gallery {...props} />);
    thumbs()[0].focus();
    fireEvent.keyDown(thumbs()[0], { key: 'End' });
    expect(thumbs()[2]).toHaveFocus();
    fireEvent.keyDown(thumbs()[2], { key: 'Home' });
    expect(thumbs()[0]).toHaveFocus();
  });

  it('starts at defaultIndex', () => {
    render(<Gallery {...props} defaultIndex={1} />);
    expect(thumbs()[1]).toHaveAttribute('aria-current', 'true');
  });

  it('hides thumbnails for a single image', () => {
    render(<Gallery {...props} images={[props.images[0]]} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('renders nothing without images', () => {
    const { container } = render(<Gallery {...props} images={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Gallery {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
