import { fireEvent, screen } from '@testing-library/react';
import { useCallback, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { BottomSheet } from './BottomSheet';

function Harness() {
  const [open, setOpen] = useState(false);
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <button type="button" onClick={handleOpen}>
        Open
      </button>
      <BottomSheet
        open={open}
        onClose={handleClose}
        title="Finish"
        closeLabel="Close"
      >
        <button type="button">Action</button>
      </BottomSheet>
    </>
  );
}

function openIt() {
  const trigger = screen.getByRole('button', { name: 'Open' });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

describe('BottomSheet', () => {
  it('is a named dialog that takes focus', () => {
    renderWithProviders(<Harness />);
    openIt();
    expect(screen.getByRole('dialog', { name: 'Finish' })).toHaveFocus();
  });

  it('traps focus between the first and last control', () => {
    renderWithProviders(<Harness />);
    openIt();
    const close = screen.getByRole('button', { name: 'Close' });
    const action = screen.getByRole('button', { name: 'Action' });
    action.focus();
    fireEvent.keyDown(action, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(action).toHaveFocus();
  });

  it('closes on Escape and returns focus to the opener', () => {
    renderWithProviders(<Harness />);
    const trigger = openIt();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('has no axe violations when open', async () => {
    renderWithProviders(<Harness />);
    openIt();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
