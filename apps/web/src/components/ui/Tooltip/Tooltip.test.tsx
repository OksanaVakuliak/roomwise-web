import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { Tooltip } from './Tooltip';

function setup() {
  const view = renderWithProviders(
    <Tooltip content="Includes labour">
      <button type="button">Price</button>
    </Tooltip>,
  );
  return { ...view, button: screen.getByRole('button', { name: 'Price' }) };
}

describe('Tooltip', () => {
  it('is hidden until hovered and linked by aria-describedby', () => {
    const { button } = setup();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.mouseEnter(button);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Includes labour');
    expect(button).toHaveAccessibleDescription('Includes labour');
    fireEvent.mouseLeave(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows on keyboard focus and hides on blur', () => {
    const { button } = setup();
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.blur(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides on Escape and shows again on the next focus', () => {
    const { button } = setup();
    fireEvent.focus(button);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.blur(button);
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('has no axe violations when shown', async () => {
    const { button, container } = setup();
    fireEvent.focus(button);
    expect(await axe(container)).toHaveNoViolations();
  });
});
