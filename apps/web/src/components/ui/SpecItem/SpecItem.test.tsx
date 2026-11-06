import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { SpecItem, type SpecItemProps } from './SpecItem';

const props: SpecItemProps = {
  image: <svg role="presentation" />,
  name: 'Oak laminate',
  brand: 'Forest Co, Kronowerk',
  dimensions: '1380 × 193 × 8',
  fit: 'no',
  fitLabel: 'not over cable',
  pickedLabel: 'picked',
  price: '$14.20',
  unit: 'per m²',
};

describe('SpecItem', () => {
  it('renders name, brand, dimensions, fit, price and unit', () => {
    render(<SpecItem {...props} />);
    expect(screen.getByText('Oak laminate')).toBeInTheDocument();
    expect(screen.getByText('Forest Co, Kronowerk')).toBeInTheDocument();
    expect(screen.getByText('1380 × 193 × 8')).toBeInTheDocument();
    expect(screen.getByText('not over cable')).toBeInTheDocument();
    expect(screen.getByText('$14.20')).toBeInTheDocument();
    expect(screen.getByText('per m²')).toBeInTheDocument();
  });

  it('is not interactive by itself', () => {
    render(<SpecItem {...props} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('picked')).toBeNull();
  });

  it('shows the picked badge when selected', () => {
    render(<SpecItem {...props} selected />);
    expect(screen.getByText('picked')).toBeInTheDocument();
    const column = screen.getByText('picked').closest('div');
    expect(column).toContainElement(
      screen.getByRole('presentation', { hidden: true }),
    );
    expect(column).not.toContainElement(screen.getByText('Oak laminate'));
  });

  it('omits the fit note without a label', () => {
    render(<SpecItem {...props} fit={undefined} fitLabel={undefined} />);
    expect(screen.queryByText('not over cable')).toBeNull();
  });

  it('renders the given actions', () => {
    const onChoose = vi.fn();
    render(
      <SpecItem
        {...props}
        actions={
          <button type="button" onClick={onChoose}>
            Choose
          </button>
        }
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Choose' }));
    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('renders color after dimensions and alone', () => {
    const { rerender } = render(<SpecItem {...props} color="honey oak" />);
    expect(screen.getByText('1380 × 193 × 8, honey oak')).toBeInTheDocument();
    rerender(<SpecItem {...props} dimensions={undefined} color="honey oak" />);
    expect(screen.getByText('honey oak')).toBeInTheDocument();
  });

  it('shows the cost for the room only when given', () => {
    const { rerender } = render(
      <SpecItem {...props} roomCostLabel="for the room" />,
    );
    expect(screen.queryByText('for the room')).toBeNull();
    rerender(
      <SpecItem {...props} roomCost="$85.20" roomCostLabel="for the room" />,
    );
    expect(screen.getByText('$85.20')).toBeInTheDocument();
    expect(screen.getByText('for the room')).toBeInTheDocument();
  });

  it('shows a warning', () => {
    render(<SpecItem {...props} warning="not for heated floor" />);
    expect(screen.getByText('not for heated floor')).toBeInTheDocument();
  });

  it('shows the unavailable label', () => {
    render(<SpecItem {...props} unavailable unavailableLabel="out of stock" />);
    expect(screen.getByText('out of stock')).toBeInTheDocument();
  });

  it('has no axe violations with every extra shown', async () => {
    const { container } = render(
      <SpecItem
        {...props}
        color="honey oak"
        warning="not for heated floor"
        roomCost="$85.20"
        roomCostLabel="for the room"
        unavailable
        unavailableLabel="out of stock"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(['no', 'ok'] as const)(
    'has no axe violations for fit=%s',
    async (fit) => {
      const { container } = render(
        <SpecItem {...props} fit={fit} selected size="desktop" />,
      );
      expect(await axe(container)).toHaveNoViolations();
    },
  );
});
