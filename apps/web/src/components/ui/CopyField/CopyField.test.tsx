import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { CopyField } from './CopyField';

const URL_VALUE = 'https://roomwise.example/en/calculations/abc/v/1';

function renderField() {
  return renderWithProviders(
    <CopyField
      label="Link"
      hint="Share it"
      value={URL_VALUE}
      copyLabel="Copy"
      copiedLabel="Copied"
      fallbackLabel="Press Ctrl+C"
    />,
  );
}

function stubClipboard(writeText: unknown) {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText === undefined ? undefined : { writeText },
    configurable: true,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'clipboard');
  Reflect.deleteProperty(document, 'execCommand');
});

describe('CopyField', () => {
  it('shows the value in a read only input', () => {
    renderField();
    const input = screen.getByLabelText('Link');
    expect(input).toHaveValue(URL_VALUE);
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveAccessibleDescription('Share it');
  });

  it('writes the value to the clipboard and announces it politely', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    renderField();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Copied'),
    );
    expect(writeText).toHaveBeenCalledWith(URL_VALUE);
  });

  it('selects the text and shows the hint when the clipboard is missing', async () => {
    stubClipboard(undefined);
    document.execCommand = vi.fn().mockReturnValue(false);
    renderField();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Press Ctrl+C'),
    );
    const input = screen.getByLabelText('Link') as HTMLInputElement;
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(URL_VALUE.length);
  });

  it('falls back to execCommand when the clipboard rejects', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand;
    renderField();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Copied'),
    );
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('has no axe violations', async () => {
    const { container } = renderField();
    expect(await axe(container)).toHaveNoViolations();
  });
});
