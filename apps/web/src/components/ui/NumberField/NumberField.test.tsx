import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { NumberField } from './NumberField';

describe('NumberField', () => {
  it('is a number input associated with its label', () => {
    renderWithProviders(<NumberField label="Length" defaultValue={4.2} />);
    const input = screen.getByLabelText('Length');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveValue(4.2);
  });

  it('shows the unit and includes it in the description', () => {
    renderWithProviders(
      <NumberField label="Area" unit="m²" hint="Floor only" error="Too big" />,
    );
    const input = screen.getByLabelText('Area');
    expect(screen.getByText('m²')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Floor only Too big m²');
  });

  it('is busy while loading', () => {
    renderWithProviders(<NumberField label="Area" loading />);
    expect(screen.getByLabelText('Area')).toHaveAttribute('aria-busy', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <>
        <NumberField label="Area" unit="m²" hint="Hint" />
        <NumberField label="Height" unit="m" error="Invalid" disabled />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps a consumer aria-describedby next to the unit', () => {
    renderWithProviders(
      <NumberField label="Width" unit="m" aria-describedby="extra" />,
    );
    const describedBy = screen
      .getByLabelText('Width')
      .getAttribute('aria-describedby');
    expect(describedBy?.split(' ')[0]).toBe('extra');
    expect(describedBy?.split(' ')).toHaveLength(2);
  });
});
