import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

function setup(props: Partial<ConfirmDialogProps> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <ConfirmDialog
      open
      title="Delete room"
      description="The materials chosen for this room will be lost."
      confirmLabel="Delete"
      cancelLabel="Keep"
      closeLabel="Close"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the title and the description', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Delete room' })).toBeVisible();
    expect(
      screen.getByText('The materials chosen for this room will be lost.'),
    ).toBeVisible();
  });

  it('puts initial focus on the safe action', async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Keep' })).toHaveFocus(),
    );
  });

  it('cancels on Escape', () => {
    const { onCancel, onConfirm } = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels from the cancel and close buttons', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('does not cancel on backdrop click', () => {
    const { onCancel } = setup();
    fireEvent.click(
      screen.getByRole('dialog').previousElementSibling as Element,
    );
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('confirms from the confirm button', () => {
    const { onConfirm, onCancel } = setup({ tone: 'danger' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    setup();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
