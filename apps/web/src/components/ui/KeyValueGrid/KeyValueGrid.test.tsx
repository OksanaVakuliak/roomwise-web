import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { KeyValueGrid } from './KeyValueGrid';

const items = [
  { key: 'type', label: 'Type', value: 'Apartment' },
  { key: 'area', label: 'Area', value: '58 m²' },
];

describe('KeyValueGrid', () => {
  it('pairs terms with their descriptions', () => {
    renderWithProviders(<KeyValueGrid items={items} />);
    expect(screen.getAllByRole('term').map((n) => n.textContent)).toEqual([
      'Type',
      'Area',
    ]);
    expect(screen.getAllByRole('definition').map((n) => n.textContent)).toEqual(
      ['Apartment', '58 m²'],
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<KeyValueGrid items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
