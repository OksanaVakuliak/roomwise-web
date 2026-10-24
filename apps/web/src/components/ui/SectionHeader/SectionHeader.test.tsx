import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from '@/test/axe';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('renders the title as an h2 by default', () => {
    render(<SectionHeader title="Materials" />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Materials' }),
    ).toBeInTheDocument();
  });

  it('supports other heading levels and an id', () => {
    const id = 'materials';
    render(<SectionHeader title="Materials" level={3} id={id} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('id', id);
  });

  it('renders a note when meta is on', () => {
    render(<SectionHeader title="Cut A-A" note="thickness enlarged" />);
    expect(screen.getByText('thickness enlarged')).toBeInTheDocument();
  });

  it('renders an amount when meta is amount', () => {
    render(<SectionHeader title="Bedroom" amount="$1,214.60" size="desktop" />);
    expect(screen.getByText('$1,214.60')).toHaveClass('num');
  });

  it('omits meta when none is given', () => {
    const { container } = render(<SectionHeader title="Materials" />);
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <SectionHeader title="Bedroom" amount="$1,214.60" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
