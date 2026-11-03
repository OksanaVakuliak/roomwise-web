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
    expect(input).toHaveAccessibleDescription(/^Share it\s*$/);
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

  it('calls a consumer onFocus and still selects the text', () => {
    const onFocus = vi.fn();
    renderWithProviders(
      <CopyField
        label="Link"
        value={URL_VALUE}
        copyLabel="Copy"
        copiedLabel="Copied"
        fallbackLabel="Press Ctrl+C"
        onFocus={onFocus}
      />,
    );
    const input = screen.getByLabelText('Link') as HTMLInputElement;
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(input.selectionEnd).toBe(URL_VALUE.length);
  });

  it('describes the input with the status message', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    renderField();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Link')).toHaveAccessibleDescription(
        'Share it Copied',
      ),
    );
  });

  it('clears the status when the value changes', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const props = {
      label: 'Link',
      copyLabel: 'Copy',
      copiedLabel: 'Copied',
      fallbackLabel: 'Press Ctrl+C',
    };
    const { rerender } = renderWithProviders(
      <CopyField {...props} value={URL_VALUE} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Copied'),
    );
    rerender(<CopyField {...props} value={`${URL_VALUE}2`} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('replaces a copied status when a later copy fails', async () => {
    const writeText = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('denied'));
    stubClipboard(writeText);
    document.execCommand = vi.fn().mockReturnValue(false);
    renderField();
    const copy = screen.getByRole('button', { name: 'Copy' });
    fireEvent.click(copy);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Copied'),
    );
    fireEvent.click(copy);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Press Ctrl+C'),
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderField();
    expect(await axe(container)).toHaveNoViolations();
  });
});
