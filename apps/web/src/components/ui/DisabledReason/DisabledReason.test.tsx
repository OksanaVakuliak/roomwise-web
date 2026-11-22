import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { DisabledReason } from './DisabledReason';

function setup(onClick = vi.fn()) {
  const view = renderWithProviders(
    <DisabledReason reason="Not available in demo mode">
      <button type="button" onClick={onClick}>
        Delete
      </button>
    </DisabledReason>,
  );
  return { ...view, onClick };
}

describe('DisabledReason', () => {
  it('marks the child aria-disabled but keeps it focusable', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    button.focus();
    expect(button).toHaveFocus();
  });

  it('explains the reason through the tooltip', () => {
    setup();
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveAccessibleDescription('Not available in demo mode');
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Not available in demo mode',
    );
  });

  it('does not fire the action on click', () => {
    const { onClick } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('cancels Enter and Space so the browser never clicks', () => {
    const { onClick } = setup();
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(fireEvent.keyDown(button, { key: 'Enter' })).toBe(false);
    expect(fireEvent.keyDown(button, { key: ' ' })).toBe(false);
    expect(fireEvent.keyUp(button, { key: ' ' })).toBe(false);
    expect(fireEvent.keyDown(button, { key: 'Tab' })).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has no axe violations', async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
