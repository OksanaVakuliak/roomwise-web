import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { RadioCard } from '../RadioCard/RadioCard';
import { RadioCardGroup } from './RadioCardGroup';

function Group({ error }: { error?: string }) {
  return (
    <RadioCardGroup label="Style" hint="Pick one" error={error}>
      <RadioCard name="style" value="a" label="Loft" />
      <RadioCard name="style" value="b" label="Classic" />
    </RadioCardGroup>
  );
}

describe('RadioCardGroup', () => {
  it('groups the cards under a legend', () => {
    renderWithProviders(<Group />);
    const group = screen.getByRole('group', { name: 'Style' });
    expect(within(group).getAllByRole('radio')).toHaveLength(2);
    expect(group).toHaveAccessibleDescription('Pick one');
  });

  it('shows the error in the group description', () => {
    renderWithProviders(<Group error="Choose a style" />);
    expect(screen.getByRole('group')).toHaveAccessibleDescription(
      'Pick one Choose a style',
    );
  });

  it('marks the group busy while loading', () => {
    renderWithProviders(
      <RadioCardGroup label="Style" loading>
        <RadioCard name="style" value="a" label="Loft" />
      </RadioCardGroup>,
    );
    expect(screen.getByRole('group')).toHaveAttribute('aria-busy', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<Group error="Choose a style" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
