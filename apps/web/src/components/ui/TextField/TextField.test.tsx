import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { TextField } from './TextField';

describe('TextField', () => {
  it('associates the label and forwards native props', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <TextField
        label="Name"
        name="name"
        placeholder="Room"
        onChange={onChange}
      />,
    );
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('name', 'name');
    fireEvent.change(input, { target: { value: 'Kitchen' } });
    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue('Kitchen');
  });

  it('describes the control by hint and error and flags it invalid', () => {
    renderWithProviders(
      <TextField label="Name" hint="Shown on the plan" error="Required" />,
    );
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Shown on the plan Required');
  });

  it('is busy and read only while loading', () => {
    renderWithProviders(<TextField label="Name" loading />);
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(input).toHaveAttribute('readonly');
  });

  it('supports the disabled state', () => {
    renderWithProviders(<TextField label="Name" disabled />);
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <>
        <TextField label="Name" hint="Hint" />
        <TextField label="Email" error="Invalid" required />
        <TextField label="City" loading loadingLabel="Loading" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps a consumer aria-describedby with and without hint and error', () => {
    const { rerender } = renderWithProviders(
      <TextField label="Name" aria-describedby="extra" />,
    );
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-describedby',
      'extra',
    );
    rerender(
      <TextField
        label="Name"
        aria-describedby="extra"
        hint="Hint"
        error="Bad"
      />,
    );
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-describedby',
      expect.stringMatching(/^extra \S+-hint \S+-error$/),
    );
  });

  it('respects a consumer aria-invalid when there is no error', () => {
    renderWithProviders(<TextField label="Name" aria-invalid="true" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
