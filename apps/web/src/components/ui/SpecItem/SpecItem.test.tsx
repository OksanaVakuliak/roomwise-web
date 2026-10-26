import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { SpecItem, type SpecItemProps } from './SpecItem';

const props: SpecItemProps = {
  position: '1.1',
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
  it('renders position, name, brand, dimensions, fit, price and unit', () => {
    render(<SpecItem {...props} />);
    expect(screen.getByText('1.1')).toBeInTheDocument();
    expect(screen.getByText('Oak laminate')).toBeInTheDocument();
    expect(screen.getByText('Forest Co, Kronowerk')).toBeInTheDocument();
    expect(screen.getByText('1380 × 193 × 8')).toBeInTheDocument();
    expect(screen.getByText('not over cable')).toBeInTheDocument();
    expect(screen.getByText('$14.20')).toBeInTheDocument();
    expect(screen.getByText('per m²')).toBeInTheDocument();
  });

  it('is unselected by default without the picked badge', () => {
    render(<SpecItem {...props} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText('picked')).toBeNull();
  });

  it('shows the picked badge and pressed state when selected', () => {
    render(<SpecItem {...props} selected />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('picked')).toBeInTheDocument();
  });

  it('omits the fit note without a label', () => {
    render(<SpecItem {...props} fit={undefined} fitLabel={undefined} />);
    expect(screen.queryByText('not over cable')).toBeNull();
  });

  it('calls onSelect on click', () => {
    const onSelect = vi.fn();
    render(<SpecItem {...props} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
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

  it('shows a warning without blocking selection', () => {
    const onSelect = vi.fn();
    render(
      <SpecItem
        {...props}
        warning="not for heated floor"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText('not for heated floor')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeEnabled();
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('is disabled with a label when unavailable', () => {
    const onSelect = vi.fn();
    render(
      <SpecItem
        {...props}
        unavailable
        unavailableLabel="out of stock"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('out of stock')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('is enabled by default', () => {
    render(<SpecItem {...props} />);
    expect(screen.getByRole('button')).toBeEnabled();
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
