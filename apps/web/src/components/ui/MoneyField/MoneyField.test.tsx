import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { MoneyField } from './MoneyField';

const messages = {
  negativeMessage: 'Must not be negative',
  invalidMessage: 'Use at most two decimals',
};

function type(value: string) {
  fireEvent.change(screen.getByLabelText('Price'), { target: { value } });
}

describe('MoneyField', () => {
  it('shows the value in dollars with the currency unit', () => {
    renderWithProviders(
      <MoneyField
        label="Price"
        valueCents={1999}
        onChange={vi.fn()}
        {...messages}
      />,
    );
    expect(screen.getByLabelText('Price')).toHaveValue('19.99');
    expect(screen.getByText('USD')).toBeInTheDocument();
  });

  it('shows an empty field for null and uses a custom currency', () => {
    renderWithProviders(
      <MoneyField
        label="Price"
        valueCents={null}
        currency="UAH"
        onChange={vi.fn()}
        {...messages}
      />,
    );
    expect(screen.getByLabelText('Price')).toHaveValue('');
    expect(screen.getByText('UAH')).toBeInTheDocument();
  });

  it.each([
    ['19.99', 1999],
    ['19,99', 1999],
    ['19', 1900],
    ['19.5', 1950],
    ['0.1', 10],
    ['0.29', 29],
    ['1.15', 115],
    ['.5', 50],
    ['', null],
  ])('emits %j as %j cents', (text, cents) => {
    const onChange = vi.fn();
    renderWithProviders(
      <MoneyField
        label="Price"
        valueCents={12}
        onChange={onChange}
        {...messages}
      />,
    );
    type(text);
    expect(onChange).toHaveBeenCalledWith(cents);
  });

  it('flags a negative value and does not emit it', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MoneyField
        label="Price"
        valueCents={100}
        onChange={onChange}
        {...messages}
      />,
    );
    type('-5');
    expect(onChange).not.toHaveBeenCalled();
    const input = screen.getByLabelText('Price');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Must not be negative USD');
  });

  it('flags more than two decimals and does not emit it', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MoneyField
        label="Price"
        valueCents={100}
        onChange={onChange}
        {...messages}
      />,
    );
    type('1.234');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Price')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByText('Use at most two decimals')).toBeInTheDocument();
  });

  it('keeps what the user typed while the parent echoes cents', () => {
    function Harness() {
      const [cents, setCents] = useState<number | null>(null);
      return (
        <MoneyField
          label="Price"
          valueCents={cents}
          onChange={setCents}
          {...messages}
        />
      );
    }
    renderWithProviders(<Harness />);
    type('19');
    expect(screen.getByLabelText('Price')).toHaveValue('19');
    type('19.9');
    expect(screen.getByLabelText('Price')).toHaveValue('19.9');
  });

  it('follows an external value change', () => {
    const { rerender } = renderWithProviders(
      <MoneyField
        label="Price"
        valueCents={100}
        onChange={vi.fn()}
        {...messages}
      />,
    );
    rerender(
      <MoneyField
        label="Price"
        valueCents={2550}
        onChange={vi.fn()}
        {...messages}
      />,
    );
    expect(screen.getByLabelText('Price')).toHaveValue('25.50');
  });

  it('formats negative cents with a leading minus', () => {
    renderWithProviders(
      <MoneyField
        label="Price"
        valueCents={-250}
        onChange={vi.fn()}
        {...messages}
      />,
    );
    expect(screen.getByLabelText('Price')).toHaveValue('-2.50');
  });

  it('resyncs invalid text when resetKey changes to the same value', () => {
    const onValidityChange = vi.fn();
    const field = (resetKey: number) => (
      <MoneyField
        label="Price"
        valueCents={100}
        resetKey={resetKey}
        onChange={vi.fn()}
        onValidityChange={onValidityChange}
        {...messages}
      />
    );
    const { rerender } = renderWithProviders(field(0));
    type('abc');
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    rerender(field(0));
    expect(screen.getByLabelText('Price')).toHaveValue('abc');
    rerender(field(1));
    expect(screen.getByLabelText('Price')).toHaveValue('1.00');
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });

  it('prefers the consumer error', () => {
    renderWithProviders(
      <MoneyField
        label="Price"
        valueCents={100}
        error="Server says no"
        onChange={vi.fn()}
        {...messages}
      />,
    );
    expect(screen.getByText('Server says no')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <MoneyField
        label="Price"
        valueCents={1999}
        error="Required"
        onChange={vi.fn()}
        {...messages}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('onValidityChange', () => {
    function renderField(onValidityChange: (valid: boolean) => void) {
      renderWithProviders(
        <MoneyField
          label="Price"
          valueCents={null}
          onChange={vi.fn()}
          onValidityChange={onValidityChange}
          {...messages}
        />,
      );
    }

    it('does not fire on mount when valid', () => {
      const onValidityChange = vi.fn();
      renderField(onValidityChange);
      expect(onValidityChange).not.toHaveBeenCalled();
    });

    it('reports false when the text becomes invalid', () => {
      const onValidityChange = vi.fn();
      renderField(onValidityChange);
      type('1.234');
      expect(onValidityChange).toHaveBeenCalledTimes(1);
      expect(onValidityChange).toHaveBeenLastCalledWith(false);
    });

    it('reports true when the text becomes valid again', () => {
      const onValidityChange = vi.fn();
      renderField(onValidityChange);
      type('-5');
      type('5');
      expect(onValidityChange).toHaveBeenCalledTimes(2);
      expect(onValidityChange).toHaveBeenLastCalledWith(true);
    });

    it('does not fire again on repeated invalid input', () => {
      const onValidityChange = vi.fn();
      renderField(onValidityChange);
      type('-5');
      type('-50');
      type('abc');
      expect(onValidityChange).toHaveBeenCalledTimes(1);
    });

    it('treats empty input as valid', () => {
      const onValidityChange = vi.fn();
      renderField(onValidityChange);
      type('abc');
      type('');
      expect(onValidityChange).toHaveBeenLastCalledWith(true);
    });

    it('reports true when the value is replaced from outside', () => {
      const onValidityChange = vi.fn();
      const field = (valueCents: number | null) => (
        <MoneyField
          label="Price"
          valueCents={valueCents}
          onChange={vi.fn()}
          onValidityChange={onValidityChange}
          {...messages}
        />
      );
      const { rerender } = renderWithProviders(field(100));
      type('-5');
      rerender(field(2500));
      expect(screen.getByLabelText('Price')).toHaveValue('25.00');
      expect(onValidityChange).toHaveBeenLastCalledWith(true);
    });
  });
});
