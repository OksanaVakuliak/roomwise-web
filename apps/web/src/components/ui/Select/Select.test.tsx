import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { Select } from './Select';

const options = (
  <>
    <option value="tile">Tile</option>
    <option value="wood">Wood</option>
  </>
);

describe('Select', () => {
  it('is a native select named by its label', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Select label="Floor" onChange={onChange}>
        {options}
      </Select>,
    );
    const select = screen.getByRole('combobox', { name: 'Floor' });
    fireEvent.change(select, { target: { value: 'wood' } });
    expect(onChange).toHaveBeenCalled();
    expect(select).toHaveValue('wood');
  });

  it('starts on a disabled placeholder', () => {
    renderWithProviders(
      <Select label="Floor" placeholder="Choose">
        {options}
      </Select>,
    );
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Choose' })).toBeDisabled();
  });

  it('describes the control and flags errors', () => {
    renderWithProviders(
      <Select label="Floor" hint="Main covering" error="Required">
        {options}
      </Select>,
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Main covering Required');
  });

  it('is busy and aria-disabled but focusable while loading', () => {
    renderWithProviders(
      <Select label="Floor" loading>
        {options}
      </Select>,
    );
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-busy', 'true');
    expect(select).toHaveAttribute('aria-disabled', 'true');
    expect(select).not.toBeDisabled();
    expect(fireEvent.mouseDown(select)).toBe(false);
    expect(fireEvent.keyDown(select, { key: 'ArrowDown' })).toBe(false);
    expect(fireEvent.keyDown(select, { key: 'Tab' })).toBe(true);
  });

  it('is really disabled only with the disabled prop', () => {
    renderWithProviders(
      <Select label="Floor" disabled>
        {options}
      </Select>,
    );
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <>
        <Select label="Floor" placeholder="Choose" hint="Hint">
          {options}
        </Select>
        <Select label="Wall" error="Invalid" required>
          {options}
        </Select>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
