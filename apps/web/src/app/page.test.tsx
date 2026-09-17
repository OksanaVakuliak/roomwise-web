import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the Roomwise heading', () => {
    render(<HomePage />);

    expect(screen.getByText('Roomwise')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<HomePage />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
