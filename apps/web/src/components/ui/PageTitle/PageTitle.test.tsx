import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { PageTitle } from './PageTitle';

describe('PageTitle', () => {
  it('renders a level one heading', () => {
    render(<PageTitle>Object</PageTitle>);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Object' }),
    ).toBeInTheDocument();
  });

  it('passes the class name through', () => {
    render(<PageTitle className="extra">Object</PageTitle>);
    expect(screen.getByRole('heading')).toHaveClass('extra');
  });

  it('has no axe violations', async () => {
    const { container } = render(<PageTitle>Object</PageTitle>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
