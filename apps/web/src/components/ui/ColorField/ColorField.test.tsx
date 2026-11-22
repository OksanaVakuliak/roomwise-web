import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { ColorField } from './ColorField';

const props = { pickerLabel: 'Pick colour', invalidMessage: 'Use #RRGGBB' };

describe('ColorField', () => {
  it('renders the text and the native picker with the same value', () => {
    renderWithProviders(
      <ColorField
        label="Colour"
        value="#3b3f45"
        onChange={vi.fn()}
        {...props}
      />,
    );
    expect(screen.getByLabelText('Colour')).toHaveValue('#3b3f45');
    const picker = screen.getByLabelText('Pick colour');
    expect(picker).toHaveAttribute('type', 'color');
    expect(picker).toHaveValue('#3b3f45');
  });

  it('emits a lowercase value from the text input', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ColorField
        label="Colour"
        value="#3b3f45"
        onChange={onChange}
        {...props}
      />,
    );
    fireEvent.change(screen.getByLabelText('Colour'), {
      target: { value: '#AABBCC' },
    });
    expect(onChange).toHaveBeenCalledWith('#aabbcc');
    expect(screen.getByLabelText('Colour')).not.toHaveAttribute('aria-invalid');
  });

  it('emits the picked colour', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ColorField
        label="Colour"
        value="#3b3f45"
        onChange={onChange}
        {...props}
      />,
    );
    fireEvent.change(screen.getByLabelText('Pick colour'), {
      target: { value: '#ff0000' },
    });
    expect(onChange).toHaveBeenCalledWith('#ff0000');
    expect(screen.getByLabelText('Colour')).toHaveValue('#ff0000');
  });

  it.each(['#12345', '123456', '#GGGGGG', ''])(
    'shows an error and does not emit %j',
    (text) => {
      const onChange = vi.fn();
      renderWithProviders(
        <ColorField
          label="Colour"
          value="#3b3f45"
          onChange={onChange}
          {...props}
        />,
      );
      fireEvent.change(screen.getByLabelText('Colour'), {
        target: { value: text },
      });
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByLabelText('Colour')).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(screen.getByText('Use #RRGGBB')).toBeInTheDocument();
      expect(screen.getByLabelText('Pick colour')).toHaveValue('#3b3f45');
    },
  );

  it('syncs the text when the value changes from outside', () => {
    const { rerender } = renderWithProviders(
      <ColorField
        label="Colour"
        value="#3b3f45"
        onChange={vi.fn()}
        {...props}
      />,
    );
    rerender(
      <ColorField
        label="Colour"
        value="#112233"
        onChange={vi.fn()}
        {...props}
      />,
    );
    expect(screen.getByLabelText('Colour')).toHaveValue('#112233');
    expect(screen.getByLabelText('Pick colour')).toHaveValue('#112233');
  });

  it('does not show an error for an empty value before any edit', () => {
    renderWithProviders(
      <ColorField label="Colour" value="" onChange={vi.fn()} {...props} />,
    );
    expect(screen.queryByText('Use #RRGGBB')).toBeNull();
    expect(screen.getByLabelText('Colour')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('Pick colour')).toHaveValue('#000000');
  });

  it('resyncs invalid text when resetKey changes to the same value', () => {
    const field = (resetKey: number) => (
      <ColorField
        label="Colour"
        value="#3b3f45"
        resetKey={resetKey}
        onChange={vi.fn()}
        {...props}
      />
    );
    const { rerender } = renderWithProviders(field(0));
    fireEvent.change(screen.getByLabelText('Colour'), {
      target: { value: '#12' },
    });
    expect(screen.getByText('Use #RRGGBB')).toBeInTheDocument();
    rerender(field(1));
    expect(screen.getByLabelText('Colour')).toHaveValue('#3b3f45');
    expect(screen.queryByText('Use #RRGGBB')).toBeNull();
  });

  it('shows the consumer error', () => {
    renderWithProviders(
      <ColorField
        label="Colour"
        value="#3b3f45"
        error="Taken"
        onChange={vi.fn()}
        {...props}
      />,
    );
    expect(screen.getByLabelText('Colour')).toHaveAccessibleDescription(
      'Taken',
    );
  });

  it('supports the disabled state', () => {
    renderWithProviders(
      <ColorField
        label="Colour"
        value="#3b3f45"
        disabled
        onChange={vi.fn()}
        {...props}
      />,
    );
    expect(screen.getByLabelText('Colour')).toBeDisabled();
    expect(screen.getByLabelText('Pick colour')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <>
        <ColorField
          label="Colour"
          value="#3b3f45"
          hint="Hint"
          onChange={vi.fn()}
          {...props}
        />
        <ColorField
          label="Other"
          value="#3b3f45"
          error="Bad"
          required
          onChange={vi.fn()}
          {...props}
        />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
