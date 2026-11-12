import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { SceneToolbar } from './SceneToolbar';

describe('SceneToolbar', () => {
  it('renders one labelled button per action', () => {
    render(
      <SceneToolbar
        actions={[
          { id: 'reset', label: 'Reset', icon: 'resetView', onClick: vi.fn() },
          { id: 'top', label: 'Top', icon: 'topView', onClick: vi.fn() },
        ]}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('calls onClick of the pressed action', () => {
    const onClick = vi.fn();
    render(
      <SceneToolbar
        actions={[{ id: 'reset', label: 'Reset', icon: 'resetView', onClick }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('exposes the pressed state only when provided', () => {
    render(
      <SceneToolbar
        actions={[
          {
            id: 'toggle',
            label: 'Toggle',
            icon: 'resetView',
            onClick: vi.fn(),
            pressed: true,
          },
          { id: 'plain', label: 'Plain', icon: 'topView', onClick: vi.fn() },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Toggle' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Plain' })).not.toHaveAttribute(
      'aria-pressed',
    );
  });

  it('disables only the actions marked as disabled', () => {
    const onClick = vi.fn();
    render(
      <SceneToolbar
        actions={[
          {
            id: 'reset',
            label: 'Reset',
            icon: 'resetView',
            onClick,
            disabled: true,
          },
          { id: 'top', label: 'Top', icon: 'topView', onClick: vi.fn() },
        ]}
      />,
    );
    const reset = screen.getByRole('button', { name: 'Reset' });
    expect(reset).toBeDisabled();
    fireEvent.click(reset);
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Top' })).toBeEnabled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SceneToolbar
        actions={[
          { id: 'reset', label: 'Reset', icon: 'resetView', onClick: vi.fn() },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
