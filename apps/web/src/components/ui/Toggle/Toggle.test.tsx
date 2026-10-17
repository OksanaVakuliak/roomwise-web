import { fireEvent, screen } from '@testing-library/react';
import { useId } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { Toggle } from './Toggle';

const noop = () => {};

function Named() {
  const id = useId();

  return (
    <>
      <span id={id}>Floor</span>
      <Toggle aria-labelledby={id} checked onCheckedChange={noop} />
    </>
  );
}

describe('Toggle', () => {
  it('is a switch reflecting checked', () => {
    const { rerender } = renderWithProviders(
      <Toggle label="Heating" checked onCheckedChange={noop} />,
    );
    const toggle = screen.getByRole('switch', { name: 'Heating' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    rerender(<Toggle label="Heating" checked={false} onCheckedChange={noop} />);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('requests the opposite value on click', () => {
    const onCheckedChange = vi.fn();
    renderWithProviders(
      <Toggle
        label="Heating"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('can be named by aria-labelledby', () => {
    renderWithProviders(<Named />);
    expect(screen.getByRole('switch', { name: 'Floor' })).toBeInTheDocument();
  });

  it('does not toggle when disabled', () => {
    const onCheckedChange = vi.fn();
    renderWithProviders(
      <Toggle
        label="Heating"
        disabled
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <Toggle label="Heating" checked onCheckedChange={noop} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
