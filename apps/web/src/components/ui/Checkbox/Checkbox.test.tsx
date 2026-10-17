import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('is a checkbox named by its label that toggles', () => {
    const onChange = vi.fn();
    renderWithProviders(<Checkbox label="Heated floor" onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Heated floor' });
    fireEvent.click(box);
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('describes the control and flags errors', () => {
    renderWithProviders(
      <Checkbox label="Terms" hint="Read first" error="Must accept" />,
    );
    const box = screen.getByRole('checkbox');
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveAccessibleDescription('Read first Must accept');
  });

  it('supports the disabled state', () => {
    renderWithProviders(<Checkbox label="Terms" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <>
        <Checkbox label="One" hint="Hint" defaultChecked />
        <Checkbox label="Two" error="Invalid" />
        <Checkbox label="Three" disabled />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
