import { fireEvent, screen } from '@testing-library/react';
import { useCallback, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { Stepper } from './Stepper';

const labels = { decrementLabel: 'Decrease', incrementLabel: 'Increase' };

function Controlled({
  onValueChange,
}: {
  onValueChange?: (value: number) => void;
}) {
  const [value, setValue] = useState(2);

  const handleValueChange = useCallback(
    (next: number) => {
      setValue(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );

  return (
    <Stepper
      label="Rooms"
      {...labels}
      min={1}
      max={3}
      value={value}
      onValueChange={handleValueChange}
    />
  );
}

describe('Stepper', () => {
  it('steps an uncontrolled value', () => {
    renderWithProviders(
      <Stepper label="Rooms" {...labels} defaultValue={2} step={0.5} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(screen.getByLabelText('Rooms')).toHaveValue(2.5);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }));
    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(screen.getByLabelText('Rooms')).toHaveValue(1.5);
  });

  it('marks the buttons aria-disabled at the bounds', () => {
    const onValueChange = vi.fn();
    renderWithProviders(<Controlled onValueChange={onValueChange} />);
    const minus = screen.getByRole('button', { name: 'Decrease' });
    const plus = screen.getByRole('button', { name: 'Increase' });
    fireEvent.click(plus);
    expect(plus).toHaveAttribute('aria-disabled', 'true');
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    fireEvent.click(minus);
    fireEvent.click(minus);
    expect(minus).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByLabelText('Rooms')).toHaveValue(1);
  });

  it('clamps a typed value on blur', () => {
    renderWithProviders(
      <Stepper label="Rooms" {...labels} min={1} max={5} defaultValue={2} />,
    );
    const input = screen.getByLabelText('Rooms');
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.blur(input);
    expect(input).toHaveValue(5);
  });

  it('describes the control and flags errors', () => {
    renderWithProviders(
      <Stepper
        label="Rooms"
        {...labels}
        unit="pcs"
        hint="Up to five"
        error="Too many"
      />,
    );
    const input = screen.getByLabelText('Rooms');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Up to five Too many pcs');
  });

  it('locks everything while loading or disabled', () => {
    const { rerender } = renderWithProviders(
      <Stepper label="Rooms" {...labels} loading />,
    );
    expect(screen.getByLabelText('Rooms')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
    rerender(<Stepper label="Rooms" {...labels} disabled />);
    expect(screen.getByLabelText('Rooms')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <>
        <Stepper label="Rooms" {...labels} hint="Hint" unit="pcs" />
        <Stepper label="Floors" {...labels} error="Invalid" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps focus on the button that reaches the minimum', () => {
    renderWithProviders(
      <Stepper label="Rooms" {...labels} defaultValue={2} min={1} />,
    );
    const decrease = screen.getByRole('button', { name: 'Decrease' });
    decrease.focus();
    fireEvent.click(decrease);
    expect(decrease).toHaveFocus();
    expect(decrease).toHaveAttribute('aria-disabled', 'true');
    expect(decrease).not.toBeDisabled();
    fireEvent.click(decrease);
    expect(screen.getByLabelText('Rooms')).toHaveValue(1);
  });
});
