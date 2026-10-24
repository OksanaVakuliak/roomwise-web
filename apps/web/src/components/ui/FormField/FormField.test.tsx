import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { FormField } from './FormField';

describe('FormField', () => {
  it('wires the label, hint and error to the control', () => {
    renderWithProviders(
      <FormField label="Width" hint="In metres" error="Too narrow" required>
        {(control) => <input {...control} />}
      </FormField>,
    );
    const input = screen.getByLabelText(/Width/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('In metres Too narrow');
  });

  it('omits invalid and described-by when there is no hint or error', () => {
    renderWithProviders(
      <FormField label="Width">
        {(control) => <input {...control} />}
      </FormField>,
    );
    const input = screen.getByLabelText('Width');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('marks the control busy and announces the loading label', () => {
    renderWithProviders(
      <FormField label="Width" loading loadingLabel="Saving">
        {(control) => <input {...control} />}
      </FormField>,
    );
    expect(screen.getByLabelText(/Width/)).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Saving')).toBeInTheDocument();
  });

  it('renders a fieldset with a legend as a group', () => {
    renderWithProviders(
      <FormField label="Kind" hint="Pick one" group>
        {() => <input type="radio" aria-label="A" />}
      </FormField>,
    );
    const group = screen.getByRole('group', { name: 'Kind' });
    expect(group).toHaveAccessibleDescription('Pick one');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <FormField label="Width" hint="In metres" error="Too narrow" loading>
        {(control) => <input {...control} />}
      </FormField>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
