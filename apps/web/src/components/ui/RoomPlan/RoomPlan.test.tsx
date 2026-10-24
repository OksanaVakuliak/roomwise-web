import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { RoomPlan } from './RoomPlan';

const props = {
  name: 'Bedroom',
  details: '4.2 × 3.6',
  lengthCm: 420,
  widthCm: 360,
};

describe('RoomPlan', () => {
  it('renders a button with the name and details', () => {
    renderWithProviders(<RoomPlan {...props} />);
    const button = screen.getByRole('button', { name: /Bedroom/ });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveTextContent('4.2 × 3.6');
  });

  it('is not marked current by default', () => {
    renderWithProviders(<RoomPlan {...props} />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
  });

  it('marks the current plan with aria-current', () => {
    renderWithProviders(<RoomPlan {...props} state="current" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true');
  });

  it('derives the sketch proportions from the room dimensions', () => {
    const { container } = renderWithProviders(<RoomPlan {...props} />);
    const sketch = container.querySelector('button > span');
    expect(sketch).toHaveAttribute('aria-hidden', 'true');
    expect(sketch).toHaveStyle({
      '--room-length': '4.2',
      '--room-width': '3.6',
    });
  });

  it.each(['mobile', 'desktop'] as const)('applies the %s size', (size) => {
    renderWithProviders(<RoomPlan {...props} size={size} />);
    expect(screen.getByRole('button').className).toMatch(new RegExp(size));
  });

  it('forwards click handlers', () => {
    const onClick = vi.fn();
    renderWithProviders(<RoomPlan {...props} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <RoomPlan {...props} state="current" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
