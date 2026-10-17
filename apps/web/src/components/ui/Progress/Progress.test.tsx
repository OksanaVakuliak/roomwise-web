import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { Progress } from './Progress';

describe('Progress', () => {
  it('exposes determinate value and range', () => {
    render(<Progress label="Upload" value={30} max={120} />);
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '120');
  });

  it('sets the fill from the ratio of value to max', () => {
    render(<Progress label="Upload" value={30} max={120} />);
    const fill = screen.getByRole('progressbar').firstElementChild;
    expect((fill as HTMLElement).style.getPropertyValue('--progress')).toBe(
      '25%',
    );
  });

  it('clamps the value into the range', () => {
    render(<Progress label="Upload" value={500} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });

  it('is indeterminate without a value', () => {
    render(<Progress label="Loading" />);
    const bar = screen.getByRole('progressbar', { name: 'Loading' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).not.toHaveAttribute('aria-valuemax');
  });

  it('shows the caption and value text', () => {
    render(
      <Progress
        label="Step"
        value={2}
        max={5}
        valueText="2 of 5"
        caption="Rooms"
      />,
    );
    expect(screen.getByText('Rooms')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      '2 of 5',
    );
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <Progress label="Upload" value={40} />
        <Progress label="Loading" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
