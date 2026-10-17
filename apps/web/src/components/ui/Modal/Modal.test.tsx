import { fireEvent, screen } from '@testing-library/react';
import { useCallback, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { Tooltip } from '../Tooltip/Tooltip';
import { Modal, type ModalProps } from './Modal';

function Harness({
  onClose,
  children,
  ...rest
}: Partial<ModalProps> & { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => {
    onClose?.();
    setOpen(false);
  }, [onClose]);

  return (
    <>
      <button type="button" onClick={handleOpen}>
        Open
      </button>
      <Modal
        open={open}
        onClose={handleClose}
        title="Estimate"
        closeLabel="Close"
        {...rest}
      >
        <button type="button">First</button>
        <button type="button">Last</button>
        {children}
      </Modal>
    </>
  );
}

function openModal() {
  const trigger = screen.getByRole('button', { name: 'Open' });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

describe('Modal', () => {
  it('renders nothing while closed', () => {
    renderWithProviders(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a named modal dialog that takes focus', () => {
    renderWithProviders(<Harness />);
    openModal();
    const dialog = screen.getByRole('dialog', { name: 'Estimate' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveFocus();
  });

  it('wraps Tab and Shift+Tab inside the dialog', () => {
    renderWithProviders(<Harness />);
    openModal();
    const close = screen.getByRole('button', { name: 'Close' });
    const last = screen.getByRole('button', { name: 'Last' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('skips hidden and tabindex -1 elements when wrapping Tab', () => {
    renderWithProviders(
      <Harness>
        <button type="button" hidden>
          Hidden
        </button>
        <button type="button" tabIndex={-1}>
          Skipped
        </button>
      </Harness>,
    );
    openModal();
    const close = screen.getByRole('button', { name: 'Close' });
    const last = screen.getByRole('button', { name: 'Last' });
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(close).toHaveFocus();
  });

  it('makes the rest of the page inert and locks scroll', () => {
    const { container } = renderWithProviders(<Harness />);
    openModal();
    expect(container).toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(container).not.toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('');
  });

  it('closes on Escape and returns focus to the opener', () => {
    const onClose = vi.fn();
    renderWithProviders(<Harness onClose={onClose} />);
    const trigger = openModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes from the close button', () => {
    renderWithProviders(<Harness />);
    openModal();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on backdrop click', () => {
    renderWithProviders(<Harness />);
    openModal();
    fireEvent.click(
      screen.getByRole('dialog').previousElementSibling as Element,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the dialog open on backdrop click when disabled', () => {
    renderWithProviders(<Harness dismissOnBackdrop={false} />);
    openModal();
    fireEvent.click(
      screen.getByRole('dialog').previousElementSibling as Element,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has no axe violations when open', async () => {
    renderWithProviders(<Harness />);
    openModal();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('closes only the top dialog on Escape', () => {
    const onCloseA = vi.fn();
    const onCloseB = vi.fn();
    renderWithProviders(
      <>
        <Modal open onClose={onCloseA} title="A" closeLabel="Close A">
          <p>a</p>
        </Modal>
        <Modal open onClose={onCloseB} title="B" closeLabel="Close B">
          <p>b</p>
        </Modal>
      </>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseB).toHaveBeenCalledTimes(1);
    expect(onCloseA).not.toHaveBeenCalled();
  });

  it('hides a tooltip on Escape without closing the dialog', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal open onClose={onClose} title="A" closeLabel="Close">
        <Tooltip content="Hint">
          <button type="button">Target</button>
        </Tooltip>
      </Modal>,
    );
    const target = screen.getByRole('button', { name: 'Target' });
    fireEvent.focus(target);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(target, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(target, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the page locked when dialogs close out of order', () => {
    const noop = () => {};
    const background = document.createElement('div');
    const preInert = document.createElement('div');
    preInert.setAttribute('inert', '');
    document.body.append(background, preInert);
    const tree = (a: boolean, b: boolean) => (
      <>
        <Modal open={a} onClose={noop} title="A" closeLabel="Close A">
          <p>a</p>
        </Modal>
        <Modal open={b} onClose={noop} title="B" closeLabel="Close B">
          <p>b</p>
        </Modal>
      </>
    );
    const { rerender } = renderWithProviders(tree(true, false));
    rerender(tree(true, true));
    rerender(tree(false, true));
    expect(document.body.style.overflow).toBe('hidden');
    expect(background).toHaveAttribute('inert');
    rerender(tree(false, false));
    expect(document.body.style.overflow).toBe('');
    expect(background).not.toHaveAttribute('inert');
    expect(preInert).toHaveAttribute('inert');
    background.remove();
    preInert.remove();
  });
});
