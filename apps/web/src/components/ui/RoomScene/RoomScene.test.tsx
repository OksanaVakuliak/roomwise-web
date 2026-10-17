import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { RoomScene } from './RoomScene';

const props = {
  lengthCm: 420,
  widthCm: 360,
  heightCm: 270,
  lengthLabel: '4.2 m',
  widthLabel: '3.6 m',
  heightLabel: '2.7 m',
  cutLabel: 'A',
  description: 'Bedroom 4.2 by 3.6 m, height 2.7 m, section line A–A',
};

describe('RoomScene', () => {
  it('exposes one image whose text alternative lists all dimensions', () => {
    renderWithProviders(<RoomScene {...props} />);
    const scene = screen.getByRole('img', { name: props.description });
    expect(scene).toHaveAccessibleName(/4\.2/);
    expect(scene).toHaveAccessibleName(/3\.6/);
    expect(scene).toHaveAccessibleName(/2\.7/);
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('shows the dimension values and both section marks', () => {
    const { container } = renderWithProviders(<RoomScene {...props} />);
    expect(screen.getByText('4.2 m')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('3.6 m')).toBeInTheDocument();
    expect(screen.getByText('2.7 m')).toBeInTheDocument();
    expect(screen.getAllByText('A')).toHaveLength(2);
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('reproduces the design box for the sample room', () => {
    const { container } = renderWithProviders(<RoomScene {...props} />);
    const polygons = container.querySelectorAll('polygon');
    expect(polygons[0]).toHaveAttribute(
      'points',
      '0,0 94.6,54.6 13.5,101.4 -81.1,46.8',
    );
  });

  it('derives the geometry from the room dimensions', () => {
    const small = renderWithProviders(<RoomScene {...props} />);
    const smallBox = small.container
      .querySelector('svg')
      ?.getAttribute('viewBox');
    small.unmount();
    const large = renderWithProviders(
      <RoomScene {...props} lengthCm={900} widthCm={300} heightCm={300} />,
    );
    const largeBox = large.container
      .querySelector('svg')
      ?.getAttribute('viewBox');
    expect(largeBox).not.toBe(smallBox);
  });

  it.each(['mobile', 'desktop'] as const)('applies the %s size', (size) => {
    const { container } = renderWithProviders(
      <RoomScene {...props} size={size} />,
    );
    expect((container.firstChild as HTMLElement).className).toMatch(
      new RegExp(size),
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<RoomScene {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
