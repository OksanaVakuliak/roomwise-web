import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('uses the label as accessible name', () => {
    renderWithProviders(<IconButton icon="close" label="Close" />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onClick and respects disabled', () => {
    const onClick = vi.fn();
    const { rerender } = renderWithProviders(
      <IconButton icon="plus" label="Add" onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<IconButton icon="plus" label="Add" onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <IconButton icon="close" label="Close" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
