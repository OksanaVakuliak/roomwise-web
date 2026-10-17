import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { RadioCard } from './RadioCard';

describe('RadioCard', () => {
  it('is a radio named by its title and description', () => {
    renderWithProviders(
      <RadioCard name="s" value="a" label="Loft" description="Raw and open" />,
    );
    const radio = screen.getByRole('radio', { name: 'Loft' });
    expect(radio).toHaveAccessibleDescription('Raw and open');
  });

  it('selects exclusively within a name', () => {
    renderWithProviders(
      <>
        <RadioCard name="s" value="a" label="Loft" />
        <RadioCard name="s" value="b" label="Classic" />
      </>,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Loft' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Classic' }));
    expect(screen.getByRole('radio', { name: 'Loft' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Classic' })).toBeChecked();
  });

  it('supports the disabled state', () => {
    renderWithProviders(<RadioCard name="s" value="a" label="Loft" disabled />);
    expect(screen.getByRole('radio')).toBeDisabled();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <>
        <RadioCard name="s" value="a" label="Loft" description="Open" />
        <RadioCard name="s" value="b" label="Classic" defaultChecked />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
