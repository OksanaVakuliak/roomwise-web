import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { FileField } from './FileField';

const texts = { buttonLabel: 'Choose file', emptyLabel: 'No file chosen' };

describe('FileField', () => {
  it('associates the label with the file input', () => {
    renderWithProviders(<FileField label="Floor plan" {...texts} />);
    expect(screen.getByLabelText('Floor plan')).toHaveAttribute('type', 'file');
    expect(screen.getByText('No file chosen')).toBeInTheDocument();
  });

  it('shows the chosen file name', () => {
    renderWithProviders(<FileField label="Floor plan" {...texts} />);
    const file = new File(['x'], 'plan.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Floor plan'), {
      target: { files: [file] },
    });
    expect(screen.getByText('plan.pdf')).toBeInTheDocument();
  });

  it('describes the control and flags errors', () => {
    renderWithProviders(
      <FileField label="Floor plan" {...texts} hint="PDF" error="Too large" />,
    );
    const input = screen.getByLabelText('Floor plan');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('PDF Too large');
  });

  it('is busy and aria-disabled but focusable while uploading', () => {
    renderWithProviders(
      <FileField
        label="Floor plan"
        {...texts}
        loading
        loadingLabel="Uploading"
      />,
    );
    const input = screen.getByLabelText(/Floor plan/);
    expect(input).toHaveAttribute('aria-busy', 'true');
    expect(input).toHaveAttribute('aria-disabled', 'true');
    expect(input).not.toBeDisabled();
    expect(fireEvent.click(input)).toBe(false);
    expect(screen.getByText('Uploading')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <>
        <FileField label="Plan" {...texts} hint="Hint" />
        <FileField label="Photo" {...texts} error="Invalid" />
        <FileField label="Doc" {...texts} loading loadingLabel="Uploading" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
