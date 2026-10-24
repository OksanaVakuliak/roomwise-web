import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { renderWithProviders } from '@/test/render-with-providers';
import { StackBar } from './StackBar';

const segments = [
  { key: 'a', share: 60 },
  { key: 'b', share: 40 },
];

describe('StackBar', () => {
  it('exposes a text equivalent', () => {
    renderWithProviders(<StackBar segments={segments} label="Split" />);
    expect(screen.getByRole('img', { name: 'Split' })).toBeInTheDocument();
  });

  it('sets each segment share as a custom property', () => {
    renderWithProviders(<StackBar segments={segments} label="Split" />);
    const bar = screen.getByRole('img');
    expect(
      [...bar.children].map((node) =>
        (node as HTMLElement).style.getPropertyValue('--share'),
      ),
    ).toEqual(['60%', '40%']);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(
      <StackBar segments={segments} label="Split" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
